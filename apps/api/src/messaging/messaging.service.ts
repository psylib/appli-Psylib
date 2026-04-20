import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { AuditService } from '../common/audit.service';
import type { ConversationSummaryDto, MessageDto } from './dto/messaging.dto';
import type { Conversation, Message } from '@prisma/client';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Récupère ou crée une conversation entre un psychologue et un patient.
   * Multi-tenant: la conversation est liée au profil psychologue (pas userId).
   */
  async getOrCreateConversation(
    psyUserId: string,
    patientId: string,
  ): Promise<Conversation> {
    const psy = await this.getPsychologist(psyUserId);

    // Vérifier que le patient appartient à ce psy (isolation tenant)
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, psychologistId: psy.id },
    });
    if (!patient) {
      throw new NotFoundException('Patient introuvable ou non autorisé');
    }

    const existing = await this.prisma.conversation.findUnique({
      where: {
        psychologistId_patientId: {
          psychologistId: psy.id,
          patientId,
        },
      },
    });

    if (existing) return existing;

    const conversation = await this.prisma.conversation.create({
      data: {
        psychologistId: psy.id,
        patientId,
      },
    });

    this.logger.log(
      `Conversation créée: ${conversation.id} (psy: ${psy.id}, patient: ${patientId})`,
    );

    return conversation;
  }

  /**
   * Retourne toutes les conversations d'un utilisateur avec le dernier message
   * et le nombre de messages non lus.
   * - Psychologue: toutes ses conversations
   * - Patient: toutes ses conversations
   */
  async getConversations(
    userId: string,
    role: 'psychologist' | 'patient',
  ): Promise<ConversationSummaryDto[]> {
    type ConvWithRelations = Conversation & {
      messages: Message[];
      patient?: { id: string; name: string } | null;
      psychologist?: { id: string; name: string } | null;
    };

    let conversations: ConvWithRelations[];

    if (role === 'psychologist') {
      const psy = await this.getPsychologist(userId);
      conversations = await this.prisma.conversation.findMany({
        where: { psychologistId: psy.id },
        include: {
          patient: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Patient: chercher via patient.userId
      const patient = await this.prisma.patient.findFirst({
        where: { userId },
      });
      if (!patient) {
        return [];
      }
      conversations = await this.prisma.conversation.findMany({
        where: { patientId: patient.id },
        include: {
          psychologist: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Compter les non-lus en une seule requête groupée (pas de N+1)
    const conversationIds = conversations.map((c) => c.id);
    const unreadGroups = conversationIds.length > 0
      ? await this.prisma.message.groupBy({
          by: ['conversationId'],
          where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
            readAt: null,
          },
          _count: { id: true },
        })
      : [];
    const unreadMap = new Map(
      unreadGroups.map((g) => [g.conversationId, g._count.id]),
    );

    return conversations.map((conv) => {
      const lastRaw = conv.messages[0] ?? null;
      let lastMessage: MessageDto | null = null;

      if (lastRaw) {
        lastMessage = {
          id: lastRaw.id,
          conversationId: lastRaw.conversationId,
          senderId: lastRaw.senderId,
          content: this.safeDecrypt(lastRaw.content),
          readAt: lastRaw.readAt,
          createdAt: lastRaw.createdAt,
        };
      }

      return {
        id: conv.id,
        psychologistId: conv.psychologistId,
        patientId: conv.patientId,
        createdAt: conv.createdAt,
        lastMessage,
        unreadCount: unreadMap.get(conv.id) ?? 0,
        patient: conv.patient ?? undefined,
        psychologist: conv.psychologist ?? undefined,
      };
    });
  }

  /**
   * Retourne tous les messages d'une conversation, déchiffrés.
   * Vérifie que l'utilisateur est bien membre de la conversation.
   */
  async getMessages(
    conversationId: string,
    userId: string,
  ): Promise<MessageDto[]> {
    await this.assertConversationAccess(conversationId, userId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    await this.audit.logRead(userId, 'psychologist', 'messages', conversationId);

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: this.safeDecrypt(m.content),
      readAt: m.readAt,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Envoie un message dans une conversation.
   * Chiffre le contenu avant persistance (HDS obligatoire).
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<MessageDto> {
    await this.assertConversationAccess(conversationId, senderId);

    const encryptedContent = this.encryption.encrypt(content);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: encryptedContent,
      },
    });

    await this.audit.log({
      actorId: senderId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'message',
      entityId: message.id,
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content, // retourner le contenu en clair (pas besoin de re-déchiffrer)
      readAt: message.readAt,
      createdAt: message.createdAt,
    };
  }

  /**
   * Marque tous les messages reçus dans une conversation comme lus.
   * Ne marque que les messages envoyés par l'autre partie.
   */
  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.assertConversationAccess(conversationId, userId);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'messages',
      entityId: conversationId,
      metadata: { action: 'mark_read' },
    });
  }

  /**
   * Compte le nombre total de messages non lus pour un utilisateur.
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Chercher si l'utilisateur est un psychologue
    const psyProfile = await this.prisma.psychologist.findUnique({
      where: { userId },
      select: { id: true },
    });

    // Chercher si l'utilisateur est un patient
    const patientProfile = psyProfile
      ? null
      : await this.prisma.patient.findFirst({
          where: { userId },
          select: { id: true },
        });

    let conversations: { id: string }[] = [];

    if (psyProfile) {
      conversations = await this.prisma.conversation.findMany({
        where: { psychologistId: psyProfile.id },
        select: { id: true },
      });
    } else if (patientProfile) {
      conversations = await this.prisma.conversation.findMany({
        where: { patientId: patientProfile.id },
        select: { id: true },
      });
    } else {
      return 0;
    }

    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length === 0) return 0;

    return this.prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: userId },
        readAt: null,
      },
    });
  }

  // ─── Helpers privés ─────────────────────────────────────────────

  /**
   * Vérifie que l'utilisateur est bien membre de la conversation.
   * Un utilisateur peut être soit le psychologue, soit le patient.
   */
  private async assertConversationAccess(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        psychologist: { select: { userId: true } },
        patient: { select: { userId: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation introuvable');
    }

    // Psychologist always has a userId (required in schema)
    const psyUserId = conversation.psychologist.userId;
    // Patient.userId is nullable (patient may not have a portal account)
    const patUserId = conversation.patient.userId;

    if (psyUserId !== userId && patUserId !== userId) {
      throw new ForbiddenException('Accès à cette conversation non autorisé');
    }

    return conversation;
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }

  private safeDecrypt(content: string): string {
    try {
      return this.encryption.decrypt(content);
    } catch (error) {
      this.logger.warn(
        `Failed to decrypt message content: ${(error as Error).message}`,
      );
      return '[contenu illisible]';
    }
  }
}

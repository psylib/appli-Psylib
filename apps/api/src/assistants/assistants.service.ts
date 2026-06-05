import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  PLAN_LIMITS,
  SubscriptionPlan,
  type AssistantSummary,
} from '@psyscale/shared-types';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../notifications/email.service';
import { InviteAssistantDto } from './dto/assistant.dto';

@Injectable()
export class AssistantsService {
  private readonly logger = new Logger(AssistantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  // ── Invite ──────────────────────────────────────────────────────

  async inviteAssistant(
    psyUserId: string,
    dto: InviteAssistantDto,
  ): Promise<{ id: string }> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId: psyUserId },
      include: { subscription: true },
    });
    if (!psychologist) {
      throw new NotFoundException('Profil psychologue introuvable');
    }

    const plan = (psychologist.subscription?.plan ??
      SubscriptionPlan.FREE) as SubscriptionPlan;
    const limit = PLAN_LIMITS[plan].assistants;

    if (limit === 0) {
      throw new ForbiddenException(
        'La fonction assistant n’est pas disponible sur votre forfait. Passez à un forfait payant pour inviter un collaborateur.',
      );
    }

    const count = await this.prisma.assistant.count({
      where: {
        psychologistId: psychologist.id,
        status: { in: ['pending', 'active'] },
      },
    });
    if (limit !== -1 && count >= limit) {
      throw new ForbiddenException(
        'Limite d’assistants atteinte pour votre forfait.',
      );
    }

    const email = dto.email.toLowerCase();

    // Reject duplicate active/pending for same email (unique [psychologistId, email])
    const existing = await this.prisma.assistant.findUnique({
      where: {
        psychologistId_email: { psychologistId: psychologist.id, email },
      },
    });
    if (existing && existing.status !== 'revoked') {
      throw new ConflictException(
        'Un·e assistant·e avec cette adresse email existe déjà.',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // If a revoked record exists for this email, reuse it (unique constraint).
    let assistant;
    if (existing) {
      assistant = await this.prisma.assistant.update({
        where: { id: existing.id },
        data: { name: dto.name, status: 'pending', userId: null },
      });
    } else {
      assistant = await this.prisma.assistant.create({
        data: {
          psychologistId: psychologist.id,
          name: dto.name,
          email,
          status: 'pending',
        },
      });
    }

    await this.prisma.assistantInvitation.create({
      data: {
        psychologistId: psychologist.id,
        assistantId: assistant.id,
        email,
        token,
        expiresAt,
      },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const activationUrl = `${frontendUrl}/assistant-invite/${token}`;

    await this.email.sendAssistantInvitation(email, {
      assistantName: dto.name,
      psychologistName: psychologist.name,
      activationUrl,
    });

    await this.audit.log({
      actorId: psyUserId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'assistant',
      entityId: assistant.id,
    });

    return { id: assistant.id };
  }

  // ── List ────────────────────────────────────────────────────────

  async listAssistants(psyUserId: string): Promise<AssistantSummary[]> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId: psyUserId },
      select: { id: true },
    });
    if (!psychologist) {
      throw new NotFoundException('Profil psychologue introuvable');
    }

    const assistants = await this.prisma.assistant.findMany({
      where: { psychologistId: psychologist.id },
      orderBy: { createdAt: 'desc' },
    });

    return assistants.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      status: a.status as AssistantSummary['status'],
      createdAt: a.createdAt.toISOString(),
    }));
  }

  // ── Revoke ──────────────────────────────────────────────────────

  async revokeAssistant(
    psyUserId: string,
    assistantId: string,
  ): Promise<void> {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { userId: psyUserId },
      select: { id: true },
    });
    if (!psychologist) {
      throw new NotFoundException('Profil psychologue introuvable');
    }

    const assistant = await this.prisma.assistant.findUnique({
      where: { id: assistantId },
    });
    // Tenant isolation — never reveal assistants of another psychologist.
    if (!assistant || assistant.psychologistId !== psychologist.id) {
      throw new NotFoundException('Assistant·e introuvable');
    }

    await this.prisma.assistant.update({
      where: { id: assistantId },
      data: { status: 'revoked' },
    });

    // Disable the Keycloak account so they can no longer log in.
    // The KC user id equals the DB User id (provisioned with the KC sub).
    if (assistant.userId) {
      try {
        await this.auth.setKeycloakUserEnabled(assistant.userId, false);
      } catch (err) {
        this.logger.warn(
          `Keycloak disable failed for assistant ${assistantId}: ${(err as Error).message}`,
        );
        // Do not fail the revoke — DB status 'revoked' already blocks login
        // via the JWT strategy assistant-link check.
      }
    }

    await this.audit.log({
      actorId: psyUserId,
      actorType: 'psychologist',
      action: 'DELETE',
      entityType: 'assistant',
      entityId: assistantId,
    });
  }

  // ── Validate token (public) ─────────────────────────────────────

  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; psychologistName?: string; email?: string }> {
    const invitation = await this.prisma.assistantInvitation.findUnique({
      where: { token },
      include: { psychologist: { select: { name: true } } },
    });

    if (!invitation) return { valid: false };
    if (invitation.status !== 'pending') return { valid: false };
    if (invitation.expiresAt < new Date()) {
      await this.prisma.assistantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      return { valid: false };
    }

    return {
      valid: true,
      psychologistName: invitation.psychologist.name,
      email: invitation.email,
    };
  }

  // ── Accept (public) ─────────────────────────────────────────────

  async acceptInvitation(
    token: string,
    password: string,
  ): Promise<{ success: true }> {
    const invitation = await this.prisma.assistantInvitation.findUnique({
      where: { token },
    });

    if (!invitation || invitation.status !== 'pending') {
      throw new BadRequestException('Invitation invalide ou déjà utilisée');
    }
    if (invitation.expiresAt < new Date()) {
      await this.prisma.assistantInvitation.update({
        where: { id: invitation.id },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Invitation expirée');
    }

    const assistant = await this.prisma.assistant.findUnique({
      where: { id: invitation.assistantId },
    });
    if (!assistant) {
      throw new NotFoundException('Assistant·e introuvable');
    }

    // Provision the Keycloak account (create + password + role 'assistant').
    // Returns the KC user id, which we reuse as the DB User id.
    const keycloakUserId = await this.auth.provisionAssistantAccount(
      invitation.email,
      password,
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: keycloakUserId,
            email: invitation.email,
            role: 'assistant',
          },
        });
        await tx.assistant.update({
          where: { id: assistant.id },
          data: { userId: keycloakUserId, status: 'active' },
        });
        await tx.assistantInvitation.update({
          where: { id: invitation.id },
          data: { status: 'accepted' },
        });
      });
    } catch (err) {
      // DB write failed after the Keycloak account was provisioned. Disable the
      // orphaned KC account so it can't linger as an enabled 'assistant' with no
      // active link (the JWT strategy would reject it anyway, but keep KC clean).
      try {
        await this.auth.setKeycloakUserEnabled(keycloakUserId, false);
      } catch (cleanupErr) {
        this.logger.error(
          `Failed to disable orphaned KC user ${keycloakUserId}: ${(cleanupErr as Error).message}`,
        );
      }
      throw err;
    }

    await this.audit.log({
      actorId: keycloakUserId,
      actorType: 'assistant',
      action: 'CREATE',
      entityType: 'assistant',
      entityId: assistant.id,
    });

    this.logger.log(
      `Assistant ${assistant.id} accepted invitation, KC user ${keycloakUserId} provisioned`,
    );

    return { success: true };
  }
}

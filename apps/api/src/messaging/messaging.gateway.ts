import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import JwksClient from 'jwks-rsa';
import { MessagingService } from './messaging.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../common/prisma.service';
import { getAllowedOrigins } from '../common/cors.config';
import type {
  JoinConversationPayload,
  SendMessagePayload,
  MarkReadPayload,
} from './dto/messaging.dto';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: string;
}

interface JwtTokenPayload {
  sub: string;
  email?: string;
  realm_access?: {
    roles: string[];
  };
  role?: string;
  exp?: number;
}

@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  namespace: '/messaging',
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private jwksClient!: JwksClient.JwksClient;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly configService: ConfigService,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    const keycloakUrl = this.configService.get<string>(
      'KEYCLOAK_URL',
      'https://auth.psylib.eu',
    );
    const keycloakRealm = this.configService.get<string>(
      'KEYCLOAK_REALM',
      'psyscale',
    );

    const jwksUri = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`;

    this.jwksClient = JwksClient({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000, // 10 minutes
      rateLimit: true,
    });

    this.logger.log(`[WS] JWKS client initialisé — ${jwksUri}`);
  }

  /**
   * Connexion entrante — valider le JWT avant d'accepter.
   * Le token est passé via client.handshake.auth.token.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`[WS] Connexion rejetée — token manquant (${client.id})`);
        client.disconnect(true);
        return;
      }

      const payload = await this.verifyToken(token);

      if (!payload?.sub) {
        this.logger.warn(`[WS] Connexion rejetée — token invalide (${client.id})`);
        client.disconnect(true);
        return;
      }

      // Attacher l'identité au socket
      const authSocket = client as AuthenticatedSocket;
      authSocket.userId = payload.sub;
      authSocket.userRole = this.extractRole(payload);

      this.logger.log(`[WS] Client connecté: ${client.id} (userId: ${payload.sub})`);
    } catch (error) {
      this.logger.warn(
        `[WS] Connexion rejetée — erreur JWT (${client.id}): ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`[WS] Client déconnecté: ${client.id}`);
  }

  /**
   * join_conversation — rejoindre la room d'une conversation.
   * Le client sera ensuite notifié des nouveaux messages via new_message.
   */
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @MessageBody() payload: JoinConversationPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const authSocket = client as AuthenticatedSocket;

    if (!authSocket.userId) {
      throw new WsException('Non authentifié');
    }

    const { conversationId } = payload;
    if (!conversationId) {
      throw new WsException('conversationId requis');
    }

    try {
      const room = `conversation:${conversationId}`;
      await client.join(room);
      this.logger.log(
        `[WS] ${authSocket.userId} a rejoint la room ${room}`,
      );
      client.emit('joined_conversation', { conversationId, room });
    } catch (error) {
      this.logger.error(
        `[WS] Erreur join_conversation: ${(error as Error).message}`,
      );
      throw new WsException('Impossible de rejoindre la conversation');
    }
  }

  /**
   * send_message — envoie un message dans une conversation.
   * Chiffre le contenu, persiste en DB, broadcast dans la room.
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() payload: SendMessagePayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const authSocket = client as AuthenticatedSocket;

    if (!authSocket.userId) {
      throw new WsException('Non authentifié');
    }

    const { conversationId, content } = payload;

    if (!conversationId || !content?.trim()) {
      throw new WsException('conversationId et content requis');
    }

    try {
      const messageDto = await this.messagingService.sendMessage(
        conversationId,
        authSocket.userId,
        content.trim(),
      );

      const room = `conversation:${conversationId}`;
      this.server.to(room).emit('new_message', messageDto);

      this.logger.log(
        `[WS] Message envoyé dans ${room} par ${authSocket.userId}`,
      );

      // Notify recipient if offline
      void this.notifyOfflineRecipient(conversationId, authSocket.userId);
    } catch (error) {
      this.logger.error(
        `[WS] Erreur send_message: ${(error as Error).message}`,
      );
      throw new WsException(
        (error as Error).message || "Erreur lors de l'envoi du message",
      );
    }
  }

  /**
   * mark_read — marque les messages d'une conversation comme lus.
   * Broadcast dans la room pour notifier l'autre partie.
   */
  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() payload: MarkReadPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const authSocket = client as AuthenticatedSocket;

    if (!authSocket.userId) {
      throw new WsException('Non authentifié');
    }

    const { conversationId } = payload;

    if (!conversationId) {
      throw new WsException('conversationId requis');
    }

    try {
      await this.messagingService.markRead(conversationId, authSocket.userId);

      const readAt = new Date();
      const room = `conversation:${conversationId}`;

      this.server.to(room).emit('messages_read', {
        conversationId,
        readAt,
      });

      this.logger.log(
        `[WS] Messages lus dans ${room} par ${authSocket.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `[WS] Erreur mark_read: ${(error as Error).message}`,
      );
      throw new WsException(
        (error as Error).message || 'Erreur lors du marquage des messages',
      );
    }
  }

  // ─── Offline notification ─────────────────────────────────────────

  private async notifyOfflineRecipient(
    conversationId: string,
    senderId: string,
  ): Promise<void> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          psychologist: { select: { userId: true, name: true } },
          patient: { select: { userId: true, name: true } },
        },
      });
      if (!conversation) return;

      // Determine recipient
      const isPsySender = conversation.psychologist.userId === senderId;
      const recipientUserId = isPsySender
        ? conversation.patient.userId
        : conversation.psychologist.userId;
      const senderName = isPsySender
        ? conversation.psychologist.name
        : conversation.patient.name;

      if (!recipientUserId) return;

      // Only notify if recipient is NOT connected to notifications WebSocket
      if (this.notificationGateway.isUserOnline(recipientUserId)) return;

      void this.notificationsService.createAndDispatch(
        recipientUserId,
        'message',
        'Nouveau message',
        `${senderName} vous a envoyé un message`,
        { href: '/dashboard/messaging' },
      );
    } catch {
      // Non-blocking — best effort
    }
  }

  // ─── Helpers privés ─────────────────────────────────────────────

  private extractToken(client: Socket): string | null {
    // Priorité 1 : handshake.auth.token (recommandé)
    const authToken = (client.handshake.auth as Record<string, unknown>)?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    // Priorité 2 : Authorization header Bearer
    const authHeader = client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return null;
  }

  /**
   * Vérifie la signature RS256 du JWT via le JWKS de Keycloak.
   * Remplace le précédent `jwtService.decode()` qui ne vérifiait pas la signature.
   */
  private async verifyToken(token: string): Promise<JwtTokenPayload | null> {
    try {
      // Décoder l'en-tête pour récupérer le kid sans vérification (nécessaire pour JWKS)
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') return null;

      const kid = decoded.header.kid;

      // Récupérer la clé publique depuis Keycloak JWKS (avec cache 10 min)
      const signingKey = await this.jwksClient.getSigningKey(kid);
      const publicKey = signingKey.getPublicKey();

      // Vérifier signature RS256 + expiration (jwt.verify lève une erreur si expiré)
      const verified = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as JwtTokenPayload;

      return verified;
    } catch (err) {
      this.logger.warn(
        '[WS] Token invalide ou signature incorrecte',
        err instanceof Error ? err.message : err,
      );
      return null;
    }
  }

  private extractRole(payload: JwtTokenPayload): string {
    const roles = payload.realm_access?.roles ?? [];
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('psychologist')) return 'psychologist';
    if (roles.includes('patient')) return 'patient';
    return payload.role ?? 'patient';
  }
}

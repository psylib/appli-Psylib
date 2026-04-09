import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import JwksClient from 'jwks-rsa';
import { getAllowedOrigins } from '../common/cors.config';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

interface JwtTokenPayload {
  sub: string;
  exp?: number;
}

@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private jwksClient!: JwksClient.JwksClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL', 'https://auth.psylib.eu');
    const keycloakRealm = this.configService.get<string>('KEYCLOAK_REALM', 'psyscale');
    const jwksUri = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`;

    this.jwksClient = JwksClient({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
    });

    this.logger.log(`[WS/notifications] JWKS client initialisé — ${jwksUri}`);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.verifyToken(token);
      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }

      const authSocket = client as AuthenticatedSocket;
      authSocket.userId = payload.sub;

      // Join personal room for targeted notifications
      await client.join(`user:${payload.sub}`);

      this.logger.log(`[WS/notifications] Connected: ${client.id} (userId: ${payload.sub})`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`[WS/notifications] Disconnected: ${client.id}`);
  }

  /**
   * Send a notification to a specific user via WebSocket.
   * Called by NotificationsService after DB insert.
   */
  sendToUser(userId: string, notification: Record<string, unknown>): void {
    this.server?.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Check if a user has active WebSocket connections.
   */
  isUserOnline(userId: string): boolean {
    if (!this.server) return false;
    const room = (this.server.sockets?.adapter as unknown as { rooms?: Map<string, Set<string>> })?.rooms?.get(`user:${userId}`);
    return !!room && room.size > 0;
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth as Record<string, unknown>)?.token;
    if (typeof authToken === 'string' && authToken) return authToken;

    const authHeader = client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return null;
  }

  private async verifyToken(token: string): Promise<JwtTokenPayload | null> {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string') return null;

      const kid = decoded.header.kid;
      const signingKey = await this.jwksClient.getSigningKey(kid);
      const publicKey = signingKey.getPublicKey();

      return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as JwtTokenPayload;
    } catch {
      return null;
    }
  }
}

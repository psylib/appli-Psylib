import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from './prisma.service';

export type AuditAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'DECRYPT' | 'AI_SUMMARY_SAVE';
export type ActorType = 'psychologist' | 'patient' | 'system' | 'admin';

export interface AuditLogParams {
  actorId: string;
  actorType: ActorType;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  req?: Request;
}

/**
 * AuditService — Journalisation obligatoire HDS
 *
 * Logue TOUTES les opérations sur données de santé :
 * - Accès (READ) aux notes, journal, messages
 * - Modifications (CREATE/UPDATE/DELETE) des données patients
 * - Déchiffrements (DECRYPT) de champs sensibles
 *
 * Utiliser AuditInterceptor sur les routes sensibles pour automatisation.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistre une entrée dans audit_logs
   * Silencieux en cas d'erreur — ne doit pas bloquer la requête principale
   */
  async log(params: AuditLogParams): Promise<void> {
    const { actorId, actorType, action, entityType, entityId, metadata, req } = params;

    try {
      const ipAddress = this.extractIp(req);

      await this.prisma.auditLog.create({
        data: {
          actorId,
          actorType,
          action,
          entityType,
          entityId,
          ipAddress,
          metadata: metadata ? (metadata as import('@prisma/client').Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (error) {
      // Log l'erreur mais ne propage pas — l'audit ne doit pas bloquer les requêtes
      this.logger.error(
        `Failed to write audit log: ${action} on ${entityType}/${entityId}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Logue un accès READ à des données sensibles (helper)
   */
  async logRead(
    actorId: string,
    actorType: ActorType,
    entityType: string,
    entityId: string,
    req?: Request,
  ): Promise<void> {
    return this.log({ actorId, actorType, action: 'READ', entityType, entityId, req });
  }

  /**
   * Logue un déchiffrement de données sensibles (OBLIGATOIRE HDS)
   */
  async logDecrypt(
    actorId: string,
    actorType: ActorType,
    entityType: string,
    entityId: string,
    fieldName: string,
    req?: Request,
  ): Promise<void> {
    return this.log({
      actorId,
      actorType,
      action: 'DECRYPT',
      entityType,
      entityId,
      metadata: { field: fieldName },
      req,
    });
  }

  private extractIp(req?: Request): string | null {
    if (!req) return null;
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])?.trim() ?? null;
    }
    return req.socket?.remoteAddress ?? null;
  }
}

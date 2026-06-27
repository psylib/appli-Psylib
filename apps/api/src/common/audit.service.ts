import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import {
  computeAuditHash,
  verifyAuditChain,
  type AuditChainRow,
  type AuditChainVerdict,
} from './audit-hash';

/**
 * Clé d'advisory lock dédiée à la chaîne d'audit. Sérialise les insertions
 * (lire le dernier maillon + insérer) pour empêcher deux écritures concurrentes
 * de pointer sur le même prédécesseur (fork de chaîne). Libéré en fin de
 * transaction (`pg_advisory_xact_lock`).
 */
const AUDIT_CHAIN_LOCK_KEY = 742_097;

export type AuditAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'DECRYPT' | 'AI_SUMMARY_SAVE'
  | 'VIDEO_ROOM_CREATED' | 'VIDEO_INSTANT_CREATED' | 'VIDEO_PSY_JOIN' | 'VIDEO_PATIENT_JOIN' | 'VIDEO_CALL_END' | 'VIDEO_ROOM_CLEANUP'
  | 'VIDEO_GUEST_INVITE' | 'VIDEO_GUEST_REQUEST' | 'VIDEO_GUEST_ADMIT' | 'VIDEO_GUEST_DENY'
  | 'INVOICE_AUTO_GENERATED' | 'INVOICE_AUTO_EMAILED'
  | 'CALENDAR_CONNECT' | 'CALENDAR_DISCONNECT'
  | 'AI_SCRIBE_COMPLETE' | 'AI_SCRIBE_FAILED'
  | 'SCRIBE_ENABLED' | 'SCRIBE_DISABLED' | 'SCRIBE_AUDIO_UPLOADED'
  | 'CONSENT_ARCHIVE';
export type ActorType = 'psychologist' | 'patient' | 'system' | 'admin' | 'guardian' | 'guest' | 'assistant';

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
      // createdAt fixé côté app : la MÊME valeur est hachée et stockée (le hash
      // intègre createdAt → ne pas laisser le default DB diverger).
      const createdAt = new Date();
      const metadataJson = metadata
        ? (metadata as Prisma.InputJsonValue)
        : undefined;

      // Transaction sérialisée (advisory lock) : lit le dernier maillon de la
      // chaîne puis insère la nouvelle entrée chaînée → preuve d'intégrité WORM.
      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_KEY})`;

        const tip = await tx.auditLog.findFirst({
          where: { hash: { not: null } },
          orderBy: { seq: 'desc' },
          select: { hash: true },
        });
        const prevHash = tip?.hash ?? null;

        const hash = computeAuditHash({
          actorId: actorId ?? null,
          actorType,
          action,
          entityType,
          entityId,
          ipAddress,
          metadata: metadata ?? null,
          createdAt,
          prevHash,
        });

        await tx.auditLog.create({
          data: {
            actorId,
            actorType,
            action,
            entityType,
            entityId,
            ipAddress,
            metadata: metadataJson,
            createdAt,
            hash,
            prevHash,
          },
        });
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
   * Vérifie l'intégrité de la chaîne d'audit (WORM) — preuve opposable HDS.
   * Relit toutes les entrées chaînées par ordre d'insertion (seq) et délègue à
   * la fonction pure `verifyAuditChain`. Détecte toute altération/suppression
   * a posteriori. À exposer via un endpoint admin / job de contrôle.
   */
  async verifyChain(): Promise<AuditChainVerdict> {
    const rows = await this.prisma.auditLog.findMany({
      where: { hash: { not: null } },
      orderBy: { seq: 'asc' },
      select: {
        id: true,
        actorId: true,
        actorType: true,
        action: true,
        entityType: true,
        entityId: true,
        ipAddress: true,
        metadata: true,
        createdAt: true,
        hash: true,
        prevHash: true,
      },
    });

    const chain: AuditChainRow[] = rows.map((r) => ({
      id: r.id,
      actorId: r.actorId,
      actorType: r.actorType,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      ipAddress: r.ipAddress,
      metadata: r.metadata ?? null,
      createdAt: r.createdAt,
      prevHash: r.prevHash,
      hash: r.hash as string,
    }));

    return verifyAuditChain(chain);
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
    // Use req.ip which respects Express trust proxy setting (configured in main.ts)
    // Falls back to X-Forwarded-For last entry (closest proxy) then remoteAddress
    if (req.ip) return req.ip;
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const parts = Array.isArray(forwarded) ? forwarded : forwarded.split(',');
      // Use the LAST entry (closest to the server) rather than first (attacker-controlled)
      return parts[parts.length - 1]?.trim() ?? null;
    }
    return req.socket?.remoteAddress ?? null;
  }
}

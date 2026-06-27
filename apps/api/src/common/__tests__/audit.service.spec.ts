import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from '../audit.service';
import type { Request } from 'express';

// ─── Mock PrismaService (chaîne WORM : $transaction + advisory lock + tip) ─────
// log() lit le dernier maillon (findFirst) puis insère (create) dans une
// transaction sérialisée par advisory lock ($executeRaw).
const txExecuteRaw = vi.fn();
const txFindFirst = vi.fn();
const txCreate = vi.fn();

const mockPrisma = {
  $transaction: vi.fn(async (cb: (tx: unknown) => unknown) =>
    cb({
      $executeRaw: txExecuteRaw,
      auditLog: { findFirst: txFindFirst, create: txCreate },
    }),
  ),
};

function createService(): AuditService {
  return new AuditService(mockPrisma as never);
}

function createArg() {
  return txCreate.mock.calls[0]?.[0] as {
    data: {
      actorId: string | null;
      actorType: string;
      action: string;
      entityType: string;
      entityId: string;
      ipAddress: string | null;
      metadata: unknown;
      hash: string;
      prevHash: string | null;
    };
  };
}

// ─── Helper: build a minimal Express-like Request ─────────────────────────────
function makeReq(overrides: Partial<{
  xForwardedFor: string | string[];
  remoteAddress: string;
}> = {}): Request {
  const req: Partial<Request> & { socket: { remoteAddress?: string } } = {
    headers: {},
    socket: {},
  };

  if (overrides.xForwardedFor !== undefined) {
    (req.headers as Record<string, string | string[]>)['x-forwarded-for'] =
      overrides.xForwardedFor;
  }
  if (overrides.remoteAddress !== undefined) {
    req.socket.remoteAddress = overrides.remoteAddress;
  }

  return req as unknown as Request;
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    txFindFirst.mockResolvedValue(null); // genèse de chaîne par défaut
    service = createService();
  });

  // ── log() ──────────────────────────────────────────────────────────────────
  describe('log()', () => {
    it('devrait créer un audit_log chaîné avec tous les champs fournis', async () => {
      const req = makeReq({ xForwardedFor: '192.168.1.42' });

      await service.log({
        actorId: 'actor-123',
        actorType: 'psychologist',
        action: 'CREATE',
        entityType: 'patient',
        entityId: 'entity-456',
        metadata: { foo: 'bar' },
        req,
      });

      expect(txCreate).toHaveBeenCalledOnce();
      const callArg = createArg();
      expect(callArg.data.actorId).toBe('actor-123');
      expect(callArg.data.actorType).toBe('psychologist');
      expect(callArg.data.action).toBe('CREATE');
      expect(callArg.data.entityType).toBe('patient');
      expect(callArg.data.entityId).toBe('entity-456');
      expect(callArg.data.ipAddress).toBe('192.168.1.42');
      expect(callArg.data.metadata).toEqual({ foo: 'bar' });
      // Chaîne WORM : genèse → prevHash null + hash SHA-256
      expect(callArg.data.prevHash).toBeNull();
      expect(callArg.data.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('chaîne la nouvelle entrée au dernier maillon (prevHash = hash du tip)', async () => {
      const tipHash = 'a'.repeat(64);
      txFindFirst.mockResolvedValueOnce({ hash: tipHash });

      await service.log({
        actorId: 'a',
        actorType: 'system',
        action: 'READ',
        entityType: 'patient',
        entityId: 'e',
      });

      expect(createArg().data.prevHash).toBe(tipHash);
    });

    it('ne devrait pas lever d\'erreur si Prisma échoue (silencieux)', async () => {
      txCreate.mockRejectedValueOnce(new Error('DB down'));

      await expect(
        service.log({
          actorId: 'a',
          actorType: 'system',
          action: 'READ',
          entityType: 'patient',
          entityId: 'e',
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ── logRead() ─────────────────────────────────────────────────────────────
  describe('logRead()', () => {
    it('devrait appeler log() avec action READ', async () => {
      await service.logRead('actor-1', 'psychologist', 'patient', 'p-1');

      expect(txCreate).toHaveBeenCalledOnce();
      const callArg = createArg();
      expect(callArg.data.action).toBe('READ');
      expect(callArg.data.entityType).toBe('patient');
      expect(callArg.data.entityId).toBe('p-1');
    });
  });

  // ── logDecrypt() ──────────────────────────────────────────────────────────
  describe('logDecrypt()', () => {
    it('devrait appeler log() avec action DECRYPT et metadata.field = fieldName', async () => {
      await service.logDecrypt('actor-2', 'psychologist', 'patient', 'p-2', 'notes');

      expect(txCreate).toHaveBeenCalledOnce();
      const callArg = createArg();
      expect(callArg.data.action).toBe('DECRYPT');
      expect(callArg.data.metadata).toEqual({ field: 'notes' });
    });
  });

  // ── extractIp() (via log()) ───────────────────────────────────────────────
  describe('extraction IP', () => {
    it('devrait extraire l\'IP depuis x-forwarded-for (string simple)', async () => {
      const req = makeReq({ xForwardedFor: '10.0.0.1' });

      await service.log({ actorId: 'a', actorType: 'system', action: 'READ', entityType: 'e', entityId: 'i', req });

      expect(createArg().data.ipAddress).toBe('10.0.0.1');
    });

    it('devrait prendre la dernière IP (proxy le plus proche) si x-forwarded-for est une liste', async () => {
      const req = makeReq({ xForwardedFor: '203.0.113.5, 10.0.0.1, 172.16.0.1' });

      await service.log({ actorId: 'a', actorType: 'system', action: 'READ', entityType: 'e', entityId: 'i', req });

      expect(createArg().data.ipAddress).toBe('172.16.0.1');
    });

    it('devrait utiliser socket.remoteAddress en fallback si pas de x-forwarded-for', async () => {
      const req = makeReq({ remoteAddress: '127.0.0.1' });

      await service.log({ actorId: 'a', actorType: 'system', action: 'READ', entityType: 'e', entityId: 'i', req });

      expect(createArg().data.ipAddress).toBe('127.0.0.1');
    });

    it('devrait retourner null si aucune IP disponible (req absent)', async () => {
      await service.log({ actorId: 'a', actorType: 'system', action: 'READ', entityType: 'e', entityId: 'i' });

      expect(createArg().data.ipAddress).toBeNull();
    });
  });
});

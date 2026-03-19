import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from '../audit.service';
import type { Request } from 'express';

// ─── Mock PrismaService ────────────────────────────────────────────────────────
const mockPrisma = {
  auditLog: {
    create: vi.fn(),
  },
};

function createService(): AuditService {
  return new AuditService(mockPrisma as never);
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
    service = createService();
  });

  // ── log() ──────────────────────────────────────────────────────────────────
  describe('log()', () => {
    it('devrait créer un audit_log avec tous les champs fournis', async () => {
      mockPrisma.auditLog.create.mockResolvedValueOnce({});

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

      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
      const callArg = mockPrisma.auditLog.create.mock.calls[0]?.[0] as {
        data: {
          actorId: string;
          actorType: string;
          action: string;
          entityType: string;
          entityId: string;
          ipAddress: string;
          metadata: unknown;
        };
      };
      expect(callArg.data.actorId).toBe('actor-123');
      expect(callArg.data.actorType).toBe('psychologist');
      expect(callArg.data.action).toBe('CREATE');
      expect(callArg.data.entityType).toBe('patient');
      expect(callArg.data.entityId).toBe('entity-456');
      expect(callArg.data.ipAddress).toBe('192.168.1.42');
      expect(callArg.data.metadata).toEqual({ foo: 'bar' });
    });

    it('ne devrait pas lever d\'erreur si Prisma échoue (silencieux)', async () => {
      mockPrisma.auditLog.create.mockRejectedValueOnce(new Error('DB down'));

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
      mockPrisma.auditLog.create.mockResolvedValueOnce({});

      await service.logRead('actor-1', 'psychologist', 'patient', 'p-1');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
      const callArg = mockPrisma.auditLog.create.mock.calls[0]?.[0] as {
        data: { action: string; entityType: string; entityId: string };
      };
      expect(callArg.data.action).toBe('READ');
      expect(callArg.data.entityType).toBe('patient');
      expect(callArg.data.entityId).toBe('p-1');
    });
  });

  // ── logDecrypt() ──────────────────────────────────────────────────────────
  describe('logDecrypt()', () => {
    it('devrait appeler log() avec action DECRYPT et metadata.field = fieldName', async () => {
      mockPrisma.auditLog.create.mockResolvedValueOnce({});

      await service.logDecrypt('actor-2', 'psychologist', 'patient', 'p-2', 'notes');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledOnce();
      const callArg = mockPrisma.auditLog.create.mock.calls[0]?.[0] as {
        data: { action: string; metadata: { field: string } };
      };
      expect(callArg.data.action).toBe('DECRYPT');
      expect(callArg.data.metadata).toEqual({ field: 'notes' });
    });
  });

  // ── extractIp() (via log()) ───────────────────────────────────────────────
  describe('extraction IP', () => {
    it('devrait extraire l\'IP depuis x-forwarded-for (string simple)', async () => {
      mockPrisma.auditLog.create.mockResolvedValueOnce({});
      const req = makeReq({ xForwardedFor: '10.0.0.1' });

      await service.log({ actorId: 'a', actorType: 'system', action: 'READ', entityType: 'e', entityId: 'i', req });

      const callArg = mockPrisma.auditLog.create.mock.calls[0]?.[0] as {
        data: { ipAddress: string };
      };
      expect(callArg.data.ipAddress).toBe('10.0.0.1');
    });

    it('devrait prendre la première IP si x-forwarded-for contient une liste', async () => {
      mockPrisma.auditLog.create.mockResolvedValueOnce({});
      const req = makeReq({ xForwardedFor: '203.0.113.5, 10.0.0.1, 172.16.0.1' });

      await service.log({ actorId: 'a', actorType: 'system', action: 'READ', entityType: 'e', entityId: 'i', req });

      const callArg = mockPrisma.auditLog.create.mock.calls[0]?.[0] as {
        data: { ipAddress: string };
      };
      expect(callArg.data.ipAddress).toBe('203.0.113.5');
    });

    it('devrait utiliser socket.remoteAddress en fallback si pas de x-forwarded-for', async () => {
      mockPrisma.auditLog.create.mockResolvedValueOnce({});
      const req = makeReq({ remoteAddress: '127.0.0.1' });

      await service.log({ actorId: 'a', actorType: 'system', action: 'READ', entityType: 'e', entityId: 'i', req });

      const callArg = mockPrisma.auditLog.create.mock.calls[0]?.[0] as {
        data: { ipAddress: string };
      };
      expect(callArg.data.ipAddress).toBe('127.0.0.1');
    });

    it('devrait retourner null si aucune IP disponible (req absent)', async () => {
      mockPrisma.auditLog.create.mockResolvedValueOnce({});

      await service.log({ actorId: 'a', actorType: 'system', action: 'READ', entityType: 'e', entityId: 'i' });

      const callArg = mockPrisma.auditLog.create.mock.calls[0]?.[0] as {
        data: { ipAddress: string | null };
      };
      expect(callArg.data.ipAddress).toBeNull();
    });
  });
});

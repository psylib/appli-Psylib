import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PatientsService } from '../patients.service';
import type { Patient, Psychologist } from '@prisma/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  patient: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  psychologist: {
    findUnique: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

const mockEncryption = {
  encrypt: vi.fn((v: string) => `encrypted:${v}`),
  decrypt: vi.fn((v: string) => v.replace('encrypted:', '')),
  encryptNullable: vi.fn((v: string | null | undefined) =>
    v ? `encrypted:${v}` : null,
  ),
  decryptNullable: vi.fn((v: string | null | undefined) =>
    v ? v.replace('encrypted:', '') : null,
  ),
  isEncrypted: vi.fn((v: string) => v.startsWith('encrypted:')),
};

const mockAudit = {
  log: vi.fn(),
  logRead: vi.fn(),
  logDecrypt: vi.fn(),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PSY_USER_ID = 'psy-user-uuid';
const PSY_ID = 'psy-db-uuid';
const PATIENT_ID = 'patient-uuid';
const ACTOR_ID = 'actor-uuid';

const mockPsychologist: Psychologist = {
  id: PSY_ID,
  userId: PSY_USER_ID,
  name: 'Dr. Test',
  slug: 'dr-test',
  specialization: null,
  bio: null,
  phone: null,
  address: null,
  adeliNumber: null,
  rppsNumber: null,
  isOnboarded: true,
  defaultSessionDuration: 50,
  defaultSessionRate: 70,
  websiteUrl: null,
  profilePictureUrl: null,
  city: null,
  acceptNewPatients: true,
  approach: null,
  languages: [],
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
} as unknown as Psychologist;

function makePatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: PATIENT_ID,
    psychologistId: PSY_ID,
    userId: null,
    name: 'Marie Dupont',
    email: 'marie@example.com',
    phone: null,
    birthDate: null,
    notes: null,
    status: 'active',
    source: null,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    ...overrides,
  } as Patient;
}

// ─── Service factory ───────────────────────────────────────────────────────────
function createService(): PatientsService {
  return new PatientsService(
    mockPrisma as never,
    mockEncryption as never,
    mockAudit as never,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('PatientsService', () => {
  let service: PatientsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // ── create() ────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('devrait créer un patient avec les champs de base', async () => {
      const created = makePatient();
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.create.mockResolvedValueOnce(created);
      mockAudit.log.mockResolvedValueOnce(undefined);

      const result = await service.create(
        PSY_USER_ID,
        { name: 'Marie Dupont', email: 'marie@example.com' },
        ACTOR_ID,
      );

      expect(result).toEqual(created);
      expect(mockPrisma.patient.create).toHaveBeenCalledOnce();
      const data = mockPrisma.patient.create.mock.calls[0]?.[0]?.data as {
        name: string;
        psychologistId: string;
      };
      expect(data.name).toBe('Marie Dupont');
      expect(data.psychologistId).toBe(PSY_ID);
    });

    it('devrait chiffrer le champ notes si fourni', async () => {
      const created = makePatient({ notes: 'encrypted:Notes sensibles' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.create.mockResolvedValueOnce(created);
      mockAudit.log.mockResolvedValueOnce(undefined);

      await service.create(
        PSY_USER_ID,
        { name: 'Marie Dupont', notes: 'Notes sensibles' },
        ACTOR_ID,
      );

      const data = mockPrisma.patient.create.mock.calls[0]?.[0]?.data as {
        notes: string;
      };
      expect(data.notes).toBe('encrypted:Notes sensibles');
      expect(mockEncryption.encrypt).toHaveBeenCalledWith('Notes sensibles');
    });

    it('devrait enregistrer un audit CREATE', async () => {
      const created = makePatient();
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.create.mockResolvedValueOnce(created);
      mockAudit.log.mockResolvedValueOnce(undefined);

      await service.create(PSY_USER_ID, { name: 'Marie Dupont' }, ACTOR_ID);

      expect(mockAudit.log).toHaveBeenCalledOnce();
      const logArg = mockAudit.log.mock.calls[0]?.[0] as {
        action: string;
        actorId: string;
        entityType: string;
      };
      expect(logArg.action).toBe('CREATE');
      expect(logArg.actorId).toBe(ACTOR_ID);
      expect(logArg.entityType).toBe('patient');
    });

    it('devrait lever ForbiddenException si le psychologue n\'existe pas', async () => {
      // create() uses psychologist.findUnique via getPsychologist
      // but when called from create() it uses findUnique directly — psy not found → NotFoundException
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create(PSY_USER_ID, { name: 'Test' }, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findAll() ────────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('devrait filtrer par psychologistId (isolation tenant)', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findMany.mockResolvedValueOnce([]);
      mockPrisma.patient.count.mockResolvedValueOnce(0);
      mockAudit.logRead.mockResolvedValueOnce(undefined);

      await service.findAll(PSY_USER_ID, {}, ACTOR_ID);

      const findManyArg = mockPrisma.patient.findMany.mock.calls[0]?.[0] as {
        where: { psychologistId: string };
      };
      expect(findManyArg.where.psychologistId).toBe(PSY_ID);

      const countArg = mockPrisma.patient.count.mock.calls[0]?.[0] as {
        where: { psychologistId: string };
      };
      expect(countArg.where.psychologistId).toBe(PSY_ID);
    });

    it('devrait retourner la pagination correcte (data, total, page, totalPages)', async () => {
      const patients = [makePatient(), makePatient({ id: 'p2' })];
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findMany.mockResolvedValueOnce(patients);
      mockPrisma.patient.count.mockResolvedValueOnce(45);
      mockAudit.logRead.mockResolvedValueOnce(undefined);

      const result = await service.findAll(PSY_USER_ID, { page: 2, limit: 20 }, ACTOR_ID);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(45);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3); // ceil(45/20)
    });

    it('devrait filtrer par status si fourni', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findMany.mockResolvedValueOnce([]);
      mockPrisma.patient.count.mockResolvedValueOnce(0);
      mockAudit.logRead.mockResolvedValueOnce(undefined);

      await service.findAll(PSY_USER_ID, { status: 'active' as never }, ACTOR_ID);

      const findManyArg = mockPrisma.patient.findMany.mock.calls[0]?.[0] as {
        where: { status?: string };
      };
      expect(findManyArg.where.status).toBe('active');
    });

    it('ne devrait JAMAIS retourner les notes chiffrées dans la liste', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findMany.mockResolvedValueOnce([]);
      mockPrisma.patient.count.mockResolvedValueOnce(0);
      mockAudit.logRead.mockResolvedValueOnce(undefined);

      await service.findAll(PSY_USER_ID, {}, ACTOR_ID);

      const findManyArg = mockPrisma.patient.findMany.mock.calls[0]?.[0] as {
        select: { notes?: boolean };
      };
      // notes: false means it's excluded from the select
      expect(findManyArg.select).toBeDefined();
      expect((findManyArg.select as Record<string, boolean>)['notes']).toBe(false);
    });
  });

  // ── findOne() ────────────────────────────────────────────────────────────────
  describe('findOne()', () => {
    it('devrait retourner le patient avec les notes déchiffrées', async () => {
      const patient = makePatient({ notes: 'encrypted:Notes confidentielles' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(patient);
      mockAudit.logDecrypt.mockResolvedValueOnce(undefined);
      mockAudit.logRead.mockResolvedValueOnce(undefined);

      const result = await service.findOne(PSY_USER_ID, PATIENT_ID, ACTOR_ID);

      expect(result.notes).toBe('Notes confidentielles');
      expect(mockEncryption.decrypt).toHaveBeenCalledWith('encrypted:Notes confidentielles');
    });

    it('devrait enregistrer un audit DECRYPT quand les notes sont chiffrées', async () => {
      const patient = makePatient({ notes: 'encrypted:Data' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(patient);
      mockAudit.logDecrypt.mockResolvedValueOnce(undefined);
      mockAudit.logRead.mockResolvedValueOnce(undefined);

      await service.findOne(PSY_USER_ID, PATIENT_ID, ACTOR_ID);

      expect(mockAudit.logDecrypt).toHaveBeenCalledOnce();
      const args = mockAudit.logDecrypt.mock.calls[0] as [
        string, string, string, string, string, unknown
      ];
      expect(args[0]).toBe(ACTOR_ID);
      expect(args[2]).toBe('patient');
      expect(args[3]).toBe(PATIENT_ID);
      expect(args[4]).toBe('notes');
    });

    it('devrait lever NotFoundException si le patient n\'existe pas', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.findOne(PSY_USER_ID, 'nonexistent', ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait lever NotFoundException si le patient appartient à un autre psy (isolation tenant)', async () => {
      // findFirst with combined { id, psychologistId } returns null when psy doesn't match
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.findOne(PSY_USER_ID, PATIENT_ID, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);

      // Verify the query included psychologistId filter
      const findFirstArg = mockPrisma.patient.findFirst.mock.calls[0]?.[0] as {
        where: { psychologistId: string };
      };
      expect(findFirstArg.where.psychologistId).toBe(PSY_ID);
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('devrait mettre à jour les champs fournis', async () => {
      const existing = makePatient();
      const updated = makePatient({ name: 'Marie Martin' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.patient.update.mockResolvedValueOnce(updated);
      mockAudit.log.mockResolvedValueOnce(undefined);

      const result = await service.update(
        PSY_USER_ID,
        PATIENT_ID,
        { name: 'Marie Martin' },
        ACTOR_ID,
      );

      expect(result.name).toBe('Marie Martin');
      expect(mockPrisma.patient.update).toHaveBeenCalledOnce();
    });

    it('devrait chiffrer les notes si modifiées', async () => {
      const existing = makePatient();
      const updated = makePatient({ notes: 'encrypted:Nouvelles notes' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.patient.update.mockResolvedValueOnce(updated);
      mockAudit.log.mockResolvedValueOnce(undefined);

      await service.update(PSY_USER_ID, PATIENT_ID, { notes: 'Nouvelles notes' }, ACTOR_ID);

      const updateArg = mockPrisma.patient.update.mock.calls[0]?.[0] as {
        data: { notes: string };
      };
      expect(updateArg.data.notes).toBe('encrypted:Nouvelles notes');
      expect(mockEncryption.encrypt).toHaveBeenCalledWith('Nouvelles notes');
    });

    it('devrait enregistrer un audit UPDATE', async () => {
      const existing = makePatient();
      const updated = makePatient({ phone: '+33612345678' });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.patient.update.mockResolvedValueOnce(updated);
      mockAudit.log.mockResolvedValueOnce(undefined);

      await service.update(PSY_USER_ID, PATIENT_ID, { phone: '+33612345678' }, ACTOR_ID);

      expect(mockAudit.log).toHaveBeenCalledOnce();
      const logArg = mockAudit.log.mock.calls[0]?.[0] as { action: string };
      expect(logArg.action).toBe('UPDATE');
    });

    it('devrait lever NotFoundException si le patient n\'existe pas', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update(PSY_USER_ID, 'nonexistent', { name: 'X' }, ACTOR_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── archive() ─────────────────────────────────────────────────────────────────
  describe('archive()', () => {
    it('devrait passer le status à "archived"', async () => {
      const existing = makePatient();
      const archived = makePatient({ status: 'archived' as never });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.patient.update.mockResolvedValueOnce(archived);
      mockAudit.log.mockResolvedValueOnce(undefined);

      const result = await service.archive(PSY_USER_ID, PATIENT_ID, ACTOR_ID);

      expect(result.status).toBe('archived');
      const updateArg = mockPrisma.patient.update.mock.calls[0]?.[0] as {
        data: { status: string };
      };
      expect(updateArg.data.status).toBe('archived');
    });

    it('devrait enregistrer un audit DELETE avec metadata soft:true', async () => {
      const existing = makePatient();
      const archived = makePatient({ status: 'archived' as never });
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.patient.update.mockResolvedValueOnce(archived);
      mockAudit.log.mockResolvedValueOnce(undefined);

      await service.archive(PSY_USER_ID, PATIENT_ID, ACTOR_ID);

      expect(mockAudit.log).toHaveBeenCalledOnce();
      const logArg = mockAudit.log.mock.calls[0]?.[0] as {
        action: string;
        metadata: { soft: boolean };
      };
      expect(logArg.action).toBe('DELETE');
      expect(logArg.metadata?.soft).toBe(true);
    });
  });

  // ── getStats() ────────────────────────────────────────────────────────────────
  describe('getStats()', () => {
    it('devrait retourner les stats filtrées par psychologistId', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      // Parallel count calls: total, active, inactive, archived, newThisMonth
      mockPrisma.patient.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(7)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(3);

      const stats = await service.getStats(PSY_USER_ID);

      expect(stats.total).toBe(10);
      expect(stats.active).toBe(7);
      expect(stats.inactive).toBe(2);
      expect(stats.archived).toBe(1);
      expect(stats.newThisMonth).toBe(3);

      // All count queries should filter by psychologistId
      for (const call of mockPrisma.patient.count.mock.calls) {
        const arg = (call as [{ where: { psychologistId: string } }])[0];
        expect(arg.where.psychologistId).toBe(PSY_ID);
      }
    });

    it('devrait retourner 0 si aucun patient', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.patient.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const stats = await service.getStats(PSY_USER_ID);

      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.inactive).toBe(0);
      expect(stats.archived).toBe(0);
      expect(stats.newThisMonth).toBe(0);
    });

    it('devrait lever ForbiddenException si le psychologue n\'existe pas', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(null);

      await expect(service.getStats(PSY_USER_ID)).rejects.toThrow(ForbiddenException);
    });
  });
});

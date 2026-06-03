import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { PatientsService } from '../patients.service';
import type { ImportPatientRowDto } from '../dto/import-patients.dto';
import type { Psychologist } from '@prisma/client';

const mockPrisma = {
  patient: {
    findMany: vi.fn(),
    count: vi.fn(),
    createMany: vi.fn(),
  },
  psychologist: { findUnique: vi.fn() },
  subscription: { findUnique: vi.fn() },
  auditLog: { create: vi.fn() },
};

const mockEncryption = {
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace('enc:', '')),
};

const mockAudit = { log: vi.fn(), logRead: vi.fn(), logDecrypt: vi.fn() };
const mockDocuments = { purgePatientDocuments: vi.fn() };

const PSY_USER_ID = 'psy-user-uuid';
const PSY_ID = 'psy-db-uuid';
const ACTOR_ID = 'actor-uuid';

const mockPsy = { id: PSY_ID, userId: PSY_USER_ID } as unknown as Psychologist;

function createService(): PatientsService {
  return new PatientsService(
    mockPrisma as never,
    mockEncryption as never,
    mockAudit as never,
    mockDocuments as never,
  );
}

function rows(...r: ImportPatientRowDto[]): ImportPatientRowDto[] {
  return r;
}

describe('PatientsService.importPatients()', () => {
  let service: PatientsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
    mockPrisma.psychologist.findUnique.mockResolvedValue(mockPsy);
    mockPrisma.patient.findMany.mockResolvedValue([]); // aucun patient existant par défaut
    mockPrisma.subscription.findUnique.mockResolvedValue({ plan: 'pro' }); // illimité par défaut
    mockPrisma.patient.createMany.mockImplementation((args: { data: unknown[] }) =>
      Promise.resolve({ count: args.data.length }),
    );
    mockPrisma.patient.count.mockResolvedValue(0);
  });

  it('importe des lignes valides et chiffre les notes', async () => {
    const report = await service.importPatients(
      PSY_USER_ID,
      rows(
        { name: 'Marie Dupont', email: 'marie@example.com', notes: 'Anxiété' },
        { name: 'Jean Martin', phone: '0612345678' },
      ),
      ACTOR_ID,
    );

    expect(report.imported).toBe(2);
    expect(report.total).toBe(2);
    const data = mockPrisma.patient.createMany.mock.calls[0]?.[0]?.data as Array<{
      name: string; psychologistId: string; notes: string | null; email: string | null;
    }>;
    expect(data).toHaveLength(2);
    expect(data[0]?.psychologistId).toBe(PSY_ID);
    expect(data[0]?.notes).toBe('enc:Anxiété');
    expect(mockEncryption.encrypt).toHaveBeenCalledWith('Anxiété');
  });

  it('déduplique à l\'intérieur du fichier (même email)', async () => {
    const report = await service.importPatients(
      PSY_USER_ID,
      rows(
        { name: 'Marie Dupont', email: 'marie@example.com' },
        { name: 'Marie D.', email: 'MARIE@example.com' }, // même email (casse différente)
      ),
      ACTOR_ID,
    );

    expect(report.imported).toBe(1);
    expect(report.skippedDuplicates).toHaveLength(1);
    expect(report.skippedDuplicates[0]?.reason).toContain('fichier');
  });

  it('déduplique contre les patients existants (email déjà présent)', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([
      { email: 'marie@example.com', name: 'Marie Dupont' },
    ]);

    const report = await service.importPatients(
      PSY_USER_ID,
      rows({ name: 'Marie Dupont', email: 'marie@example.com' }),
      ACTOR_ID,
    );

    expect(report.imported).toBe(0);
    expect(report.skippedDuplicates).toHaveLength(1);
    expect(mockPrisma.patient.createMany).not.toHaveBeenCalled();
  });

  it('parse les dates FR (JJ/MM/AAAA) et avertit sur les dates illisibles', async () => {
    const report = await service.importPatients(
      PSY_USER_ID,
      rows(
        { name: 'A', birthDate: '15/03/1985' },
        { name: 'B', birthDate: 'pas une date' },
      ),
      ACTOR_ID,
    );

    expect(report.imported).toBe(2);
    const data = mockPrisma.patient.createMany.mock.calls[0]?.[0]?.data as Array<{ birthDate: Date | null }>;
    expect(data[0]?.birthDate).toBeInstanceOf(Date);
    expect(data[0]?.birthDate?.toISOString().slice(0, 10)).toBe('1985-03-15');
    expect(data[1]?.birthDate).toBeNull();
    expect(report.warnings.some((w) => w.reason.includes('Date de naissance'))).toBe(true);
  });

  it('ignore un email invalide en avertissement (sans bloquer la ligne)', async () => {
    const report = await service.importPatients(
      PSY_USER_ID,
      rows({ name: 'C', email: 'pas-un-email' }),
      ACTOR_ID,
    );

    expect(report.imported).toBe(1);
    const data = mockPrisma.patient.createMany.mock.calls[0]?.[0]?.data as Array<{ email: string | null }>;
    expect(data[0]?.email).toBeNull();
    expect(report.warnings.some((w) => w.reason.includes('Email'))).toBe(true);
  });

  it('respecte la limite de patients du plan Free (15)', async () => {
    mockPrisma.subscription.findUnique.mockResolvedValue({ plan: 'free' });
    mockPrisma.patient.count.mockResolvedValue(14); // déjà 14 actifs

    await expect(
      service.importPatients(
        PSY_USER_ID,
        rows({ name: 'X' }, { name: 'Y' }), // +2 → 16 > 15
        ACTOR_ID,
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(mockPrisma.patient.createMany).not.toHaveBeenCalled();
  });

  it('tague la source à "import" par défaut', async () => {
    await service.importPatients(PSY_USER_ID, rows({ name: 'Z' }), ACTOR_ID);
    const data = mockPrisma.patient.createMany.mock.calls[0]?.[0]?.data as Array<{ source: string }>;
    expect(data[0]?.source).toBe('import');
  });

  it('enregistre un audit CREATE avec metadata import', async () => {
    await service.importPatients(PSY_USER_ID, rows({ name: 'Z' }), ACTOR_ID);
    expect(mockAudit.log).toHaveBeenCalledOnce();
    const logArg = mockAudit.log.mock.calls[0]?.[0] as { action: string; metadata: { import: boolean } };
    expect(logArg.action).toBe('CREATE');
    expect(logArg.metadata?.import).toBe(true);
  });
});

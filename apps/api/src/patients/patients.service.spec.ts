import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PatientsService } from './patients.service';

// Focused unit tests for the HDS fixes from the 2026-06-05 audit:
//  - mood notes must be decrypted before being returned to the psy / RGPD export
//  - bulk decryption (RGPD export, CSV export) must be audited (DECRYPT/READ)

function buildService(prismaOverrides: Record<string, any> = {}) {
  const prisma = {
    psychologist: { findUnique: vi.fn().mockResolvedValue({ id: 'psy1', userId: 'user1' }) },
    patient: {
      findFirst: vi.fn().mockResolvedValue({ id: 'pat1', psychologistId: 'psy1' }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    moodTracking: { findMany: vi.fn().mockResolvedValue([]) },
    ...prismaOverrides,
  };

  const encryption = {
    decrypt: vi.fn().mockImplementation((v: string) => `PLAIN(${v})`),
    encrypt: vi.fn().mockImplementation((v: string) => `ENC(${v})`),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined), logDecrypt: vi.fn().mockResolvedValue(undefined) };
  const documentsService = {} as any;

  const service = new PatientsService(
    prisma as any,
    encryption as any,
    audit as any,
    documentsService,
  );

  return { service, prisma, encryption, audit };
}

describe('PatientsService.getPatientPortalMood', () => {
  it('déchiffre la note d\'humeur avant de la renvoyer au psychologue', async () => {
    const { service } = buildService({
      patient: { findFirst: vi.fn().mockResolvedValue({ id: 'pat1' }) },
      moodTracking: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'm1', mood: 7, note: 'cipher1', createdAt: new Date('2026-06-01') },
        ]),
      },
    });

    const result = (await service.getPatientPortalMood('user1', 'pat1')) as Array<{ note: string | null }>;

    expect(result[0]?.note).toBe('PLAIN(cipher1)');
  });

  it('émet un audit DECRYPT pour l\'accès psy aux notes chiffrées', async () => {
    const { service, audit } = buildService({
      patient: { findFirst: vi.fn().mockResolvedValue({ id: 'pat1' }) },
      moodTracking: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'm1', mood: 7, note: 'cipher1', createdAt: new Date() },
        ]),
      },
    });

    await service.getPatientPortalMood('user1', 'pat1');

    const decryptCalls = [
      ...audit.log.mock.calls.filter((c: any[]) => c[0]?.action === 'DECRYPT'),
      ...audit.logDecrypt.mock.calls,
    ];
    expect(decryptCalls.length).toBeGreaterThan(0);
  });

  it('gère une note nulle sans planter', async () => {
    const { service } = buildService({
      patient: { findFirst: vi.fn().mockResolvedValue({ id: 'pat1' }) },
      moodTracking: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'm1', mood: 5, note: null, createdAt: new Date() },
        ]),
      },
    });

    const result = (await service.getPatientPortalMood('user1', 'pat1')) as Array<{ note: string | null }>;
    expect(result[0]?.note).toBeNull();
  });
});

describe('PatientsService.exportPatientRgpd', () => {
  function patientWithMood() {
    return {
      id: 'pat1', name: 'X', email: null, phone: null, birthDate: null,
      status: 'active', source: 'direct', notes: null, createdAt: new Date(),
      sessions: [], appointments: [], exercises: [], assessments: [],
      moodTrackings: [{ mood: 6, note: 'cipherMood', createdAt: new Date() }],
    };
  }

  it('déchiffre la note d\'humeur dans l\'export RGPD (pas de ciphertext)', async () => {
    const { service } = buildService({
      patient: { findFirst: vi.fn().mockResolvedValue(patientWithMood()) },
    });

    const result = (await service.exportPatientRgpd('user1', 'pat1')) as {
      moodTracking: Array<{ note: string | null }>;
    };

    expect(result.moodTracking[0]?.note).toBe('PLAIN(cipherMood)');
  });

  it('émet un audit DECRYPT pour l\'export du dossier', async () => {
    const { service, audit } = buildService({
      patient: { findFirst: vi.fn().mockResolvedValue(patientWithMood()) },
    });

    await service.exportPatientRgpd('user1', 'pat1');

    const decryptCalls = audit.log.mock.calls.filter((c: any[]) => c[0]?.action === 'DECRYPT');
    expect(decryptCalls.length).toBeGreaterThan(0);
  });
});

describe('PatientsService.exportAllCsv', () => {
  it('émet un audit pour l\'export de masse de la patientèle', async () => {
    const { service, audit } = buildService({
      patient: { findMany: vi.fn().mockResolvedValue([]) },
    });

    await service.exportAllCsv('user1');

    expect(audit.log).toHaveBeenCalled();
  });
});

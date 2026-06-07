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

describe('PatientsService.purge (RGPD — preuve de consentement)', () => {
  function buildPurgeService(consents: any[]) {
    const prisma = {
      psychologist: { findUnique: vi.fn().mockResolvedValue({ id: 'psy1', userId: 'user1' }) },
      patient: {
        findFirst: vi.fn().mockResolvedValue({ id: 'pat1', psychologistId: 'psy1' }),
        delete: vi.fn().mockResolvedValue({ id: 'pat1' }),
      },
      gdprConsent: { findMany: vi.fn().mockResolvedValue(consents) },
    };
    const encryption = { decrypt: vi.fn(), encrypt: vi.fn() };
    const audit = { log: vi.fn().mockResolvedValue(undefined), logDecrypt: vi.fn().mockResolvedValue(undefined) };
    const documentsService = { purgePatientDocuments: vi.fn().mockResolvedValue(undefined) };
    const service = new PatientsService(prisma as any, encryption as any, audit as any, documentsService as any);
    return { service, prisma, audit };
  }

  it('archive la preuve de consentement dans audit_logs AVANT la suppression en cascade', async () => {
    const consents = [
      { type: 'data_processing', version: '2024-01-v1', consentedAt: new Date('2024-01-01'), withdrawnAt: null, refusedAt: null, consentGivenBy: 'patient', ipAddress: '1.2.3.4' },
      { type: 'ai_processing', version: '2024-01-v1', consentedAt: new Date('2024-02-01'), withdrawnAt: null, refusedAt: null, consentGivenBy: 'patient', ipAddress: '1.2.3.4' },
    ];
    const { service, prisma, audit } = buildPurgeService(consents);

    await service.purge('user1', 'pat1', 'actor1');

    const archiveCall = audit.log.mock.calls.find((c: any[]) => c[0]?.action === 'CONSENT_ARCHIVE');
    expect(archiveCall).toBeDefined();
    expect(archiveCall![0].entityType).toBe('gdpr_consent');
    expect(archiveCall![0].entityId).toBe('pat1');
    expect((archiveCall![0].metadata as any).consents).toHaveLength(2);

    // L'archivage doit précéder le delete (sinon la cascade efface la preuve)
    const archiveOrder = audit.log.mock.invocationCallOrder[
      audit.log.mock.calls.findIndex((c: any[]) => c[0]?.action === 'CONSENT_ARCHIVE')
    ];
    const deleteOrder = prisma.patient.delete.mock.invocationCallOrder[0];
    expect(archiveOrder).toBeLessThan(deleteOrder);
  });

  it('n\'émet pas d\'archivage si le patient n\'a aucun consentement', async () => {
    const { service, audit } = buildPurgeService([]);

    await service.purge('user1', 'pat1', 'actor1');

    expect(audit.log.mock.calls.some((c: any[]) => c[0]?.action === 'CONSENT_ARCHIVE')).toBe(false);
  });

  it('procède quand même à la suppression et au DELETE audité', async () => {
    const { service, prisma, audit } = buildPurgeService([]);

    await service.purge('user1', 'pat1', 'actor1');

    expect(prisma.patient.delete).toHaveBeenCalledWith({ where: { id: 'pat1' } });
    expect(audit.log.mock.calls.some((c: any[]) => c[0]?.action === 'DELETE')).toBe(true);
  });
});

import { vi, describe, it, expect } from 'vitest';
import { GuardianPortalService } from './guardian-portal.service';

// Tests sécu/HDS du portail tuteur (audit #10 — service sans tests).
// L'accès au patientId est déjà gardé en amont par GuardianAccessGuard (lien
// tuteur↔mineur vérifié). Ici on verrouille le déchiffrement + l'audit.

function buildService(overrides: Record<string, any> = {}) {
  const prisma: any = {
    legalGuardian: { findMany: vi.fn().mockResolvedValue([]) },
    moodTracking: { findMany: vi.fn().mockResolvedValue([]) },
    journalEntry: { findMany: vi.fn().mockResolvedValue([]) },
    exercise: { findMany: vi.fn().mockResolvedValue([]) },
    ...overrides.prisma,
  };
  const encryption = {
    decrypt: vi.fn().mockImplementation((v: string) => `PLAIN(${v})`),
    encrypt: vi.fn(),
  };
  const audit = { log: vi.fn().mockResolvedValue(undefined), logRead: vi.fn().mockResolvedValue(undefined), logDecrypt: vi.fn().mockResolvedValue(undefined) };

  const service = new GuardianPortalService(prisma as any, encryption as any, audit as any);
  return { service, prisma, encryption, audit };
}

describe('GuardianPortalService.getMinors', () => {
  it('ne retourne que les patients mineurs liés au tuteur', async () => {
    const { service, prisma } = buildService();
    prisma.legalGuardian.findMany.mockResolvedValue([
      { patient: { id: 'p1', name: 'A', isMinor: true, status: 'active', birthDate: null, psychologist: { name: 'Dr', specialization: null } }, relationship: 'parent', isPrimary: true },
      { patient: { id: 'p2', name: 'B', isMinor: false, status: 'active', birthDate: null, psychologist: { name: 'Dr', specialization: null } }, relationship: 'parent', isPrimary: false },
    ]);

    const result = await service.getMinors('guardianUser');

    expect(result).toHaveLength(1);
    expect(result[0].patientId).toBe('p1');
  });
});

describe('GuardianPortalService.getJournal', () => {
  it('déchiffre les entrées non-privées et émet un audit logDecrypt', async () => {
    const { service, prisma, encryption, audit } = buildService();
    prisma.journalEntry.findMany.mockResolvedValue([
      { id: 'j1', content: 'cipher', mood: 6, tags: [], isPrivate: false, createdAt: new Date() },
    ]);

    const result = await service.getJournal('guardianUser', 'p1');

    expect(encryption.decrypt).toHaveBeenCalledWith('cipher');
    expect(result[0].content).toBe('PLAIN(cipher)');
    expect(audit.logDecrypt).toHaveBeenCalledWith('guardianUser', 'guardian', 'journal_entry', 'p1', 'content', undefined);
  });

  it('ne demande que les entrées isPrivate=false (cloisonnement mineur)', async () => {
    const { service, prisma } = buildService();
    await service.getJournal('guardianUser', 'p1');

    expect(prisma.journalEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ patientId: 'p1', isPrivate: false }) }),
    );
  });
});

describe('GuardianPortalService.getMood', () => {
  it('déchiffre la note d\'humeur et audite un READ', async () => {
    const { service, prisma, encryption, audit } = buildService();
    prisma.moodTracking.findMany.mockResolvedValue([
      { id: 'm1', mood: 7, note: 'cipher', createdAt: new Date() },
    ]);

    const result = await service.getMood('guardianUser', 'p1', 30);

    expect(encryption.decrypt).toHaveBeenCalledWith('cipher');
    expect(result[0].note).toBe('PLAIN(cipher)');
    expect(audit.logRead).toHaveBeenCalledWith('guardianUser', 'guardian', 'mood_tracking', 'p1', undefined);
  });

  it('tolère une note dont le déchiffrement échoue (renvoie null)', async () => {
    const { service, prisma, encryption } = buildService();
    prisma.moodTracking.findMany.mockResolvedValue([
      { id: 'm1', mood: 5, note: 'corrupt', createdAt: new Date() },
    ]);
    encryption.decrypt.mockImplementation(() => { throw new Error('bad tag'); });

    const result = await service.getMood('guardianUser', 'p1', 30);
    expect(result[0].note).toBeNull();
  });
});

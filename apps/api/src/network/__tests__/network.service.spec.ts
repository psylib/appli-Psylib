import { vi } from 'vitest';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { NetworkService } from '../network.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  psychologist: {
    findUnique: vi.fn(),
  },
  referral: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

const mockEncryption = {
  encrypt: vi.fn((text: string) => `encrypted:${text}`),
};

const mockNotifications = {
  createNotification: vi.fn(),
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ME_USER_ID = 'user-me-001';
const ME_PSY_ID = 'psy-me-001';
const FROM_PSY_ID = 'psy-from-002';
const TO_PSY_ID = 'psy-to-003';
const REFERRAL_ID = 'referral-001';

const fakeMe = { id: ME_PSY_ID, userId: ME_USER_ID, name: 'Dr. Moi', slug: 'dr-moi', networkProfile: null };

// Adressage entre deux AUTRES psys — "moi" n'en est pas partie prenante
const foreignReferral = {
  id: REFERRAL_ID,
  fromPsyId: FROM_PSY_ID,
  toPsyId: TO_PSY_ID,
  status: 'accepted',
  patientInitials: 'J.M.',
};

function createService(): NetworkService {
  return new NetworkService(
    mockPrisma as any,
    mockEncryption as any,
    mockNotifications as any,
  );
}

// ---------------------------------------------------------------------------
// Tests — updateReferralStatus (autorisation cross-tenant)
// ---------------------------------------------------------------------------

describe('NetworkService.updateReferralStatus', () => {
  let service: NetworkService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
    mockPrisma.psychologist.findUnique.mockResolvedValue(fakeMe);
    mockPrisma.referral.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: REFERRAL_ID, ...data }),
    );
  });

  it('throws NotFoundException when referral does not exist', async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(null);

    await expect(
      service.updateReferralStatus(REFERRAL_ID, ME_USER_ID, { status: 'accepted' as any }),
    ).rejects.toThrow(NotFoundException);
  });

  // ── Faille corrigée : écriture cross-tenant via status 'pending' ──────────
  it('blocks a non-party psy from resetting a foreign referral to pending (IDOR fix)', async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(foreignReferral);

    await expect(
      service.updateReferralStatus(REFERRAL_ID, ME_USER_ID, { status: 'pending' as any }),
    ).rejects.toThrow(ForbiddenException);

    expect(mockPrisma.referral.update).not.toHaveBeenCalled();
  });

  it('blocks a non-party psy from changing a foreign referral status (any value)', async () => {
    mockPrisma.referral.findUnique.mockResolvedValue(foreignReferral);

    for (const status of ['accepted', 'declined', 'completed'] as const) {
      await expect(
        service.updateReferralStatus(REFERRAL_ID, ME_USER_ID, { status: status as any }),
      ).rejects.toThrow(ForbiddenException);
    }
    expect(mockPrisma.referral.update).not.toHaveBeenCalled();
  });

  it('rejects pending as a user-initiated target status even for a party', async () => {
    // "moi" est le destinataire de cet adressage
    mockPrisma.referral.findUnique.mockResolvedValue({
      ...foreignReferral,
      toPsyId: ME_PSY_ID,
    });

    await expect(
      service.updateReferralStatus(REFERRAL_ID, ME_USER_ID, { status: 'pending' as any }),
    ).rejects.toThrow(BadRequestException);
    expect(mockPrisma.referral.update).not.toHaveBeenCalled();
  });

  it('lets the recipient accept the referral', async () => {
    mockPrisma.referral.findUnique.mockResolvedValue({
      ...foreignReferral,
      toPsyId: ME_PSY_ID,
      status: 'pending',
    });

    const res = await service.updateReferralStatus(REFERRAL_ID, ME_USER_ID, { status: 'accepted' as any });

    expect(mockPrisma.referral.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: REFERRAL_ID },
        data: expect.objectContaining({ status: 'accepted', respondedAt: expect.any(Date) }),
      }),
    );
    expect(res.status).toBe('accepted');
  });

  it('forbids the sender from accepting/declining (recipient-only action)', async () => {
    mockPrisma.referral.findUnique.mockResolvedValue({
      ...foreignReferral,
      fromPsyId: ME_PSY_ID,
      status: 'pending',
    });

    await expect(
      service.updateReferralStatus(REFERRAL_ID, ME_USER_ID, { status: 'accepted' as any }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.updateReferralStatus(REFERRAL_ID, ME_USER_ID, { status: 'declined' as any }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets either party mark the referral completed', async () => {
    mockPrisma.referral.findUnique.mockResolvedValue({
      ...foreignReferral,
      fromPsyId: ME_PSY_ID,
      status: 'accepted',
    });

    const res = await service.updateReferralStatus(REFERRAL_ID, ME_USER_ID, { status: 'completed' as any });

    expect(res.status).toBe('completed');
    expect(mockPrisma.referral.update).toHaveBeenCalled();
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReferralService } from '../referral.service';
import type { Psychologist } from '@prisma/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPrisma = {
  psychologist: {
    findUnique: vi.fn(),
  },
  referralInvite: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
  },
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const PSY_USER_ID = 'psy-user-uuid';
const PSY_ID = 'psy-db-uuid';
const OTHER_PSY_ID = 'other-psy-uuid';

const mockPsychologist = {
  id: PSY_ID,
  userId: PSY_USER_ID,
  name: 'Dr. Test',
} as Psychologist;

const otherPsychologist = {
  id: OTHER_PSY_ID,
  userId: 'other-user-uuid',
  name: 'Dr. Other',
} as Psychologist;

// ─── Service factory ───────────────────────────────────────────────────────────
function createService(): ReferralService {
  return new ReferralService(mockPrisma as never);
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('ReferralService', () => {
  let service: ReferralService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // ── getOrCreateCode() ───────────────────────────────────────────────────────
  describe('getOrCreateCode()', () => {
    it('should return existing pending code if one exists', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.referralInvite.findFirst.mockResolvedValueOnce({
        code: 'DRTEST-AB12',
        referrerId: PSY_ID,
        referredId: null,
        status: 'pending',
      });

      const result = await service.getOrCreateCode(PSY_USER_ID);

      expect(result.code).toBe('DRTEST-AB12');
      expect(mockPrisma.referralInvite.create).not.toHaveBeenCalled();
    });

    it('should create a new code when none exists', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.referralInvite.findFirst.mockResolvedValueOnce(null);
      // findUnique for conflict check — no conflict
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce(null);
      mockPrisma.referralInvite.create.mockResolvedValueOnce({
        code: 'DRTEST-XY34',
        referrerId: PSY_ID,
      });

      const result = await service.getOrCreateCode(PSY_USER_ID);

      expect(result.code).toBe('DRTEST-XY34');
      expect(mockPrisma.referralInvite.create).toHaveBeenCalledOnce();
      const createArg = mockPrisma.referralInvite.create.mock.calls[0]?.[0] as {
        data: { referrerId: string };
      };
      expect(createArg.data.referrerId).toBe(PSY_ID);
    });

    it('should throw NotFoundException when psychologist does not exist', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.getOrCreateCode(PSY_USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── getStats() ──────────────────────────────────────────────────────────────
  describe('getStats()', () => {
    it('should return sent, converted, and rewardsPending counts', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.referralInvite.count
        .mockResolvedValueOnce(5)  // sent
        .mockResolvedValueOnce(2)  // converted
        .mockResolvedValueOnce(1); // rewardsPending

      const stats = await service.getStats(PSY_USER_ID);

      expect(stats.sent).toBe(5);
      expect(stats.converted).toBe(2);
      expect(stats.rewardsPending).toBe(1);
    });

    it('should filter all counts by psychologistId (referrerId)', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.referralInvite.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      await service.getStats(PSY_USER_ID);

      for (const call of mockPrisma.referralInvite.count.mock.calls) {
        const arg = (call as [{ where: { referrerId: string } }])[0];
        expect(arg.where.referrerId).toBe(PSY_ID);
      }
    });

    it('should throw NotFoundException when psychologist does not exist', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(null);

      await expect(service.getStats(PSY_USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── validateCode() ──────────────────────────────────────────────────────────
  describe('validateCode()', () => {
    it('should validate a pending code successfully', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(otherPsychologist);
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce({
        id: 'invite-1',
        code: 'DRTEST-AB12',
        referrerId: PSY_ID,
        status: 'pending',
      });
      mockPrisma.referralInvite.findFirst.mockResolvedValueOnce(null); // not already referred
      mockPrisma.referralInvite.update.mockResolvedValueOnce({});

      const result = await service.validateCode('other-user-uuid', 'DRTEST-AB12');

      expect(result.success).toBe(true);
      expect(mockPrisma.referralInvite.update).toHaveBeenCalledOnce();
      const updateArg = mockPrisma.referralInvite.update.mock.calls[0]?.[0] as {
        data: { referredId: string; status: string };
      };
      expect(updateArg.data.referredId).toBe(OTHER_PSY_ID);
      expect(updateArg.data.status).toBe('used');
    });

    it('should throw BadRequestException for invalid code', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(otherPsychologist);
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.validateCode('other-user-uuid', 'INVALID'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for already used code', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(otherPsychologist);
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce({
        id: 'invite-1',
        code: 'DRTEST-AB12',
        referrerId: PSY_ID,
        status: 'used',
      });

      await expect(
        service.validateCode('other-user-uuid', 'DRTEST-AB12'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when using own code', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(mockPsychologist);
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce({
        id: 'invite-1',
        code: 'DRTEST-AB12',
        referrerId: PSY_ID,
        status: 'pending',
      });

      await expect(
        service.validateCode(PSY_USER_ID, 'DRTEST-AB12'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when psychologist already used a referral code', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(otherPsychologist);
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce({
        id: 'invite-1',
        code: 'DRTEST-AB12',
        referrerId: PSY_ID,
        status: 'pending',
      });
      // Already referred
      mockPrisma.referralInvite.findFirst.mockResolvedValueOnce({
        id: 'prev-invite',
        referredId: OTHER_PSY_ID,
      });

      await expect(
        service.validateCode('other-user-uuid', 'DRTEST-AB12'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when psychologist does not exist', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.validateCode(PSY_USER_ID, 'DRTEST-AB12'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── applyRewardForReferrer() ────────────────────────────────────────────────
  describe('applyRewardForReferrer()', () => {
    it('should update invite to rewarded and return stripeSubscriptionId', async () => {
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce({
        id: 'invite-1',
        code: 'DRTEST-AB12',
        referrerId: PSY_ID,
        status: 'used',
      });
      mockPrisma.referralInvite.update.mockResolvedValueOnce({});
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        psychologistId: PSY_ID,
        stripeSubscriptionId: 'sub_123',
      });

      const result = await service.applyRewardForReferrer('DRTEST-AB12');

      expect(result).toBe('sub_123');
      const updateArg = mockPrisma.referralInvite.update.mock.calls[0]?.[0] as {
        data: { status: string; rewardGivenAt: Date };
      };
      expect(updateArg.data.status).toBe('rewarded');
      expect(updateArg.data.rewardGivenAt).toBeInstanceOf(Date);
    });

    it('should return null when invite is not found', async () => {
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce(null);

      const result = await service.applyRewardForReferrer('NONEXISTENT');

      expect(result).toBeNull();
      expect(mockPrisma.referralInvite.update).not.toHaveBeenCalled();
    });

    it('should return null when invite status is not used', async () => {
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce({
        id: 'invite-1',
        code: 'DRTEST-AB12',
        referrerId: PSY_ID,
        status: 'pending',
      });

      const result = await service.applyRewardForReferrer('DRTEST-AB12');

      expect(result).toBeNull();
      expect(mockPrisma.referralInvite.update).not.toHaveBeenCalled();
    });

    it('should return null when referrer has no subscription', async () => {
      mockPrisma.referralInvite.findUnique.mockResolvedValueOnce({
        id: 'invite-1',
        code: 'DRTEST-AB12',
        referrerId: PSY_ID,
        status: 'used',
      });
      mockPrisma.referralInvite.update.mockResolvedValueOnce({});
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);

      const result = await service.applyRewardForReferrer('DRTEST-AB12');

      expect(result).toBeNull();
    });
  });
});

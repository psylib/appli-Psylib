import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { AssistantsService } from './assistants.service';

function createMocks() {
  const prisma = {
    psychologist: { findUnique: vi.fn() },
    assistant: { count: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    assistantInvitation: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    user: { create: vi.fn() },
    $transaction: vi.fn(),
  };
  const auth = {
    provisionAssistantAccount: vi.fn(),
    setKeycloakUserEnabled: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const email = { sendAssistantInvitation: vi.fn() };
  const config = { get: vi.fn().mockReturnValue('https://psylib.eu') };
  const service = new AssistantsService(
    prisma as any,
    auth as any,
    audit as any,
    email as any,
    config as any,
  );
  return { service, prisma, auth, audit, email, config };
}

function psyWithPlan(plan: SubscriptionPlan | null) {
  return {
    id: 'psy-1',
    name: 'Dr Test',
    subscription: plan ? { plan, status: 'active' } : null,
  };
}

describe('AssistantsService', () => {
  let mocks: ReturnType<typeof createMocks>;
  beforeEach(() => {
    mocks = createMocks();
  });

  describe('inviteAssistant', () => {
    it('throws Forbidden when plan limit is 0 (FREE)', async () => {
      mocks.prisma.psychologist.findUnique.mockResolvedValue(psyWithPlan(SubscriptionPlan.FREE));
      await expect(
        mocks.service.inviteAssistant('user-1', { name: 'Alice', email: 'a@b.fr' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws Forbidden when count >= limit', async () => {
      mocks.prisma.psychologist.findUnique.mockResolvedValue(psyWithPlan(SubscriptionPlan.SOLO)); // limit 1
      mocks.prisma.assistant.count.mockResolvedValue(1);
      await expect(
        mocks.service.inviteAssistant('user-1', { name: 'Alice', email: 'a@b.fr' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('creates assistant + invitation + sends email when under limit', async () => {
      mocks.prisma.psychologist.findUnique.mockResolvedValue(psyWithPlan(SubscriptionPlan.PRO)); // limit 3
      mocks.prisma.assistant.count.mockResolvedValue(0);
      mocks.prisma.assistant.create.mockResolvedValue({ id: 'asst-1', email: 'a@b.fr' });
      mocks.prisma.assistantInvitation.create.mockResolvedValue({ id: 'inv-1', token: 'tok' });

      const res = await mocks.service.inviteAssistant('user-1', { name: 'Alice', email: 'a@b.fr' });

      expect(res).toEqual({ id: 'asst-1' });
      expect(mocks.prisma.assistant.create).toHaveBeenCalled();
      expect(mocks.prisma.assistantInvitation.create).toHaveBeenCalled();
      expect(mocks.email.sendAssistantInvitation).toHaveBeenCalledWith(
        'a@b.fr',
        expect.objectContaining({ activationUrl: expect.stringContaining('/assistant-invite/') }),
      );
      expect(mocks.audit.log).toHaveBeenCalled();
    });

    it('throws NotFound when psychologist missing', async () => {
      mocks.prisma.psychologist.findUnique.mockResolvedValue(null);
      await expect(
        mocks.service.inviteAssistant('user-1', { name: 'Alice', email: 'a@b.fr' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('revokeAssistant', () => {
    it('enforces tenant ownership (throws if assistant belongs to another psychologist)', async () => {
      mocks.prisma.psychologist.findUnique.mockResolvedValue(psyWithPlan(SubscriptionPlan.PRO));
      mocks.prisma.assistant.findUnique.mockResolvedValue({
        id: 'asst-9',
        psychologistId: 'OTHER-psy',
        userId: 'kc-9',
      });
      await expect(
        mocks.service.revokeAssistant('user-1', 'asst-9'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mocks.prisma.assistant.update).not.toHaveBeenCalled();
    });

    it('revokes and disables keycloak user when owned', async () => {
      mocks.prisma.psychologist.findUnique.mockResolvedValue(psyWithPlan(SubscriptionPlan.PRO));
      mocks.prisma.assistant.findUnique.mockResolvedValue({
        id: 'asst-1',
        psychologistId: 'psy-1',
        userId: 'kc-1',
      });
      mocks.prisma.assistant.update.mockResolvedValue({});
      mocks.auth.setKeycloakUserEnabled.mockResolvedValue(undefined);

      await mocks.service.revokeAssistant('user-1', 'asst-1');

      expect(mocks.prisma.assistant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'asst-1' }, data: { status: 'revoked' } }),
      );
      expect(mocks.auth.setKeycloakUserEnabled).toHaveBeenCalledWith('kc-1', false);
      expect(mocks.audit.log).toHaveBeenCalled();
    });
  });

  describe('acceptInvitation', () => {
    it('rejects an invalid token', async () => {
      mocks.prisma.assistantInvitation.findUnique.mockResolvedValue(null);
      await expect(
        mocks.service.acceptInvitation('bad', 'password123'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an expired token', async () => {
      mocks.prisma.assistantInvitation.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: 'pending',
        expiresAt: new Date(Date.now() - 1000),
        assistantId: 'asst-1',
        email: 'a@b.fr',
      });
      await expect(
        mocks.service.acceptInvitation('tok', 'password123'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

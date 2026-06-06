/**
 * Tests RÉELS du SubscriptionGuard.
 *
 * Exerce la vraie classe SubscriptionGuard + un vrai Reflector lisant les
 * métadonnées posées par @RequireFeature / @RequirePlan. Seuls PrismaService
 * et SubscriptionService sont mockés. Une régression du gating par plan
 * (expiration, plan minimum, limites feature) fait échouer un test.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionPlan, SubscriptionStatus } from '@psyscale/shared-types';
import { SubscriptionGuard } from '../subscription.guard';
import { RequireFeature, RequirePlan } from '../../decorators/require-plan.decorator';

class SampleBillingController {
  @RequireFeature('patients')
  createPatient() {}

  @RequirePlan(SubscriptionPlan.PRO)
  proFeature() {}

  unrestricted() {}
}

const proto = SampleBillingController.prototype as unknown as Record<
  string,
  (...a: unknown[]) => unknown
>;

const PSY_USER_SUB = 'user-psy-a-uuid';
const PSY_ID = 'psy-db-id';

function makeContext(handler: (...a: unknown[]) => unknown): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => SampleBillingController,
    switchToHttp: () => ({ getRequest: () => ({ user: { sub: PSY_USER_SUB } }) }),
  } as unknown as ExecutionContext;
}

describe('SubscriptionGuard (réel)', () => {
  let guard: SubscriptionGuard;
  let prisma: { psychologist: { findUnique: ReturnType<typeof vi.fn> } };
  let subService: {
    checkPatientLimit: ReturnType<typeof vi.fn>;
    checkSessionLimit: ReturnType<typeof vi.fn>;
    checkAiUsage: ReturnType<typeof vi.fn>;
    checkCourseLimit: ReturnType<typeof vi.fn>;
    checkExpenseLimit: ReturnType<typeof vi.fn>;
    checkDocumentQuota: ReturnType<typeof vi.fn>;
  };

  function psyWith(plan: SubscriptionPlan, status: SubscriptionStatus | null) {
    return {
      id: PSY_ID,
      userId: PSY_USER_SUB,
      subscription: status === null ? null : { plan, status },
    };
  }

  beforeEach(() => {
    prisma = { psychologist: { findUnique: vi.fn() } };
    subService = {
      checkPatientLimit: vi.fn().mockResolvedValue(undefined),
      checkSessionLimit: vi.fn().mockResolvedValue(undefined),
      checkAiUsage: vi.fn().mockResolvedValue(undefined),
      checkCourseLimit: vi.fn().mockResolvedValue(undefined),
      checkExpenseLimit: vi.fn().mockResolvedValue(undefined),
      checkDocumentQuota: vi.fn().mockResolvedValue(undefined),
    };
    guard = new SubscriptionGuard(
      new Reflector(),
      subService as never,
      prisma as never,
    );
  });

  it('autorise une route sans @RequireFeature/@RequirePlan sans toucher la DB', async () => {
    const ctx = makeContext(proto.unrestricted);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.psychologist.findUnique).not.toHaveBeenCalled();
  });

  it('refuse si le profil psychologue est introuvable → ForbiddenException', async () => {
    prisma.psychologist.findUnique.mockResolvedValueOnce(null);
    const ctx = makeContext(proto.createPatient);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('refuse si l’abonnement est CANCELED (avant même la vérif feature)', async () => {
    prisma.psychologist.findUnique.mockResolvedValueOnce(
      psyWith(SubscriptionPlan.PRO, SubscriptionStatus.CANCELED),
    );
    const ctx = makeContext(proto.createPatient);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    expect(subService.checkPatientLimit).not.toHaveBeenCalled();
  });

  it('refuse si l’abonnement est PAST_DUE', async () => {
    prisma.psychologist.findUnique.mockResolvedValueOnce(
      psyWith(SubscriptionPlan.SOLO, SubscriptionStatus.PAST_DUE),
    );
    const ctx = makeContext(proto.createPatient);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('refuse si le plan ne couvre pas @RequirePlan(PRO) (psy en FREE)', async () => {
    prisma.psychologist.findUnique.mockResolvedValueOnce(
      psyWith(SubscriptionPlan.FREE, SubscriptionStatus.ACTIVE),
    );
    const ctx = makeContext(proto.proFeature);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('autorise @RequirePlan(PRO) si le psy est en PRO actif', async () => {
    prisma.psychologist.findUnique.mockResolvedValueOnce(
      psyWith(SubscriptionPlan.PRO, SubscriptionStatus.ACTIVE),
    );
    const ctx = makeContext(proto.proFeature);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('@RequireFeature(patients) appelle checkPatientLimit avec l’id du psy', async () => {
    prisma.psychologist.findUnique.mockResolvedValueOnce(
      psyWith(SubscriptionPlan.FREE, SubscriptionStatus.ACTIVE),
    );
    const ctx = makeContext(proto.createPatient);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(subService.checkPatientLimit).toHaveBeenCalledWith(PSY_ID);
  });

  it('propage le refus de checkPatientLimit (limite atteinte) → ForbiddenException', async () => {
    prisma.psychologist.findUnique.mockResolvedValueOnce(
      psyWith(SubscriptionPlan.FREE, SubscriptionStatus.ACTIVE),
    );
    subService.checkPatientLimit.mockRejectedValueOnce(
      new ForbiddenException('Limite de patients atteinte'),
    );
    const ctx = makeContext(proto.createPatient);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('autorise un psy sans abonnement (défaut FREE actif) sur une feature FREE', async () => {
    prisma.psychologist.findUnique.mockResolvedValueOnce(
      psyWith(SubscriptionPlan.FREE, null),
    );
    const ctx = makeContext(proto.createPatient);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(subService.checkPatientLimit).toHaveBeenCalledWith(PSY_ID);
  });
});

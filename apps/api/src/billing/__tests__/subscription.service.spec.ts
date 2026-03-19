import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SubscriptionService } from '../subscription.service';
import { SubscriptionPlan, SubscriptionStatus } from '@psyscale/shared-types';
import type { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  psychologist: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  session: {
    count: vi.fn(),
  },
  patient: {
    count: vi.fn(),
  },
  aiUsage: {
    count: vi.fn(),
  },
};

const mockStripeService = {
  createOrRetrieveCustomer: vi.fn(),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  retrieveSubscription: vi.fn(),
  listInvoices: vi.fn(),
};

const mockEmailService = {
  sendSubscriptionActivated: vi.fn().mockResolvedValue(undefined),
  sendPaymentFailed: vi.fn().mockResolvedValue(undefined),
  sendSubscriptionCanceled: vi.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  get: vi.fn((key: string) => {
    const map: Record<string, string> = {
      FRONTEND_URL: 'https://psylib.eu',
      STRIPE_PRICE_ID_STARTER: 'price_starter_test',
      STRIPE_PRICE_ID_PRO: 'price_pro_test',
      STRIPE_PRICE_ID_CLINIC: 'price_clinic_test',
    };
    return map[key];
  }),
} as unknown as ConfigService;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makePsy(overrides = {}) {
  return {
    id: 'psy-1',
    userId: 'user-1',
    name: 'Dr Dupont',
    slug: 'dupont-abc12',
    isOnboarded: true,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'dupont@example.com',
    ...overrides,
  };
}

function makeSub(overrides = {}) {
  return {
    id: 'sub-1',
    psychologistId: 'psy-1',
    stripeCustomerId: 'cus_test123',
    stripeSubscriptionId: 'sub_test123',
    plan: SubscriptionPlan.STARTER,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    ...overrides,
  };
}

function makeStripeSubscription(overrides: Partial<Stripe.Subscription> = {}): Stripe.Subscription {
  return {
    id: 'sub_test123',
    object: 'subscription',
    status: 'active',
    cancel_at_period_end: false,
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
    trial_end: null,
    items: {
      object: 'list',
      data: [
        {
          id: 'si_test',
          object: 'subscription_item',
          price: { id: 'price_starter_test' } as Stripe.Price,
        } as Stripe.SubscriptionItem,
      ],
      has_more: false,
      url: '',
    },
    metadata: { psychologist_id: 'psy-1' },
    customer: 'cus_test123',
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function createService(): SubscriptionService {
  return new SubscriptionService(
    mockPrisma as never,
    mockStripeService as never,
    mockConfig,
    mockEmailService as never,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  // -------------------------------------------------------------------------
  // getSubscription()
  // -------------------------------------------------------------------------

  describe('getSubscription()', () => {
    it('retourne le plan actuel et son statut', async () => {
      const psy = makePsy();
      const sub = makeSub();
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.subscription.findUnique.mockResolvedValue(sub);

      const result = await service.getSubscription('user-1');

      expect(result.plan).toBe(SubscriptionPlan.STARTER);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.stripeCustomerId).toBe('cus_test123');
      expect(result.cancelAtPeriodEnd).toBe(false);
    });

    it("retourne le plan 'free' si aucun abonnement en DB", async () => {
      const psy = makePsy();
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.subscription.findUnique.mockResolvedValue(null);

      const result = await service.getSubscription('user-1');

      expect(result.plan).toBe(SubscriptionPlan.FREE);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.stripeCustomerId).toBeNull();
      expect(result.currentPeriodEnd).toBeNull();
    });

    it('lève NotFoundException si le psychologue est introuvable', async () => {
      mockPrisma.psychologist.findUnique.mockResolvedValue(null);

      await expect(service.getSubscription('user-unknown')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // createCheckoutSession()
  // -------------------------------------------------------------------------

  describe('createCheckoutSession()', () => {
    it('crée une session Stripe checkout et retourne une URL', async () => {
      const psy = makePsy();
      const user = makeUser();
      const customer = { id: 'cus_test123' };
      const checkoutSession = { url: 'https://checkout.stripe.com/pay/cs_test123' };

      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockStripeService.createOrRetrieveCustomer.mockResolvedValue(customer);
      mockPrisma.subscription.upsert.mockResolvedValue(makeSub());
      mockStripeService.createCheckoutSession.mockResolvedValue(checkoutSession);

      const result = await service.createCheckoutSession('user-1', SubscriptionPlan.STARTER);

      expect(result).toEqual({ url: checkoutSession.url });
      expect(mockStripeService.createOrRetrieveCustomer).toHaveBeenCalledWith(
        user.email,
        psy.name,
        psy.id,
      );
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: customer.id,
          priceId: 'price_starter_test',
          trialDays: 14,
        }),
      );
    });

    it('upsert la subscription en DB avec le stripeCustomerId', async () => {
      const psy = makePsy();
      const user = makeUser();
      const customer = { id: 'cus_test123' };
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockStripeService.createOrRetrieveCustomer.mockResolvedValue(customer);
      mockPrisma.subscription.upsert.mockResolvedValue(makeSub());
      mockStripeService.createCheckoutSession.mockResolvedValue({
        url: 'https://checkout.stripe.com/pay/cs_test',
      });

      await service.createCheckoutSession('user-1', SubscriptionPlan.PRO);

      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { psychologistId: 'psy-1' },
          create: expect.objectContaining({
            stripeCustomerId: customer.id,
            plan: SubscriptionPlan.FREE,
          }),
          update: expect.objectContaining({ stripeCustomerId: customer.id }),
        }),
      );
    });

    it('lève ForbiddenException pour le plan FREE', async () => {
      await expect(
        service.createCheckoutSession('user-1', SubscriptionPlan.FREE),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lève ForbiddenException si la session Stripe ne retourne pas d\'URL', async () => {
      const psy = makePsy();
      const user = makeUser();
      mockPrisma.psychologist.findUnique.mockResolvedValue(psy);
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockStripeService.createOrRetrieveCustomer.mockResolvedValue({ id: 'cus_test' });
      mockPrisma.subscription.upsert.mockResolvedValue(makeSub());
      mockStripeService.createCheckoutSession.mockResolvedValue({ url: null });

      await expect(
        service.createCheckoutSession('user-1', SubscriptionPlan.STARTER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // checkPatientLimit()
  // -------------------------------------------------------------------------

  describe('checkPatientLimit()', () => {
    it('ne lève pas d\'erreur si sous la limite du plan', async () => {
      // STARTER: 20 patients max — 5 patients actuels
      mockPrisma.subscription.findUnique.mockResolvedValue(makeSub({ plan: SubscriptionPlan.STARTER }));
      mockPrisma.patient.count.mockResolvedValue(5);

      await expect(service.checkPatientLimit('psy-1')).resolves.toBeUndefined();
    });

    it('lève ForbiddenException si la limite est atteinte', async () => {
      // STARTER: 20 patients max — 20 patients actuels
      mockPrisma.subscription.findUnique.mockResolvedValue(makeSub({ plan: SubscriptionPlan.STARTER }));
      mockPrisma.patient.count.mockResolvedValue(20);

      await expect(service.checkPatientLimit('psy-1')).rejects.toThrow(ForbiddenException);
    });

    it('ne lève pas d\'erreur sur plan PRO (patients illimités)', async () => {
      // PRO: patients = null (illimité)
      mockPrisma.subscription.findUnique.mockResolvedValue(makeSub({ plan: SubscriptionPlan.PRO }));

      await expect(service.checkPatientLimit('psy-1')).resolves.toBeUndefined();
      // Aucun appel DB pour compter les patients
      expect(mockPrisma.patient.count).not.toHaveBeenCalled();
    });

    it('utilise le plan FREE si aucune subscription en DB', async () => {
      // FREE: 5 patients max — 5 actuels → erreur
      mockPrisma.subscription.findUnique.mockResolvedValue(null);
      mockPrisma.patient.count.mockResolvedValue(5);

      await expect(service.checkPatientLimit('psy-1')).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------------------------------------------------------
  // checkSessionLimit()
  // -------------------------------------------------------------------------

  describe('checkSessionLimit()', () => {
    it('ne lève pas d\'erreur si sous la limite mensuelle', async () => {
      // STARTER: 40 sessions max — 10 ce mois
      mockPrisma.subscription.findUnique.mockResolvedValue(makeSub({ plan: SubscriptionPlan.STARTER }));
      mockPrisma.session.count.mockResolvedValue(10);

      await expect(service.checkSessionLimit('psy-1')).resolves.toBeUndefined();
    });

    it('lève ForbiddenException si la limite mensuelle est atteinte', async () => {
      // STARTER: 40 sessions max — 40 ce mois
      mockPrisma.subscription.findUnique.mockResolvedValue(makeSub({ plan: SubscriptionPlan.STARTER }));
      mockPrisma.session.count.mockResolvedValue(40);

      await expect(service.checkSessionLimit('psy-1')).rejects.toThrow(ForbiddenException);
    });

    it('ne lève pas d\'erreur sur plan PRO (sessions illimitées)', async () => {
      // PRO: sessions = null (illimité)
      mockPrisma.subscription.findUnique.mockResolvedValue(makeSub({ plan: SubscriptionPlan.PRO }));

      await expect(service.checkSessionLimit('psy-1')).resolves.toBeUndefined();
      expect(mockPrisma.session.count).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleWebhookEvent()
  // -------------------------------------------------------------------------

  describe('handleWebhookEvent()', () => {
    it('traite customer.subscription.updated', async () => {
      const stripeSub = makeStripeSubscription({ status: 'active' });
      const event = {
        type: 'customer.subscription.updated',
        data: { object: stripeSub },
      } as Stripe.Event;

      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWebhookEvent(event);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeSubscriptionId: stripeSub.id },
          data: expect.objectContaining({
            plan: SubscriptionPlan.STARTER, // price_starter_test
            status: SubscriptionStatus.ACTIVE,
          }),
        }),
      );
    });

    it('traite customer.subscription.deleted', async () => {
      const stripeSub = makeStripeSubscription();
      const event = {
        type: 'customer.subscription.deleted',
        data: { object: stripeSub },
      } as Stripe.Event;

      const subWithRelations = {
        ...makeSub(),
        psychologist: {
          name: 'Dr Dupont',
          user: { email: 'dupont@example.com' },
        },
      };
      mockPrisma.subscription.findUnique.mockResolvedValue(subWithRelations);
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWebhookEvent(event);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeSubscriptionId: stripeSub.id },
          data: expect.objectContaining({
            plan: SubscriptionPlan.FREE,
            status: SubscriptionStatus.CANCELED,
            stripeSubscriptionId: null,
          }),
        }),
      );
    });

    it('traite invoice.payment_failed', async () => {
      const invoice = {
        id: 'in_test',
        subscription: 'sub_test123',
      } as Partial<Stripe.Invoice>;
      const event = {
        type: 'invoice.payment_failed',
        data: { object: invoice },
      } as Stripe.Event;

      const subWithRelations = {
        ...makeSub(),
        psychologist: {
          name: 'Dr Dupont',
          user: { email: 'dupont@example.com' },
        },
      };
      mockPrisma.subscription.findUnique.mockResolvedValue(subWithRelations);
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWebhookEvent(event);

      expect(mockPrisma.subscription.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stripeSubscriptionId: 'sub_test123' },
          data: expect.objectContaining({ status: SubscriptionStatus.PAST_DUE }),
        }),
      );
    });

    it('ignore les événements inconnus sans erreur', async () => {
      const event = {
        type: 'customer.created',
        data: { object: {} },
      } as unknown as Stripe.Event;

      await expect(service.handleWebhookEvent(event)).resolves.toBeUndefined();
      expect(mockPrisma.subscription.updateMany).not.toHaveBeenCalled();
    });

    it('traite checkout.session.completed et active la subscription', async () => {
      const stripeSub = makeStripeSubscription();
      const checkoutSession = {
        id: 'cs_test',
        subscription: 'sub_test123',
        customer: 'cus_test123',
      } as Partial<Stripe.Checkout.Session>;
      const event = {
        type: 'checkout.session.completed',
        data: { object: checkoutSession },
      } as Stripe.Event;

      mockStripeService.retrieveSubscription.mockResolvedValue(stripeSub);
      mockPrisma.subscription.upsert.mockResolvedValue(makeSub());
      mockPrisma.psychologist.findUnique.mockResolvedValue({
        ...makePsy(),
        user: { email: 'dupont@example.com' },
      });

      await service.handleWebhookEvent(event);

      expect(mockStripeService.retrieveSubscription).toHaveBeenCalledWith('sub_test123');
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { psychologistId: 'psy-1' },
          create: expect.objectContaining({
            plan: SubscriptionPlan.STARTER,
            status: SubscriptionStatus.ACTIVE,
          }),
        }),
      );
    });
  });
});

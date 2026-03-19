import { BadRequestException } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WebhookController } from './webhook.controller';
import type Stripe from 'stripe';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_EVENT: Partial<Stripe.Event> = {
  id: 'evt_test_123',
  type: 'customer.subscription.updated',
  object: 'event',
};

const WEBHOOK_SECRET = 'whsec_test_secret';

function buildRawRequest(body?: Buffer) {
  return { rawBody: body ?? Buffer.from('{}') };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('WebhookController', () => {
  let controller: WebhookController;
  let stripeService: { constructWebhookEvent: ReturnType<typeof vi.fn> };
  let prisma: {
    stripeEvent: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let billingQueue: { add: ReturnType<typeof vi.fn> };
  let config: { getOrThrow: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    stripeService = {
      constructWebhookEvent: vi.fn().mockReturnValue(MOCK_EVENT),
    };

    prisma = {
      stripeEvent: {
        findUnique: vi.fn().mockResolvedValue(null), // pas encore traité
        create: vi.fn().mockResolvedValue({}),
      },
    };

    billingQueue = {
      add: vi.fn().mockResolvedValue({}),
    };

    config = {
      get: vi.fn(),
      getOrThrow: vi.fn().mockImplementation((key: string) => {
        if (key === 'STRIPE_WEBHOOK_SECRET') return WEBHOOK_SECRET;
        throw new Error(`Config ${key} not found`);
      }),
    };

    // Direct instantiation — aligned with project test patterns
    controller = new WebhookController(
      stripeService as any,
      prisma as any,
      config as any,
      billingQueue as any,
    );
  });

  // ─── Validation ───────────────────────────────────────────────────────────

  describe('request validation', () => {
    it('throws BadRequestException when rawBody is missing', async () => {
      const req = { rawBody: undefined };
      await expect(
        controller.handleStripeWebhook(req as any, 'sig'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when stripe-signature header is empty', async () => {
      const req = buildRawRequest();
      await expect(
        controller.handleStripeWebhook(req as any, ''),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when Stripe signature is invalid', async () => {
      stripeService.constructWebhookEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature');
      });
      const req = buildRawRequest();

      await expect(
        controller.handleStripeWebhook(req as any, 'bad-sig'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Idempotency ──────────────────────────────────────────────────────────

  describe('idempotency', () => {
    it('returns { received: true } immediately when event already processed', async () => {
      prisma.stripeEvent.findUnique.mockResolvedValue({ stripeEventId: MOCK_EVENT.id! });

      const req = buildRawRequest();
      const result = await controller.handleStripeWebhook(req as any, 'valid-sig');

      expect(result).toEqual({ received: true });
      expect(billingQueue.add).not.toHaveBeenCalled();
      expect(prisma.stripeEvent.create).not.toHaveBeenCalled();
    });

    it('persists event BEFORE enqueuing (guarantees idempotency)', async () => {
      const callOrder: string[] = [];
      prisma.stripeEvent.create.mockImplementation(async () => {
        callOrder.push('create');
        return {};
      });
      billingQueue.add.mockImplementation(async () => {
        callOrder.push('queue');
        return {};
      });

      await controller.handleStripeWebhook(buildRawRequest() as any, 'valid-sig');

      expect(callOrder).toEqual(['create', 'queue']);
    });
  });

  // ─── Happy path ───────────────────────────────────────────────────────────

  describe('happy path', () => {
    it('returns { received: true } on valid first-time event', async () => {
      const result = await controller.handleStripeWebhook(buildRawRequest() as any, 'valid-sig');
      expect(result).toEqual({ received: true });
    });

    it('records event with correct stripeEventId and type', async () => {
      await controller.handleStripeWebhook(buildRawRequest() as any, 'valid-sig');

      expect(prisma.stripeEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stripeEventId: MOCK_EVENT.id,
            type: MOCK_EVENT.type,
          }),
        }),
      );
    });

    it('enqueues job with event payload and 3 retry attempts', async () => {
      await controller.handleStripeWebhook(buildRawRequest() as any, 'valid-sig');

      expect(billingQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ event: MOCK_EVENT }),
        expect.objectContaining({ attempts: 3 }),
      );
    });

    it('uses exponential backoff strategy on retry', async () => {
      await controller.handleStripeWebhook(buildRawRequest() as any, 'valid-sig');

      const [, , options] = billingQueue.add.mock.calls[0] as [string, unknown, { backoff: { type: string } }];
      expect(options.backoff.type).toBe('exponential');
    });

    it('calls constructWebhookEvent with rawBody, signature and secret', async () => {
      const rawBody = Buffer.from('{"id":"evt_test"}');
      await controller.handleStripeWebhook({ rawBody } as any, 'sig_123');

      expect(stripeService.constructWebhookEvent).toHaveBeenCalledWith(
        rawBody,
        'sig_123',
        WEBHOOK_SECRET,
      );
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BillingQueueProcessor } from './billing.queue';
import type Stripe from 'stripe';

const MOCK_EVENT = { id: 'evt_test_123', type: 'customer.subscription.updated' } as Stripe.Event;

function buildProcessor() {
  const subscriptionService = { handleWebhookEvent: vi.fn().mockResolvedValue(undefined) };
  const prisma = {
    stripeEvent: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const processor = new BillingQueueProcessor(subscriptionService as any, prisma as any);
  return { processor, subscriptionService, prisma };
}

describe('BillingQueueProcessor', () => {
  let env: ReturnType<typeof buildProcessor>;

  beforeEach(() => {
    env = buildProcessor();
  });

  it('marque processedAt APRÈS un traitement réussi', async () => {
    const { processor, subscriptionService, prisma } = env;
    const job = { data: { event: MOCK_EVENT } } as any;

    await processor.process(job);

    expect(subscriptionService.handleWebhookEvent).toHaveBeenCalledWith(MOCK_EVENT);
    expect(prisma.stripeEvent.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeEventId: MOCK_EVENT.id },
        data: expect.objectContaining({ processedAt: expect.any(Date) }),
      }),
    );
  });

  it('ne marque PAS processedAt si le traitement échoue (rethrow pour retry)', async () => {
    const { processor, subscriptionService, prisma } = env;
    subscriptionService.handleWebhookEvent.mockRejectedValue(new Error('boom'));
    const job = { data: { event: MOCK_EVENT } } as any;

    await expect(processor.process(job)).rejects.toThrow('boom');
    expect(prisma.stripeEvent.updateMany).not.toHaveBeenCalled();
  });

  it('supprime le marqueur d\'idempotence quand les retries sont épuisés (rejeu possible)', async () => {
    const { processor, prisma } = env;
    const job = { data: { event: MOCK_EVENT }, attemptsMade: 3, opts: { attempts: 3 } } as any;

    await processor.onFailed(job);

    expect(prisma.stripeEvent.deleteMany).toHaveBeenCalledWith({
      where: { stripeEventId: MOCK_EVENT.id },
    });
  });

  it('ne supprime PAS le marqueur tant qu\'il reste des tentatives', async () => {
    const { processor, prisma } = env;
    const job = { data: { event: MOCK_EVENT }, attemptsMade: 1, opts: { attempts: 3 } } as any;

    await processor.onFailed(job);

    expect(prisma.stripeEvent.deleteMany).not.toHaveBeenCalled();
  });
});

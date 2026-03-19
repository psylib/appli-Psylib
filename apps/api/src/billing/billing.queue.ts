import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SubscriptionService } from './subscription.service';
import type Stripe from 'stripe';

export const BILLING_QUEUE = 'billing';
export const PROCESS_WEBHOOK_JOB = 'process-stripe-webhook';

@Processor(BILLING_QUEUE)
export class BillingQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingQueueProcessor.name);

  constructor(private readonly subscriptionService: SubscriptionService) {
    super();
  }

  async process(job: Job<{ event: Stripe.Event }>): Promise<void> {
    const { event } = job.data;
    this.logger.log(`Processing Stripe event: ${event.type} (${event.id})`);

    try {
      await this.subscriptionService.handleWebhookEvent(event);
    } catch (error) {
      this.logger.error(
        `Failed to process Stripe event ${event.type} (${event.id})`,
        error instanceof Error ? error.message : String(error),
      );
      throw error; // Re-throw pour que BullMQ retry
    }
  }
}

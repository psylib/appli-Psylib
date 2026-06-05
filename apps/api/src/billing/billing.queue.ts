import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../common/prisma.service';
import type Stripe from 'stripe';

export const BILLING_QUEUE = 'billing';
export const PROCESS_WEBHOOK_JOB = 'process-stripe-webhook';

@Processor(BILLING_QUEUE)
export class BillingQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingQueueProcessor.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly prisma: PrismaService,
  ) {
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
      throw error; // Re-throw pour que BullMQ retry — processedAt reste null
    }

    // Succès : marquer l'event comme réellement traité (idempotence définitive)
    await this.prisma.stripeEvent.updateMany({
      where: { stripeEventId: event.id },
      data: { processedAt: new Date() },
    });
  }

  /**
   * Quand toutes les tentatives sont épuisées, on supprime le marqueur
   * d'idempotence (resté avec processedAt null) afin qu'un renvoi de l'event
   * (resend Stripe / rejeu manuel) puisse être retraité au lieu d'être perdu.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<{ event: Stripe.Event }>): Promise<void> {
    const attempts = job.opts?.attempts ?? 1;
    if (job.attemptsMade < attempts) return; // il reste des tentatives

    const eventId = job.data?.event?.id;
    if (!eventId) return;

    this.logger.error(
      `Stripe event ${eventId} a échoué définitivement (${job.attemptsMade}/${attempts}) — `
      + `marqueur d'idempotence supprimé pour permettre un rejeu`,
    );
    await this.prisma.stripeEvent
      .deleteMany({ where: { stripeEventId: eventId } })
      .catch((e) => this.logger.error(`Échec suppression marqueur ${eventId}: ${String(e)}`));
  }
}

import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { StripeService } from './stripe.service';
import { BILLING_QUEUE, PROCESS_WEBHOOK_JOB } from './billing.queue';

@ApiTags('Billing')
@Controller('billing/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(BILLING_QUEUE) private readonly billingQueue: Queue,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');

    if (!req.rawBody) {
      throw new BadRequestException('Raw body manquant');
    }

    if (!signature) {
      throw new BadRequestException('Header stripe-signature manquant');
    }

    let event;
    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.warn(`Webhook signature invalide: ${err instanceof Error ? err.message : String(err)}`);
      throw new BadRequestException('Signature Stripe invalide');
    }

    // Idempotency — check then create with unique constraint catch
    const existing = await this.prisma.stripeEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existing) {
      this.logger.debug(`Stripe event déjà traité: ${event.id}`);
      return { received: true };
    }

    try {
      await this.prisma.stripeEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          // Marqueur de RÉCEPTION (dédup contre les livraisons dupliquées).
          // processedAt reste null jusqu'au traitement RÉUSSI par le worker —
          // évite de perdre définitivement un event si le job échoue.
          processedAt: null,
        },
      });
    } catch (err) {
      // Race condition : une autre instance a créé l'event entre le findUnique et le create
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        this.logger.debug(`Stripe event déjà traité (race): ${event.id}`);
        return { received: true };
      }
      throw err;
    }

    // Enqueuer pour traitement asynchrone
    await this.billingQueue.add(PROCESS_WEBHOOK_JOB, { event }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    this.logger.log(`Stripe event enqueued: ${event.type} (${event.id})`);
    return { received: true };
  }
}

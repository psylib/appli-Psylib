import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BillingController } from './billing.controller';
import { WebhookController } from './webhook.controller';
import { StripeService } from './stripe.service';
import { SubscriptionService } from './subscription.service';
import { BillingQueueProcessor, BILLING_QUEUE } from './billing.queue';
import { SubscriptionGuard } from './guards/subscription.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReferralModule } from '../referral/referral.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: BILLING_QUEUE }),
    NotificationsModule,
    ReferralModule,
  ],
  controllers: [BillingController, WebhookController],
  providers: [StripeService, SubscriptionService, BillingQueueProcessor, SubscriptionGuard],
  exports: [StripeService, SubscriptionService, SubscriptionGuard],
})
export class BillingModule {}

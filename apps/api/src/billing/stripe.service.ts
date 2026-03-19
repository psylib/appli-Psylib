import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private readonly logger = new Logger(StripeService.name);
  private stripe!: Stripe;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const secretKey = this.config.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
      typescript: true,
    });
    this.logger.log('Stripe SDK initialized');
  }

  async createOrRetrieveCustomer(
    email: string,
    name: string,
    psychologistId: string,
  ): Promise<Stripe.Customer> {
    const existing = await this.stripe.customers.search({
      query: `metadata['psychologist_id']:'${psychologistId}'`,
      limit: 1,
    });
    if (existing.data.length > 0) return existing.data[0]!;

    return this.stripe.customers.create({
      email,
      name,
      metadata: { psychologist_id: psychologistId },
    });
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    psychologistId: string;
    trialDays?: number;
    referralCode?: string;
  }): Promise<Stripe.Checkout.Session> {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: params.customerId,
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      allow_promotion_codes: !params.referralCode, // désactiver si coupon referral appliqué
      subscription_data: {
        trial_period_days: params.trialDays,
        metadata: {
          psychologist_id: params.psychologistId,
          ...(params.referralCode ? { referral_code: params.referralCode } : {}),
        },
      },
    };

    if (params.referralCode) {
      const couponId = this.config.get<string>('STRIPE_REFERRAL_COUPON_ID');
      if (couponId) {
        sessionParams.discounts = [{ coupon: couponId }];
      }
    }

    return this.stripe.checkout.sessions.create(sessionParams);
  }

  async extendSubscriptionTrial(subscriptionId: string, days: number): Promise<void> {
    const sub = await this.stripe.subscriptions.retrieve(subscriptionId);
    const currentEnd = sub.trial_end ?? Math.floor(Date.now() / 1000);
    const newEnd = currentEnd + days * 24 * 60 * 60;
    await this.stripe.subscriptions.update(subscriptionId, { trial_end: newEnd });
  }

  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async listInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    const result = await this.stripe.invoices.list({ customer: customerId, limit });
    return result.data;
  }

  constructWebhookEvent(payload: Buffer, signature: string, secret: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}

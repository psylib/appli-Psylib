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

  // ---------------------------------------------------------------------------
  // Stripe Connect Express
  // ---------------------------------------------------------------------------

  async createConnectedAccount(email: string, businessName: string): Promise<Stripe.Account> {
    return this.stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email,
      business_type: 'individual',
      business_profile: {
        mcc: '8049', // Psychologists
        name: businessName,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  }

  async createAccountLink(
    accountId: string,
    returnUrl: string,
    refreshUrl: string,
  ): Promise<string> {
    const link = await this.stripe.accountLinks.create({
      account: accountId,
      return_url: returnUrl,
      refresh_url: refreshUrl,
      type: 'account_onboarding',
    });
    return link.url;
  }

  async getAccountStatus(accountId: string): Promise<{
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  }> {
    const account = await this.stripe.accounts.retrieve(accountId);
    return {
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      detailsSubmitted: account.details_submitted ?? false,
    };
  }

  async createRefund(paymentIntentId: string): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
  }

  /**
   * Creates a Stripe Checkout for post-session payment link.
   * @param params.amount Amount in euros (e.g., 60.00)
   */
  async createPaymentLinkSession(params: {
    connectedAccountId: string;
    amount: number; // euros
    patientEmail: string;
    psychologistName: string;
    appointmentId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Séance avec ${params.psychologistName}`,
            },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: params.patientEmail,
      payment_intent_data: {
        application_fee_amount: 0,
        transfer_data: {
          destination: params.connectedAccountId,
        },
        metadata: {
          appointmentId: params.appointmentId,
          type: 'payment_link',
        },
      },
      metadata: {
        appointmentId: params.appointmentId,
        type: 'payment_link',
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  async createBookingCheckoutSession(params: {
    psyStripeAccountId: string;
    amount: number; // in cents
    patientEmail: string;
    psyName: string;
    appointmentId: string;
    motif: string;
    successUrl: string;
    cancelUrl: string;
    expiresInSeconds?: number; // default 35 min, set 86400 for 24h (email-based)
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: params.patientEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: params.motif,
              description: `Consultation avec ${params.psyName}`,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        transfer_data: {
          destination: params.psyStripeAccountId,
        },
        metadata: {
          appointment_id: params.appointmentId,
        },
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        appointment_id: params.appointmentId,
        type: 'booking_payment',
      },
      expires_at: Math.floor(Date.now() / 1000) + (params.expiresInSeconds ?? 35 * 60),
    });
  }
}

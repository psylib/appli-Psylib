import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { StripeService } from './stripe.service';
import { EmailService } from '../notifications/email.service';
import { SubscriptionPlan, SubscriptionStatus, PLAN_LIMITS } from '@psyscale/shared-types';
import { ReferralService } from '../referral/referral.service';
import type Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly referral: ReferralService,
  ) {}

  private getPriceIdForPlan(plan: SubscriptionPlan): string {
    const map: Record<string, string | undefined> = {
      [SubscriptionPlan.STARTER]: this.config.get('STRIPE_PRICE_ID_STARTER'),
      [SubscriptionPlan.PRO]: this.config.get('STRIPE_PRICE_ID_PRO'),
      [SubscriptionPlan.CLINIC]: this.config.get('STRIPE_PRICE_ID_CLINIC'),
    };
    const priceId = map[plan];
    if (!priceId) throw new ForbiddenException(`Plan ${plan} non disponible ou non configuré`);
    return priceId;
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new NotFoundException('Psychologue introuvable');
    return psy;
  }

  async createCheckoutSession(userId: string, plan: SubscriptionPlan, referralCode?: string): Promise<{ url: string }> {
    if (plan === SubscriptionPlan.FREE) throw new ForbiddenException('Plan FREE non disponible via Stripe');

    const psy = await this.getPsychologist(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const customer = await this.stripe.createOrRetrieveCustomer(user.email, psy.name, psy.id);

    // Assurer l'existence de la subscription en DB avec le stripeCustomerId
    await this.prisma.subscription.upsert({
      where: { psychologistId: psy.id },
      create: {
        psychologistId: psy.id,
        stripeCustomerId: customer.id,
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE,
      },
      update: { stripeCustomerId: customer.id },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const session = await this.stripe.createCheckoutSession({
      customerId: customer.id,
      priceId: this.getPriceIdForPlan(plan),
      successUrl: `${frontendUrl}/dashboard/settings/billing?success=true`,
      cancelUrl: `${frontendUrl}/dashboard/settings/billing?canceled=true`,
      psychologistId: psy.id,
      trialDays: 14,
      referralCode,
    });

    if (!session.url) throw new ForbiddenException('Impossible de créer la session de paiement');
    return { url: session.url };
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    const psy = await this.getPsychologist(userId);
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId: psy.id } });

    if (!sub?.stripeCustomerId) {
      throw new ForbiddenException('Aucun abonnement Stripe associé. Choisissez un plan d\'abord.');
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const session = await this.stripe.createPortalSession(
      sub.stripeCustomerId,
      `${frontendUrl}/dashboard/settings/billing`,
    );
    return { url: session.url };
  }

  async getSubscription(userId: string) {
    const psy = await this.getPsychologist(userId);
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId: psy.id } });

    return {
      plan: (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan,
      status: (sub?.status ?? SubscriptionStatus.ACTIVE) as SubscriptionStatus,
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
      trialEndsAt: sub?.trialEndsAt?.toISOString() ?? null,
      stripeCustomerId: sub?.stripeCustomerId ?? null,
    };
  }

  async getInvoices(userId: string) {
    const psy = await this.getPsychologist(userId);
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId: psy.id } });

    if (!sub?.stripeCustomerId) return [];

    const invoices = await this.stripe.listInvoices(sub.stripeCustomerId);
    return invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amountPaid: inv.amount_paid,
      status: inv.status,
      date: inv.created,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      invoicePdf: inv.invoice_pdf ?? null,
    }));
  }

  // --- Feature gates ---

  async checkPatientLimit(psychologistId: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId } });
    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];
    if (limits.patients === null) return; // illimité

    const count = await this.prisma.patient.count({
      where: { psychologistId, status: { not: 'archived' } },
    });

    if (count >= limits.patients) {
      throw new ForbiddenException({
        code: 'PATIENT_LIMIT',
        currentPlan: plan,
        currentUsage: count,
        limit: limits.patients,
        message: `Limite de ${limits.patients} patients atteinte. Passez au plan Pro pour continuer.`,
      });
    }
  }

  async checkSessionLimit(psychologistId: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId } });
    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];
    if (limits.sessions === null) return; // illimité

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.prisma.session.count({
      where: { psychologistId, date: { gte: startOfMonth } },
    });

    if (count >= limits.sessions) {
      throw new ForbiddenException({
        code: 'SESSION_LIMIT',
        currentPlan: plan,
        currentUsage: count,
        limit: limits.sessions,
        message: `Limite de ${limits.sessions} séances ce mois atteinte.`,
      });
    }
  }

  async checkAiUsage(psychologistId: string, feature: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId } });
    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];

    if (limits.aiSummaries === -1) return; // illimité (Clinic)

    if (limits.aiSummaries === 0) {
      throw new ForbiddenException({
        code: 'AI_LIMIT',
        currentPlan: plan,
        message: "L'assistant IA n'est pas disponible sur le plan gratuit.",
      });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.prisma.aiUsage.count({
      where: { psychologistId, feature, createdAt: { gte: startOfMonth } },
    });

    if (count >= limits.aiSummaries) {
      throw new ForbiddenException({
        code: 'AI_LIMIT',
        currentPlan: plan,
        currentUsage: count,
        limit: limits.aiSummaries,
        message: `Limite de ${limits.aiSummaries} résumés IA ce mois atteinte.`,
      });
    }
  }

  // --- Webhook handlers ---

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    if (!session.subscription || !session.customer) return;

    const stripeSub = await this.stripe.retrieveSubscription(session.subscription as string);
    const psychologistId = stripeSub.metadata['psychologist_id'];
    if (!psychologistId) {
      this.logger.warn('checkout.session.completed: missing psychologist_id in subscription metadata');
      return;
    }
    const plan = this.stripePlanFromSubscription(stripeSub);
    const trialEndsAt = stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null;

    await this.prisma.subscription.upsert({
      where: { psychologistId },
      create: {
        psychologistId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        trialEndsAt,
      },
      update: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        plan,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        trialEndsAt,
      },
    });

    // Email de confirmation d'abonnement
    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      include: { user: { select: { email: true } } },
    });
    if (psy?.user.email) {
      void this.email.sendSubscriptionActivated(psy.user.email, {
        psychologistName: psy.name,
        plan,
        trialEndsAt,
      });
    }

    // Referral reward : étendre l'abonnement du referrer de 30 jours
    const referralCode = stripeSub.metadata['referral_code'];
    if (referralCode) {
      try {
        const referrerSubId = await this.referral.applyRewardForReferrer(referralCode);
        if (referrerSubId) {
          await this.stripe.extendSubscriptionTrial(referrerSubId, 30);
          this.logger.log(`Referral reward applied: code=${referralCode} referrer_sub=${referrerSubId}`);
        }
      } catch (err) {
        this.logger.warn(`Referral reward failed: code=${referralCode} err=${String(err)}`);
      }
    }

    this.logger.log(`Subscription activated for psychologist ${psychologistId}: ${plan}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const plan = this.stripePlanFromSubscription(subscription);
    const status = this.stripeStatusToEnum(subscription.status);

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        plan,
        status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      },
    });
    this.logger.log(`Subscription updated: ${subscription.id} → ${plan} (${status})`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    // Récupérer les infos avant la mise à jour
    const sub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: { psychologist: { include: { user: { select: { email: true } } } } },
    });

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        stripeSubscriptionId: null,
      },
    });

    // Email d'annulation
    if (sub?.psychologist.user.email) {
      const endDate = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;
      void this.email.sendSubscriptionCanceled(sub.psychologist.user.email, {
        psychologistName: sub.psychologist.name,
        endDate,
      });
    }

    this.logger.log(`Subscription canceled: ${subscription.id}`);
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: { status: SubscriptionStatus.ACTIVE },
    });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;

    const sub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
      include: { psychologist: { include: { user: { select: { email: true } } } } },
    });

    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    // Email d'alerte paiement échoué
    if (sub?.psychologist.user.email) {
      const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
      void this.email.sendPaymentFailed(sub.psychologist.user.email, {
        psychologistName: sub.psychologist.name,
        portalUrl: `${frontendUrl}/dashboard/settings/billing`,
      });
    }

    this.logger.warn(`Payment failed for subscription: ${String(invoice.subscription)}`);
  }

  private stripePlanFromSubscription(subscription: Stripe.Subscription): SubscriptionPlan {
    const priceId = subscription.items.data[0]?.price.id ?? '';
    if (priceId === this.config.get('STRIPE_PRICE_ID_STARTER')) return SubscriptionPlan.STARTER;
    if (priceId === this.config.get('STRIPE_PRICE_ID_PRO')) return SubscriptionPlan.PRO;
    if (priceId === this.config.get('STRIPE_PRICE_ID_CLINIC')) return SubscriptionPlan.CLINIC;
    return SubscriptionPlan.FREE;
  }

  private stripeStatusToEnum(status: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      trialing: SubscriptionStatus.TRIALING,
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.PAST_DUE,
      incomplete_expired: SubscriptionStatus.CANCELED,
      unpaid: SubscriptionStatus.PAST_DUE,
    };
    return map[status] ?? SubscriptionStatus.ACTIVE;
  }
}

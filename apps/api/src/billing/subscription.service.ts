import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../common/prisma.service';
import { StripeService } from './stripe.service';
import { EmailService } from '../notifications/email.service';
import { AuditService } from '../common/audit.service';
import { SubscriptionPlan, SubscriptionStatus, PLAN_LIMITS } from '@psyscale/shared-types';
import { ReferralService } from '../referral/referral.service';
import { PaymentCompletedEvent } from '../accounting/events/payment-completed.event';
import type { ConnectSettingsDto } from './dto/connect-settings.dto';
import type { PaymentLinkDto } from './dto/payment-link.dto';
import type Stripe from 'stripe';
import { INVOICE_GENERATION_QUEUE, GenerateInvoiceJobData } from '../invoices/invoice-generation.processor';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
    private readonly email: EmailService,
    private readonly referral: ReferralService,
    private readonly audit: AuditService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(INVOICE_GENERATION_QUEUE)
    private readonly invoiceQueue: Queue<GenerateInvoiceJobData>,
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

  // --- Stripe Connect ---

  async startConnectOnboarding(userId: string): Promise<{ url: string }> {
    const psy = await this.getPsychologist(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    let stripeAccountId = psy.stripeAccountId;

    // Create Connect account if it doesn't exist yet
    if (!stripeAccountId) {
      const account = await this.stripe.createConnectedAccount(user.email, psy.name);
      stripeAccountId = account.id;
      await this.prisma.psychologist.update({
        where: { id: psy.id },
        data: { stripeAccountId: account.id },
      });
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const url = await this.stripe.createAccountLink(
      stripeAccountId,
      `${frontendUrl}/dashboard/settings/billing?connect=return`,
      `${frontendUrl}/dashboard/settings/billing?connect=refresh`,
    );

    return { url };
  }

  async getConnectStatus(userId: string) {
    const psy = await this.getPsychologist(userId);

    if (!psy.stripeAccountId) {
      return {
        hasAccount: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        allowOnlinePayment: psy.allowOnlinePayment,
        stripeOnboardingComplete: psy.stripeOnboardingComplete,
      };
    }

    const status = await this.stripe.getAccountStatus(psy.stripeAccountId);

    // Auto-update onboarding status if charges are now enabled
    if (status.chargesEnabled && status.detailsSubmitted && !psy.stripeOnboardingComplete) {
      await this.prisma.psychologist.update({
        where: { id: psy.id },
        data: { stripeOnboardingComplete: true, allowOnlinePayment: true },
      });
    }

    return {
      hasAccount: true,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      allowOnlinePayment: psy.allowOnlinePayment,
      stripeOnboardingComplete: status.chargesEnabled && status.detailsSubmitted,
    };
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

  async checkCourseLimit(psychologistId: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId } });
    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];

    if (limits.courses === null) return; // unlimited

    if (limits.courses === 0) {
      throw new ForbiddenException({
        code: 'COURSE_LIMIT',
        currentPlan: plan,
        message: 'Les formations ne sont pas disponibles sur votre plan. Passez au plan Pro.',
      });
    }

    const count = await this.prisma.course.count({ where: { psychologistId } });

    if (count >= limits.courses) {
      throw new ForbiddenException({
        code: 'COURSE_LIMIT',
        currentPlan: plan,
        currentUsage: count,
        limit: limits.courses,
        message: `Limite de ${limits.courses} formations atteinte. Passez au plan Clinic pour continuer.`,
      });
    }
  }

  async checkExpenseLimit(psychologistId: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId } });
    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];
    if (limits.expenses === null || limits.expenses === undefined) return; // unlimited

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await this.prisma.expense.count({
      where: { psychologistId, deletedAt: null, createdAt: { gte: startOfMonth } },
    });

    if (count >= limits.expenses) {
      throw new ForbiddenException({
        code: 'EXPENSE_LIMIT',
        currentPlan: plan,
        currentUsage: count,
        limit: limits.expenses,
        message: `Limite de ${limits.expenses} dépenses ce mois atteinte. Passez au plan Solo pour continuer.`,
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
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case 'account.updated':
        await this.handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    // Booking payment (one-time, via Connect)
    if (session.metadata?.['type'] === 'booking_payment') {
      await this.handleBookingPaymentCompleted(session);
      return;
    }

    // Payment link (post-session payment, via Connect)
    if (session.metadata?.['type'] === 'payment_link') {
      await this.handlePaymentLinkCompleted(session);
      return;
    }

    // Subscription checkout (existing logic)
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

  private async handleBookingPaymentCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const appointmentId = session.metadata?.['appointment_id'];
    if (!appointmentId) {
      this.logger.warn('booking_payment checkout.session.completed: missing appointment_id');
      return;
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { consultationType: true },
    });

    if (!appointment) {
      this.logger.warn(`booking_payment: appointment ${appointmentId} not found`);
      return;
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        bookingPaymentStatus: 'paid',
        paidOnline: true,
        paymentIntentId: (session.payment_intent as string) ?? null,
        status: 'scheduled',
      },
    });

    this.logger.log(`Booking payment completed for appointment ${appointmentId}`);

    // Emit payment.completed event for accounting ledger
    try {
      const patientForEvent = await this.prisma.patient.findUnique({
        where: { id: appointment.patientId! },
        select: { name: true },
      });
      this.eventEmitter.emit(
        'payment.completed',
        new PaymentCompletedEvent(
          appointment.psychologistId,
          '',
          null,
          patientForEvent?.name ?? 'Patient',
          Number(session.amount_total ?? 0) / 100,
          new Date(),
          'stripe',
          null,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to emit payment.completed for booking payment: ${error}`);
    }

    // Auto-invoice for booking payment
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { id: appointment.psychologistId },
    });

    if (psychologist?.autoInvoice && appointment.patientId) {
      const rate = appointment.consultationType
        ? Number(appointment.consultationType.rate)
        : Number(psychologist.defaultSessionRate) || 0;

      if (rate > 0) {
        await this.invoiceQueue.add('generate', {
          type: 'payment_received',
          psychologistId: appointment.psychologistId,
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          amount: rate,
          sessionDate: appointment.scheduledAt.toISOString(),
        });
        this.logger.log(`Enqueued auto-invoice for booking payment ${appointment.id}`);
      }
    }
  }

  private async handlePaymentLinkCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const appointmentId = session.metadata?.['appointmentId'];
    if (!appointmentId) {
      this.logger.warn('payment_link checkout.session.completed: missing appointmentId');
      return;
    }

    // Update Payment record by checkout session id
    const payment = await this.prisma.payment.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'paid',
          stripePaymentIntentId: (session.payment_intent as string) ?? null,
        },
      });
    }

    // Update Appointment
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        bookingPaymentStatus: 'paid',
        paidOnline: true,
        paymentIntentId: (session.payment_intent as string) ?? null,
      },
    });

    // Notify psychologist
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        psychologist: {
          select: {
            name: true,
            autoInvoice: true,
            autoInvoiceEmail: true,
            defaultSessionRate: true,
            user: { select: { email: true } },
          },
        },
        patient: { select: { name: true, id: true } },
        consultationType: true,
      },
    });

    if (appointment?.psychologist.user.email) {
      void this.email.sendPaymentReceivedToPsy(
        appointment.psychologist.user.email,
        {
          psychologistName: appointment.psychologist.name,
          patientName: appointment.patient.name,
          amount: payment ? Number(payment.amount) : 0,
        },
      );
    }

    this.logger.log(`Payment link completed for appointment ${appointmentId}`);

    // Emit payment.completed event for accounting ledger
    try {
      this.eventEmitter.emit(
        'payment.completed',
        new PaymentCompletedEvent(
          appointment?.psychologistId ?? '',
          payment?.id ?? '',
          null,
          appointment?.patient?.name ?? 'Patient',
          Number(session.amount_total ?? 0) / 100,
          new Date(),
          'stripe',
          null,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to emit payment.completed for payment link: ${error}`);
    }

    // Auto-invoice for payment link
    if (appointment) {
      const psychologist = appointment.psychologist;

      if (psychologist?.autoInvoice && appointment.patientId) {
        const rate = appointment.consultationType
          ? Number(appointment.consultationType.rate)
          : Number(psychologist.defaultSessionRate) || 0;

        if (rate > 0) {
          await this.invoiceQueue.add('generate', {
            type: 'payment_received',
            psychologistId: appointment.psychologistId,
            patientId: appointment.patientId,
            appointmentId: appointment.id,
            internalPaymentId: payment?.id,
            amount: rate,
            sessionDate: appointment.scheduledAt.toISOString(),
          });
          this.logger.log(`Enqueued auto-invoice for payment link ${appointment.id}`);
        }
      }
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

    if (!paymentIntentId) {
      this.logger.warn('charge.refunded: missing payment_intent');
      return;
    }

    // Find Payment by stripePaymentIntentId
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!payment) {
      this.logger.debug(`charge.refunded: no payment found for PI ${paymentIntentId}`);
      return;
    }

    // Update payment and appointment statuses
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'refunded' },
    });

    if (payment.appointmentId) {
      await this.prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { bookingPaymentStatus: 'refunded' },
      });
    }

    this.logger.log(`Charge refunded synced: payment ${payment.id}, PI ${paymentIntentId}`);
  }

  async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    if (!account.id) return;

    const psy = await this.prisma.psychologist.findUnique({
      where: { stripeAccountId: account.id },
    });

    if (!psy) {
      this.logger.debug(`account.updated: no psychologist for Stripe account ${account.id}`);
      return;
    }

    const chargesEnabled = account.charges_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;
    const onboardingComplete = chargesEnabled && detailsSubmitted;

    if (onboardingComplete !== psy.stripeOnboardingComplete) {
      await this.prisma.psychologist.update({
        where: { id: psy.id },
        data: {
          stripeOnboardingComplete: onboardingComplete,
          allowOnlinePayment: onboardingComplete,
        },
      });
      this.logger.log(`Stripe Connect onboarding ${onboardingComplete ? 'completed' : 'incomplete'} for psy ${psy.id}`);
    }
  }

  // --- Connect Settings ---

  async updateConnectSettings(userId: string, dto: ConnectSettingsDto) {
    const psy = await this.getPsychologist(userId);

    if (!psy.stripeOnboardingComplete) {
      throw new ForbiddenException('Veuillez compléter l\'onboarding Stripe Connect avant de modifier les paramètres de paiement.');
    }

    const updated = await this.prisma.psychologist.update({
      where: { id: psy.id },
      data: {
        paymentMode: dto.paymentMode,
        cancellationDelay: dto.cancellationDelay,
        autoRefund: dto.autoRefund,
        defaultSessionRate: dto.defaultSessionRate,
      },
      select: {
        paymentMode: true,
        cancellationDelay: true,
        autoRefund: true,
        defaultSessionRate: true,
      },
    });

    this.logger.log(`Connect settings updated for psy ${psy.id}`);
    return updated;
  }

  // --- Payment Link ---

  async createPaymentLink(userId: string, dto: PaymentLinkDto) {
    const psy = await this.getPsychologist(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (!psy.stripeAccountId || !psy.stripeOnboardingComplete) {
      throw new ForbiddenException('Stripe Connect non configuré. Complétez l\'onboarding d\'abord.');
    }

    // Resolve appointment
    let appointment;
    if (dto.appointmentId) {
      appointment = await this.prisma.appointment.findFirst({
        where: { id: dto.appointmentId, psychologistId: psy.id },
        include: { patient: true },
      });
    } else if (dto.sessionId) {
      const session = await this.prisma.session.findFirst({
        where: { id: dto.sessionId, psychologistId: psy.id },
        include: { appointment: { include: { patient: true } } },
      });
      if (session?.appointment) {
        appointment = { ...session.appointment, patient: session.appointment.patient };
      }
    }

    if (!appointment) throw new NotFoundException('Rendez-vous introuvable');

    // Resolve amount: explicit > appointment consultationType > psy default
    let amount = dto.amount;
    if (!amount) {
      if (appointment.consultationTypeId) {
        const ct = await this.prisma.consultationType.findUnique({
          where: { id: appointment.consultationTypeId },
        });
        amount = ct ? Number(ct.rate) : undefined;
      }
    }
    if (!amount) {
      amount = psy.defaultSessionRate ? Number(psy.defaultSessionRate) : undefined;
    }
    if (!amount) {
      throw new BadRequestException('Montant requis : aucun tarif par défaut ni type de consultation trouvé.');
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const session = await this.stripe.createPaymentLinkSession({
      connectedAccountId: psy.stripeAccountId,
      amount,
      patientEmail: appointment.patient.email ?? '',
      psychologistName: psy.name,
      appointmentId: appointment.id,
      successUrl: `${frontendUrl}/payment/success?appointmentId=${appointment.id}`,
      cancelUrl: `${frontendUrl}/payment/cancel?appointmentId=${appointment.id}`,
    });

    // Create Payment record
    await this.prisma.payment.create({
      data: {
        psychologistId: psy.id,
        patientId: appointment.patientId,
        type: 'session',
        amount,
        status: 'pending',
        stripeCheckoutSessionId: session.id,
        appointmentId: appointment.id,
      },
    });

    // Audit log
    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'payment_link',
      entityId: appointment.id,
      metadata: { amount, appointmentId: appointment.id },
    });

    // Send payment link email to patient
    if (appointment.patient.email) {
      void this.email.sendPaymentLinkToPatient(
        appointment.patient.email,
        {
          patientName: appointment.patient.name,
          psychologistName: psy.name,
          amount,
          paymentUrl: session.url ?? '',
        },
      );
    }

    this.logger.log(`Payment link created for appointment ${appointment.id}, amount=${amount}€`);
    return { url: session.url, appointmentId: appointment.id };
  }

  // --- Refund ---

  async handleRefund(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, psychologistId: psy.id },
      include: {
        patient: true,
        payments: { where: { status: 'paid' }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!appointment) throw new NotFoundException('Rendez-vous introuvable');

    const payment = appointment.payments[0];
    if (!payment || !payment.stripePaymentIntentId) {
      throw new BadRequestException('Aucun paiement en ligne trouvé pour ce rendez-vous.');
    }

    // Create Stripe refund
    await this.stripe.createRefund(payment.stripePaymentIntentId);

    // Update appointment and payment statuses
    await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { bookingPaymentStatus: 'refunded' },
      }),
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'refunded' },
      }),
    ]);

    // Audit log
    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'UPDATE',
      entityType: 'refund',
      entityId: appointmentId,
      metadata: { paymentId: payment.id, amount: Number(payment.amount) },
    });

    // Send refund email to patient
    if (appointment.patient.email) {
      void this.email.sendRefundConfirmation(
        appointment.patient.email,
        {
          patientName: appointment.patient.name,
          psychologistName: psy.name,
          amount: Number(payment.amount),
        },
      );
    }

    this.logger.log(`Refund processed for appointment ${appointmentId}, payment ${payment.id}`);
    return { success: true, appointmentId };
  }

  // --- Mark Paid On Site ---

  async markPaidOnSite(userId: string, appointmentId: string) {
    const psy = await this.getPsychologist(userId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, psychologistId: psy.id },
      include: { patient: true },
    });

    if (!appointment) throw new NotFoundException('Rendez-vous introuvable');

    // Resolve amount from consultationType or psy default
    let amount: number | undefined;
    if (appointment.consultationTypeId) {
      const ct = await this.prisma.consultationType.findUnique({
        where: { id: appointment.consultationTypeId },
      });
      amount = ct ? Number(ct.rate) : undefined;
    }
    if (!amount) {
      amount = psy.defaultSessionRate ? Number(psy.defaultSessionRate) : 0;
    }

    await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { bookingPaymentStatus: 'paid', paidOnline: false },
      }),
      this.prisma.payment.create({
        data: {
          psychologistId: psy.id,
          patientId: appointment.patientId,
          type: 'session',
          amount: amount ?? 0,
          status: 'paid',
          appointmentId,
        },
      }),
    ]);

    // Emit payment.completed event for accounting ledger
    try {
      this.eventEmitter.emit(
        'payment.completed',
        new PaymentCompletedEvent(
          psy.id,
          '',  // payment id from transaction not easily accessible
          null,  // no invoice yet (auto-invoice may be generated separately)
          appointment.patient?.name ?? 'Patient',
          amount ?? 0,
          new Date(),
          'on_site',
          null,
        ),
      );
    } catch (error) {
      this.logger.error(`Failed to emit payment.completed event for markPaidOnSite: ${error}`);
    }

    this.logger.log(`Marked paid on site for appointment ${appointmentId}`);
    return { success: true, appointmentId };
  }

  // --- Payments List ---

  async getPayments(userId: string, query: {
    status?: string;
    mode?: string;
    from?: string;
    to?: string;
    page?: string;
    limit?: string;
  }) {
    const psy = await this.getPsychologist(userId);

    const page = Math.max(1, parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { psychologistId: psy.id };

    if (query.status) {
      where.status = query.status;
    }

    if (query.mode === 'online') {
      where.stripePaymentIntentId = { not: null };
    } else if (query.mode === 'onsite') {
      where.stripePaymentIntentId = null;
    }

    if (query.from || query.to) {
      const createdAt: Record<string, Date> = {};
      if (query.from) createdAt.gte = new Date(query.from);
      if (query.to) createdAt.lte = new Date(query.to);
      where.createdAt = createdAt;
    }

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: where as never,
        include: {
          patient: { select: { id: true, name: true, email: true } },
          appointment: { select: { id: true, scheduledAt: true, reason: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where: where as never }),
    ]);

    // KPIs
    const kpiWhere = { psychologistId: psy.id } as Record<string, unknown>;
    if (query.from || query.to) {
      const createdAt: Record<string, Date> = {};
      if (query.from) createdAt.gte = new Date(query.from);
      if (query.to) createdAt.lte = new Date(query.to);
      kpiWhere.createdAt = createdAt;
    }

    const allPayments = await this.prisma.payment.findMany({
      where: kpiWhere as never,
      select: { status: true, amount: true, stripePaymentIntentId: true },
    });

    const paidPayments = allPayments.filter(p => p.status === 'paid');
    const totalReceived = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPayments = allPayments.filter(p => p.status === 'pending');
    const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const onlineCount = paidPayments.filter(p => p.stripePaymentIntentId).length;
    const onlineRate = paidPayments.length > 0 ? Math.round((onlineCount / paidPayments.length) * 100) : 0;

    return {
      payments: payments.map(p => ({
        id: p.id,
        patientId: p.patientId,
        patient: p.patient,
        appointment: p.appointment,
        type: p.type,
        amount: Number(p.amount),
        status: p.status,
        stripePaymentIntentId: p.stripePaymentIntentId,
        appointmentId: p.appointmentId,
        createdAt: p.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      kpis: {
        totalReceived,
        totalPending,
        transactionCount: allPayments.length,
        onlineRate,
      },
    };
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

  async getUsage(userId: string) {
    const psy = await this.getPsychologist(userId);
    const sub = await this.prisma.subscription.findUnique({ where: { psychologistId: psy.id } });

    const plan = (sub?.plan ?? SubscriptionPlan.FREE) as SubscriptionPlan;
    const limits = PLAN_LIMITS[plan];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [aiUsageCount, courseCount] = await Promise.all([
      this.prisma.aiUsage.count({
        where: { psychologistId: psy.id, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.course.count({ where: { psychologistId: psy.id } }),
    ]);

    return {
      ai: {
        used: aiUsageCount,
        limit: limits.aiSummaries, // -1 = unlimited, 0 = none
      },
      courses: {
        used: courseCount,
        limit: limits.courses, // null = unlimited, 0 = none
      },
      plan,
    };
  }
}

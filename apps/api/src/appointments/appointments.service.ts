import { randomUUID } from 'crypto';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../common/audit.service';
import { EmailService } from '../notifications/email.service';
import { StripeService } from '../billing/stripe.service';
import { WaitlistService } from '../waitlist/waitlist.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  SendPaymentLinkDto,
} from './dto/appointment.dto';
import { CreateGroupAppointmentDto } from './dto/create-group-appointment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import type { Appointment } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
    @Inject(forwardRef(() => WaitlistService))
    private readonly waitlistService: WaitlistService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, dto: CreateAppointmentDto): Promise<Appointment & { checkoutUrl?: string }> {
    const psy = await this.getPsychologist(userId);

    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, psychologistId: psy.id },
      select: { name: true, email: true },
    });
    if (!patient) throw new NotFoundException('Patient introuvable ou non autorisé');

    const paymentMode = dto.paymentMode ?? 'none';
    const hasPayment = paymentMode !== 'none' && dto.paymentAmount && dto.paymentAmount > 0;

    // Validate payment prerequisites
    if (hasPayment) {
      if (!psy.stripeAccountId || !psy.stripeOnboardingComplete) {
        throw new BadRequestException('Stripe Connect non configuré — activez les paiements en ligne dans Paramètres > Cabinet');
      }
      if (!patient.email) {
        throw new BadRequestException('Le patient n\'a pas d\'email — impossible d\'envoyer le lien de paiement');
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        psychologistId: psy.id,
        patientId: dto.patientId,
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration,
        status: 'scheduled',
        isOnline: dto.isOnline ?? false,
        videoJoinToken: dto.isOnline ? randomUUID() : undefined,
        source: 'internal',
        paymentMode,
        paymentAmount: hasPayment ? dto.paymentAmount : null,
        bookingPaymentStatus: paymentMode === 'prepayment' && hasPayment ? 'pending_payment' : 'none',
      },
    });

    // --- Prepayment flow: send link immediately ---
    if (paymentMode === 'prepayment' && hasPayment && patient.email) {
      const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
      const amountCents = Math.round(dto.paymentAmount! * 100);

      try {
        const checkoutSession = await this.stripeService.createBookingCheckoutSession({
          psyStripeAccountId: psy.stripeAccountId!,
          amount: amountCents,
          patientEmail: patient.email,
          psyName: psy.name,
          appointmentId: appointment.id,
          motif: 'Consultation',
          successUrl: `${frontendUrl}/appointments/payment-success?appointment=${appointment.id}`,
          cancelUrl: `${frontendUrl}/appointments/payment-cancel?appointment=${appointment.id}`,
          expiresInSeconds: 24 * 60 * 60, // 24h — patient receives link by email
        });

        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { paymentIntentId: (checkoutSession.payment_intent as string) ?? null },
        });

        void this.email.sendPrepaymentLink(patient.email, {
          patientName: patient.name,
          psychologistName: psy.name,
          scheduledAt: appointment.scheduledAt,
          duration: appointment.duration,
          amount: dto.paymentAmount!,
          checkoutUrl: checkoutSession.url!,
        });

        void this.notifications.createAndDispatch(
          userId,
          'appointment_update',
          'Nouveau rendez-vous (prépaiement)',
          `RDV avec ${patient.name} — lien de paiement de ${dto.paymentAmount}€ envoyé`,
          { href: '/dashboard/calendar' },
        );

        return { ...appointment, checkoutUrl: checkoutSession.url! };
      } catch (err) {
        this.logger.error(
          `Prepayment checkout failed for appointment ${appointment.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { bookingPaymentStatus: 'none' },
        });
      }
    }

    // --- Post-session mode: just confirm RDV, psy will send link later ---
    if (paymentMode === 'post_session' && hasPayment) {
      if (patient.email) {
        void this.email.sendAppointmentConfirmation(patient.email, {
          patientName: patient.name,
          psychologistName: psy.name,
          scheduledAt: appointment.scheduledAt,
          duration: appointment.duration,
        });
      }

      void this.notifications.createAndDispatch(
        userId,
        'appointment_update',
        'Nouveau rendez-vous',
        `RDV avec ${patient.name} — paiement de ${dto.paymentAmount}€ à envoyer après la séance`,
        { href: '/dashboard/calendar' },
      );

      return appointment;
    }

    // --- Normal flow (no payment) ---
    if (patient.email) {
      void this.email.sendAppointmentConfirmation(patient.email, {
        patientName: patient.name,
        psychologistName: psy.name,
        scheduledAt: appointment.scheduledAt,
        duration: appointment.duration,
      });
    }

    void this.notifications.createAndDispatch(
      userId,
      'appointment_update',
      'Nouveau rendez-vous',
      `RDV avec ${patient.name} le ${new Date(dto.scheduledAt).toLocaleDateString('fr-FR')} à ${new Date(dto.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      { href: '/dashboard/calendar' },
    );

    return appointment;
  }

  async findAll(userId: string, query: AppointmentQueryDto) {
    const psy = await this.getPsychologist(userId);

    return this.prisma.appointment.findMany({
      where: {
        psychologistId: psy.id,
        ...(query.from && { scheduledAt: { gte: new Date(query.from) } }),
        ...(query.to && { scheduledAt: { lte: new Date(query.to) } }),
        ...(query.from && query.to && {
          scheduledAt: { gte: new Date(query.from), lte: new Date(query.to) },
        }),
      },
      orderBy: { scheduledAt: 'asc' },
      ...(query.limit && { take: query.limit }),
      include: {
        patient: { select: { name: true, email: true } },
        consultationType: { select: { id: true, name: true, color: true } },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.appointment.findFirst({
      where: { id, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('RDV introuvable');

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.duration !== undefined && { duration: dto.duration }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async cancel(userId: string, id: string): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.appointment.findFirst({
      where: { id, psychologistId: psy.id },
    });
    if (!existing) throw new NotFoundException('RDV introuvable');

    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Notify psy about waitlist candidates when a slot is freed
    void this.waitlistService.onAppointmentCancelled(psy.id, existing.scheduledAt);

    // In-app notification
    const cancelledPatient = await this.prisma.patient.findUnique({
      where: { id: existing.patientId },
      select: { name: true },
    });
    void this.notifications.createAndDispatch(
      userId,
      'appointment_update',
      'RDV annulé',
      `Le rendez-vous avec ${cancelledPatient?.name ?? 'un patient'} a été annulé`,
      { href: '/dashboard/calendar' },
    );

    return cancelled;
  }

  async getPending(userId: string) {
    const psy = await this.getPsychologist(userId);
    return this.prisma.appointment.findMany({
      where: {
        psychologistId: psy.id,
        status: 'scheduled',
        source: 'public',
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { name: true, email: true, phone: true } },
      },
    });
  }

  async confirmAppointment(userId: string, id: string): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.appointment.findFirst({
      where: { id, psychologistId: psy.id },
      include: { patient: { select: { name: true, email: true } } },
    });
    if (!existing) throw new NotFoundException('RDV introuvable');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'confirmed' },
    });

    if (existing.patient.email) {
      void this.email.sendAppointmentConfirmation(existing.patient.email, {
        patientName: existing.patient.name,
        psychologistName: psy.name,
        scheduledAt: existing.scheduledAt,
        duration: existing.duration,
      });
    }

    return updated;
  }

  async declineAppointment(userId: string, id: string): Promise<Appointment> {
    const psy = await this.getPsychologist(userId);

    const existing = await this.prisma.appointment.findFirst({
      where: { id, psychologistId: psy.id },
      include: { patient: { select: { name: true, email: true } } },
    });
    if (!existing) throw new NotFoundException('RDV introuvable');

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    if (existing.patient.email) {
      void this.email.sendBookingDeclined(existing.patient.email, {
        patientName: existing.patient.name,
        psychologistName: psy.name,
        scheduledAt: existing.scheduledAt,
      });
    }

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Public cancel-by-token
  // ---------------------------------------------------------------------------

  async getCancelInfo(cancelToken: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancelToken },
      include: {
        psychologist: {
          select: {
            id: true,
            name: true,
            cancellationDelay: true,
            autoRefund: true,
          },
        },
        patient: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!appointment) throw new NotFoundException('Rendez-vous introuvable');

    const alreadyCancelled = appointment.status === 'cancelled';
    const hoursUntil =
      (appointment.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const withinDelay = hoursUntil >= appointment.psychologist.cancellationDelay;
    const canAutoRefund =
      withinDelay &&
      appointment.psychologist.autoRefund &&
      appointment.bookingPaymentStatus === 'paid' &&
      !!appointment.paymentIntentId;

    return {
      appointmentId: appointment.id,
      scheduledAt: appointment.scheduledAt,
      duration: appointment.duration,
      psychologistName: appointment.psychologist.name,
      patientName: appointment.patient.name,
      alreadyCancelled,
      withinDelay,
      canAutoRefund,
      hoursUntil: Math.round(hoursUntil * 10) / 10,
      cancellationDelay: appointment.psychologist.cancellationDelay,
    };
  }

  async cancelByToken(cancelToken: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancelToken },
      include: {
        psychologist: {
          select: {
            id: true,
            name: true,
            cancellationDelay: true,
            autoRefund: true,
            user: { select: { id: true, email: true } },
          },
        },
        patient: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!appointment) throw new NotFoundException('Rendez-vous introuvable');

    if (appointment.status === 'cancelled') {
      return { success: true, alreadyCancelled: true, refunded: false, withinDelay: false };
    }

    const hoursUntil =
      (appointment.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const withinDelay = hoursUntil >= appointment.psychologist.cancellationDelay;
    const canAutoRefund =
      withinDelay &&
      appointment.psychologist.autoRefund &&
      appointment.bookingPaymentStatus === 'paid' &&
      !!appointment.paymentIntentId;

    // Cancel the appointment
    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'cancelled' },
    });

    let refunded = false;

    // Auto-refund if eligible
    if (canAutoRefund) {
      try {
        await this.stripeService.createRefund(appointment.paymentIntentId!);

        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { bookingPaymentStatus: 'refunded' },
        });

        // Update related payment records
        await this.prisma.payment.updateMany({
          where: { appointmentId: appointment.id, status: 'paid' },
          data: { status: 'refunded' },
        });

        refunded = true;

        // Send refund confirmation to patient
        if (appointment.patient.email) {
          void this.email.sendRefundConfirmation(appointment.patient.email, {
            patientName: appointment.patient.name,
            psychologistName: appointment.psychologist.name,
            amount: 0, // amount not easily available here, generic confirmation
          });
        }
      } catch (err) {
        this.logger.error(
          `Auto-refund failed for appointment ${appointment.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Audit log
    await this.audit.log({
      actorId: appointment.patient.id,
      actorType: 'patient',
      action: 'UPDATE',
      entityType: 'appointment',
      entityId: appointment.id,
      metadata: {
        action: 'cancel_by_token',
        refunded,
        withinDelay,
      },
    });

    // Notify psychologist (email)
    void this.email.sendCancellationNotification(appointment.psychologist.user.email, {
      psychologistName: appointment.psychologist.name,
      patientName: appointment.patient.name,
      scheduledAt: appointment.scheduledAt,
      refunded,
    });

    // Notify psychologist (in-app)
    void this.notifications.createAndDispatch(
      appointment.psychologist.user.id,
      'appointment_update',
      'RDV annulé par le patient',
      `${appointment.patient.name} a annulé son RDV du ${appointment.scheduledAt.toLocaleDateString('fr-FR')}${refunded ? ' (remboursé)' : ''}`,
      { href: '/dashboard/calendar' },
    );

    // Notify waitlist candidates
    void this.waitlistService.onAppointmentCancelled(
      appointment.psychologist.id,
      appointment.scheduledAt,
    );

    return { success: true, refunded, withinDelay };
  }

  // ---------------------------------------------------------------------------
  // Send payment link (post-session or manual trigger)
  // ---------------------------------------------------------------------------

  async sendPaymentLink(userId: string, appointmentId: string, dto: SendPaymentLinkDto) {
    const psy = await this.getPsychologist(userId);

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, psychologistId: psy.id },
      include: { patient: { select: { name: true, email: true } } },
    });
    if (!appointment) throw new NotFoundException('RDV introuvable');

    if (!appointment.patient.email) {
      throw new BadRequestException('Le patient n\'a pas d\'email');
    }
    if (!psy.stripeAccountId || !psy.stripeOnboardingComplete) {
      throw new BadRequestException('Stripe Connect non configuré');
    }
    if (appointment.bookingPaymentStatus === 'paid') {
      throw new BadRequestException('Ce RDV est déjà payé');
    }
    if (appointment.bookingPaymentStatus === 'pending_payment') {
      throw new BadRequestException('Un lien de paiement est déjà en attente');
    }

    // Determine amount: override from DTO > stored paymentAmount > default rate
    const amount = dto.amount
      ?? (appointment.paymentAmount ? Number(appointment.paymentAmount) : null)
      ?? (psy.defaultSessionRate ? Number(psy.defaultSessionRate) : null);

    if (!amount || amount <= 0) {
      throw new BadRequestException('Montant manquant — précisez un montant');
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
    const amountCents = Math.round(amount * 100);

    const checkoutSession = await this.stripeService.createBookingCheckoutSession({
      psyStripeAccountId: psy.stripeAccountId!,
      amount: amountCents,
      patientEmail: appointment.patient.email,
      psyName: psy.name,
      appointmentId: appointment.id,
      motif: 'Consultation',
      successUrl: `${frontendUrl}/appointments/payment-success?appointment=${appointment.id}`,
      cancelUrl: `${frontendUrl}/appointments/payment-cancel?appointment=${appointment.id}`,
      expiresInSeconds: 24 * 60 * 60, // 24h
    });

    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        bookingPaymentStatus: 'pending_payment',
        paymentIntentId: (checkoutSession.payment_intent as string) ?? null,
        paymentAmount: amount,
      },
    });

    void this.email.sendPrepaymentLink(appointment.patient.email, {
      patientName: appointment.patient.name,
      psychologistName: psy.name,
      scheduledAt: appointment.scheduledAt,
      duration: appointment.duration,
      amount,
      checkoutUrl: checkoutSession.url!,
    });

    return { success: true, checkoutUrl: checkoutSession.url };
  }

  // ---------------------------------------------------------------------------
  // Group appointment (multi-participant video)
  // ---------------------------------------------------------------------------

  async createGroup(userId: string, dto: CreateGroupAppointmentDto) {
    const psy = await this.getPsychologist(userId);

    // Validate: no duplicate patient IDs
    const allPatientIds = [dto.patientId, ...dto.participantIds];
    const uniqueIds = new Set(allPatientIds);
    if (uniqueIds.size !== allPatientIds.length) {
      throw new BadRequestException('Le patient principal ne peut pas figurer parmi les participants, et il ne doit pas y avoir de doublons');
    }

    // Validate: all patients belong to this psychologist
    const patients = await this.prisma.patient.findMany({
      where: { id: { in: allPatientIds }, psychologistId: psy.id },
      select: { id: true, name: true, email: true },
    });

    if (patients.length !== allPatientIds.length) {
      const foundIds = new Set(patients.map((p) => p.id));
      const missing = allPatientIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Patient(s) introuvable(s) ou non autorisé(s) : ${missing.join(', ')}`);
    }

    // Create appointment (always online for group)
    const appointment = await this.prisma.appointment.create({
      data: {
        psychologistId: psy.id,
        patientId: dto.patientId,
        scheduledAt: new Date(dto.scheduledAt),
        duration: dto.duration,
        status: 'scheduled',
        isOnline: true,
        videoJoinToken: randomUUID(),
        source: 'internal',
        ...(dto.consultationTypeId && { consultationTypeId: dto.consultationTypeId }),
      },
    });

    // Create participant rows with individual video join tokens
    const participantData = dto.participantIds.map((patientId) => ({
      appointmentId: appointment.id,
      patientId,
      videoJoinToken: randomUUID(),
    }));

    await this.prisma.appointmentParticipant.createMany({
      data: participantData,
    });

    // Fetch created participants for response
    const participants = await this.prisma.appointmentParticipant.findMany({
      where: { appointmentId: appointment.id },
      include: { patient: { select: { id: true, name: true, email: true } } },
    });

    // Identify participants without email (for warning)
    const participantsWithoutEmail = patients
      .filter((p) => dto.participantIds.includes(p.id) && !p.email)
      .map((p) => ({ id: p.id, name: p.name }));

    // Audit log
    await this.audit.log({
      actorId: userId,
      actorType: 'psychologist',
      action: 'CREATE',
      entityType: 'appointment',
      entityId: appointment.id,
      metadata: {
        isGroup: true,
        primaryPatientId: dto.patientId,
        participantIds: dto.participantIds,
      },
    });

    return {
      appointment,
      participants,
      participantsWithoutEmail,
    };
  }

  private async getPsychologist(userId: string) {
    const psy = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');
    return psy;
  }
}

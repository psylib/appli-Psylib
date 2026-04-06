import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { CacheService } from '../common/cache.service';
import { AvailabilityService } from '../availability/availability.service';
import { EmailService } from '../notifications/email.service';
import { StripeService } from '../billing/stripe.service';
import { PublicBookingDto } from './dto/public-booking.dto';
import { randomUUID } from 'crypto';

const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'https://psylib.eu';
const TTL_PROFILE = 300; // 5 min
const TTL_SLOTS = 120;   // 2 min

@Injectable()
export class PublicBookingService {
  private readonly logger = new Logger(PublicBookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly availabilityService: AvailabilityService,
    private readonly email: EmailService,
    private readonly stripeService: StripeService,
  ) {}

  async getPublicProfile(slug: string) {
    const cacheKey = `profile:${slug}`;
    const cached = await this.cache.get<object>(cacheKey);
    if (cached) return cached;

    const psy = await this.prisma.psychologist.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        specialization: true,
        bio: true,
        phone: true,
        address: true,
        adeliNumber: true,
        defaultSessionDuration: true,
        defaultSessionRate: true,
        allowOnlinePayment: true,
        stripeOnboardingComplete: true,
        networkProfile: {
          select: {
            city: true,
            department: true,
            approaches: true,
            specialties: true,
            languages: true,
            isVisible: true,
            avatarUrl: true,
            websiteUrl: true,
            acceptsMonSoutienPsy: true,
            offersVisio: true,
          },
        },
        user: {
          select: { avatarUrl: true },
        },
        consultationTypes: {
          where: { isActive: true, isPublic: true },
          select: {
            id: true,
            name: true,
            duration: true,
            rate: true,
            color: true,
            category: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const acceptsOnlinePayment = psy.allowOnlinePayment && psy.stripeOnboardingComplete;

    const profile = {
      id: psy.id,
      name: psy.name,
      slug: psy.slug,
      specialization: psy.specialization,
      bio: psy.bio,
      phone: psy.phone,
      address: psy.address,
      adeliNumber: psy.adeliNumber,
      defaultSessionDuration: psy.defaultSessionDuration,
      defaultSessionRate: psy.defaultSessionRate ? Number(psy.defaultSessionRate) : null,
      avatarUrl: psy.networkProfile?.avatarUrl ?? psy.user.avatarUrl,
      city: psy.networkProfile?.city,
      department: psy.networkProfile?.department,
      approaches: psy.networkProfile?.approaches ?? [],
      specialties: psy.networkProfile?.specialties ?? [],
      languages: psy.networkProfile?.languages ?? ['fr'],
      websiteUrl: psy.networkProfile?.websiteUrl,
      acceptsMonSoutienPsy: psy.networkProfile?.acceptsMonSoutienPsy ?? false,
      offersVisio: psy.networkProfile?.offersVisio ?? false,
      acceptsOnlinePayment,
      consultationTypes: psy.consultationTypes.map((ct) => ({
        id: ct.id,
        name: ct.name,
        duration: ct.duration,
        rate: Number(ct.rate),
        color: ct.color,
        category: ct.category,
      })),
    };

    void this.cache.set(cacheKey, profile, TTL_PROFILE);
    return profile;
  }

  async getAvailableSlots(slug: string, from: string, to: string, consultationTypeId?: string) {
    const cacheKey = `slots:${slug}:${from}:${to}:${consultationTypeId ?? 'default'}`;
    const cached = await this.cache.get<{ slots: string[] }>(cacheKey);
    if (cached) return cached;

    const psy = await this.prisma.psychologist.findUnique({
      where: { slug },
      select: { id: true, defaultSessionDuration: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    // Résoudre la durée depuis le type de consultation si fourni
    let duration = psy.defaultSessionDuration;
    if (consultationTypeId) {
      const ct = await this.prisma.consultationType.findFirst({
        where: {
          id: consultationTypeId,
          psychologistId: psy.id,
          isActive: true,
          isPublic: true,
        },
        select: { duration: true },
      });
      if (ct) duration = ct.duration;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Cap à 30 jours max
    const maxTo = new Date(fromDate);
    maxTo.setDate(maxTo.getDate() + 30);
    const effectiveTo = toDate > maxTo ? maxTo : toDate;

    const slots = await this.availabilityService.getAvailableTimeslots(
      psy.id,
      fromDate,
      effectiveTo,
      duration,
    );

    const result = { slots: slots.map((s) => s.toISOString()) };
    void this.cache.set(cacheKey, result, TTL_SLOTS);
    return result;
  }

  async getPublicConsultationTypes(slug: string) {
    const cacheKey = `consultation-types:${slug}`;
    const cached = await this.cache.get<unknown>(cacheKey);
    if (cached) return cached;

    const psy = await this.prisma.psychologist.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const types = await this.prisma.consultationType.findMany({
      where: {
        psychologistId: psy.id,
        isActive: true,
        isPublic: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        duration: true,
        rate: true,
        color: true,
        category: true,
      },
    });

    const result = types.map((t) => ({
      id: t.id,
      name: t.name,
      duration: t.duration,
      rate: Number(t.rate),
      color: t.color,
      category: t.category,
    }));

    void this.cache.set(cacheKey, result, TTL_PROFILE);
    return result;
  }

  async matchPsychologists(params: {
    problematics?: string;
    approaches?: string[];
    city?: string;
    department?: string;
    monPsy?: boolean;
    visio?: boolean;
  }) {
    const { approaches, city, department, monPsy, visio } = params;

    const networkWhere: {
      isVisible: boolean;
      psychologist: { isOnboarded: boolean };
      city?: { contains: string; mode: 'insensitive' };
      department?: string;
      acceptsMonSoutienPsy?: boolean;
      offersVisio?: boolean;
    } = {
      isVisible: true,
      psychologist: { isOnboarded: true },
    };

    if (city) networkWhere.city = { contains: city, mode: 'insensitive' };
    if (department) networkWhere.department = department;
    if (monPsy) networkWhere.acceptsMonSoutienPsy = true;
    if (visio) networkWhere.offersVisio = true;

    const profiles = await this.prisma.psyNetworkProfile.findMany({
      where: networkWhere,
      select: {
        id: true,
        city: true,
        department: true,
        approaches: true,
        specialties: true,
        languages: true,
        acceptsReferrals: true,
        acceptsMonSoutienPsy: true,
        offersVisio: true,
        bio: true,
        psychologist: {
          select: { id: true, name: true, slug: true, specialization: true },
        },
      },
      take: 50,
    });

    // Calcul du score de compatibilité
    const activeApproaches = (approaches ?? []).filter((a) => a !== 'Pas de préférence');

    const results = profiles.map((profile) => {
      let matchScore = 0.7; // score par défaut (pas de préférence)

      if (activeApproaches.length > 0) {
        if (profile.approaches.length === 0) {
          matchScore = 0.5; // psy sans approche renseignée
        } else {
          const profileLower = profile.approaches.map((a) => a.toLowerCase());
          const matches = activeApproaches.filter((req) =>
            profileLower.some(
              (a) => a.includes(req.toLowerCase()) || req.toLowerCase().includes(a),
            ),
          );
          matchScore = matches.length > 0
            ? 0.5 + (matches.length / activeApproaches.length) * 0.5
            : 0.3;
        }
      }

      return {
        id: profile.id,
        city: profile.city ?? undefined,
        department: profile.department ?? undefined,
        approaches: profile.approaches,
        specialties: profile.specialties,
        languages: profile.languages,
        acceptsReferrals: profile.acceptsReferrals,
        acceptsMonSoutienPsy: profile.acceptsMonSoutienPsy,
        offersVisio: profile.offersVisio,
        bio: profile.bio ?? undefined,
        matchScore,
        psychologist: {
          id: profile.psychologist.id,
          name: profile.psychologist.name,
          slug: profile.psychologist.slug,
          specialization: profile.psychologist.specialization ?? undefined,
        },
      };
    });

    return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
  }

  async getPublicSlugs(limit = 500): Promise<Array<{ slug: string; createdAt: Date }>> {
    const psychologists = await this.prisma.psychologist.findMany({
      where: { isOnboarded: true },
      select: { slug: true, createdAt: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return psychologists;
  }

  async bookAppointment(slug: string, dto: PublicBookingDto) {
    const psy = await this.prisma.psychologist.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        defaultSessionDuration: true,
        defaultSessionRate: true,
        allowOnlinePayment: true,
        stripeOnboardingComplete: true,
        stripeAccountId: true,
        user: { select: { email: true } },
      },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const scheduledAt = new Date(dto.scheduledAt);

    // Determine duration and rate from consultation type if provided
    let duration = psy.defaultSessionDuration;
    let rate = psy.defaultSessionRate ? Number(psy.defaultSessionRate) : null;

    if (dto.consultationTypeId) {
      const consultationType = await this.prisma.consultationType.findFirst({
        where: {
          id: dto.consultationTypeId,
          psychologistId: psy.id,
          isActive: true,
        },
      });
      if (consultationType) {
        duration = consultationType.duration;
        rate = Number(consultationType.rate);
      }
    }

    // Vérifie que le créneau est toujours libre
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        psychologistId: psy.id,
        status: { not: 'cancelled' },
        bookingPaymentStatus: { not: 'payment_failed' },
        scheduledAt: {
          gte: scheduledAt,
          lt: new Date(scheduledAt.getTime() + duration * 60000),
        },
      },
    });
    if (conflict) throw new BadRequestException('Ce créneau est déjà pris');

    // Check if psy can accept online payment
    const psyAcceptsPayment =
      psy.allowOnlinePayment &&
      psy.stripeOnboardingComplete &&
      !!psy.stripeAccountId;
    const wantsOnlinePayment = dto.payOnline === true && psyAcceptsPayment;

    // Trouve ou crée le patient
    let patient = await this.prisma.patient.findFirst({
      where: { email: dto.patientEmail, psychologistId: psy.id },
    });

    if (!patient) {
      patient = await this.prisma.patient.create({
        data: {
          psychologistId: psy.id,
          name: dto.patientName,
          email: dto.patientEmail,
          phone: dto.patientPhone,
          source: 'public',
          status: 'active',
        },
      });
    }

    const cancelToken = randomUUID();

    const appointment = await this.prisma.appointment.create({
      data: {
        psychologistId: psy.id,
        patientId: patient.id,
        scheduledAt,
        duration,
        status: 'scheduled',
        source: 'public',
        reason: dto.reason,
        cancelToken,
        consultationTypeId: dto.consultationTypeId ?? null,
        bookingPaymentStatus: wantsOnlinePayment ? 'pending_payment' : 'none',
      },
    });

    // Invalide le cache des créneaux du psy (le slot vient d'être pris)
    void this.cache.delByPattern(`slots:${slug}:*`);

    // --- Online payment flow ---
    if (wantsOnlinePayment && rate && rate > 0) {
      const amountCents = Math.round(rate * 100);
      const motif = dto.reason ?? 'Consultation';

      try {
        const checkoutSession = await this.stripeService.createBookingCheckoutSession({
          psyStripeAccountId: psy.stripeAccountId!,
          amount: amountCents,
          patientEmail: dto.patientEmail,
          psyName: psy.name,
          appointmentId: appointment.id,
          motif,
          successUrl: `${FRONTEND_URL}/psy/${slug}/booking/success?appointment=${appointment.id}`,
          cancelUrl: `${FRONTEND_URL}/psy/${slug}/booking/cancel?appointment=${appointment.id}`,
        });

        // Store the payment intent on the appointment
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { paymentIntentId: (checkoutSession.payment_intent as string) ?? null },
        });

        // Send email to psy about pending payment booking
        void this.email.sendBookingRequestToPsy(psy.user.email, {
          patientName: dto.patientName,
          patientEmail: dto.patientEmail,
          patientPhone: dto.patientPhone,
          psychologistName: psy.name,
          scheduledAt,
          duration,
          reason: dto.reason,
          dashboardUrl: `${FRONTEND_URL}/dashboard/calendar`,
        });

        return {
          success: true,
          appointmentId: appointment.id,
          checkoutUrl: checkoutSession.url,
          requiresPayment: true,
        };
      } catch (err) {
        // If Stripe checkout creation fails, fall back to normal booking
        this.logger.warn(
          `Failed to create booking checkout for appointment ${appointment.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
        await this.prisma.appointment.update({
          where: { id: appointment.id },
          data: { bookingPaymentStatus: 'none' },
        });
      }
    }

    // --- Normal flow (no online payment) ---
    void this.email.sendBookingRequestToPsy(psy.user.email, {
      patientName: dto.patientName,
      patientEmail: dto.patientEmail,
      patientPhone: dto.patientPhone,
      psychologistName: psy.name,
      scheduledAt,
      duration,
      reason: dto.reason,
      dashboardUrl: `${FRONTEND_URL}/dashboard/calendar`,
    });

    void this.email.sendBookingReceivedToPatient(dto.patientEmail, {
      patientName: dto.patientName,
      psychologistName: psy.name,
      scheduledAt,
      duration,
      cancelUrl: `${FRONTEND_URL}/appointments/cancel/${cancelToken}`,
    });

    return { success: true, appointmentId: appointment.id };
  }

  // ---------------------------------------------------------------------------
  // Ghost appointment cleanup — runs every 5 minutes
  // ---------------------------------------------------------------------------

  @Cron('0 */5 * * * *')
  async cleanupExpiredPayments(): Promise<void> {
    const threshold = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago

    const expired = await this.prisma.appointment.findMany({
      where: {
        bookingPaymentStatus: 'pending_payment',
        createdAt: { lt: threshold },
      },
      select: { id: true },
    });

    if (expired.length === 0) return;

    await this.prisma.appointment.updateMany({
      where: { id: { in: expired.map((a) => a.id) } },
      data: {
        status: 'cancelled',
        bookingPaymentStatus: 'payment_failed',
      },
    });

    this.logger.log(`Cleaned up ${expired.length} expired booking payment appointment(s)`);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CacheService } from '../common/cache.service';
import { AvailabilityService } from '../availability/availability.service';
import { EmailService } from '../notifications/email.service';
import { PublicBookingDto } from './dto/public-booking.dto';
import { randomUUID } from 'crypto';

const FRONTEND_URL = process.env['FRONTEND_URL'] ?? 'https://psylib.eu';
const TTL_PROFILE = 300; // 5 min
const TTL_SLOTS = 120;   // 2 min

@Injectable()
export class PublicBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly availabilityService: AvailabilityService,
    private readonly email: EmailService,
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
            acceptsMonPsy: true,
            offersVisio: true,
          },
        },
        user: {
          select: { avatarUrl: true },
        },
      },
    });

    if (!psy) throw new NotFoundException('Psychologue introuvable');

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
      acceptsMonPsy: psy.networkProfile?.acceptsMonPsy ?? false,
      offersVisio: psy.networkProfile?.offersVisio ?? false,
    };

    void this.cache.set(cacheKey, profile, TTL_PROFILE);
    return profile;
  }

  async getAvailableSlots(slug: string, from: string, to: string) {
    const cacheKey = `slots:${slug}:${from}:${to}`;
    const cached = await this.cache.get<{ slots: string[] }>(cacheKey);
    if (cached) return cached;

    const psy = await this.prisma.psychologist.findUnique({
      where: { slug },
      select: { id: true, defaultSessionDuration: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

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
      psy.defaultSessionDuration,
    );

    const result = { slots: slots.map((s) => s.toISOString()) };
    void this.cache.set(cacheKey, result, TTL_SLOTS);
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
      acceptsMonPsy?: boolean;
      offersVisio?: boolean;
    } = {
      isVisible: true,
      psychologist: { isOnboarded: true },
    };

    if (city) networkWhere.city = { contains: city, mode: 'insensitive' };
    if (department) networkWhere.department = department;
    if (monPsy) networkWhere.acceptsMonPsy = true;
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
        acceptsMonPsy: true,
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
        acceptsMonPsy: profile.acceptsMonPsy,
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
        user: { select: { email: true } },
      },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    const scheduledAt = new Date(dto.scheduledAt);

    // Vérifie que le créneau est toujours libre
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        psychologistId: psy.id,
        status: { not: 'cancelled' },
        scheduledAt: {
          gte: scheduledAt,
          lt: new Date(scheduledAt.getTime() + psy.defaultSessionDuration * 60000),
        },
      },
    });
    if (conflict) throw new BadRequestException('Ce créneau est déjà pris');

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
        duration: psy.defaultSessionDuration,
        status: 'scheduled',
        source: 'public',
        reason: dto.reason,
        cancelToken,
      },
    });

    // Invalide le cache des créneaux du psy (le slot vient d'être pris)
    void this.cache.delByPattern(`slots:${slug}:*`);

    // Emails non-bloquants
    void this.email.sendBookingRequestToPsy(psy.user.email, {
      patientName: dto.patientName,
      patientEmail: dto.patientEmail,
      patientPhone: dto.patientPhone,
      psychologistName: psy.name,
      scheduledAt,
      duration: psy.defaultSessionDuration,
      reason: dto.reason,
      dashboardUrl: `${FRONTEND_URL}/dashboard/calendar`,
    });

    void this.email.sendBookingReceivedToPatient(dto.patientEmail, {
      patientName: dto.patientName,
      psychologistName: psy.name,
      scheduledAt,
      duration: psy.defaultSessionDuration,
    });

    return { success: true, appointmentId: appointment.id };
  }
}

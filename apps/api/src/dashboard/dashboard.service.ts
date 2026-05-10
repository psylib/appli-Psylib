import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TtlCache } from '../common/ttl-cache';

export interface ActivationStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href: string;
}

export interface ActivationChecklist {
  steps: ActivationStep[];
  completedCount: number;
  totalCount: number;
  allDone: boolean;
}

export interface DashboardKpis {
  patients: {
    total: number;
    active: number;
    newThisMonth: number;
    trend: number; // % vs mois précédent
  };
  sessions: {
    totalThisMonth: number;
    totalLastMonth: number;
    trend: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
  appointments: {
    upcoming: number;
    today: number;
  };
  subscription: {
    plan: string;
    status: string;
    trialEndsAt: string | null;
    trialDaysLeft: number | null;
  } | null;
}

@Injectable()
export class DashboardService {
  private readonly kpisCache = new TtlCache<DashboardKpis>(5 * 60 * 1000); // 5 min

  constructor(private readonly prisma: PrismaService) {}

  async getKpis(psychologistUserId: string): Promise<DashboardKpis> {
    const cached = this.kpisCache.get(psychologistUserId);
    if (cached) return cached;
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: psychologistUserId },
      include: { subscription: true },
    });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');

    // Use Europe/Paris timezone for date boundaries (HDS compliance — French psys)
    const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const now = new Date();
    const todayStart = new Date(parisNow.getFullYear(), parisNow.getMonth(), parisNow.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const firstOfMonth = new Date(parisNow.getFullYear(), parisNow.getMonth(), 1);
    const firstOfLastMonth = new Date(parisNow.getFullYear(), parisNow.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(parisNow.getFullYear(), parisNow.getMonth(), 0);

    const [
      totalPatients,
      activePatients,
      newPatientsThisMonth,
      newPatientsLastMonth,
      sessionsThisMonthCount,
      sessionsLastMonthCount,
      revenueThisMonthAgg,
      revenueLastMonthAgg,
      upcomingAppointments,
      todayAppointments,
    ] = await Promise.all([
      this.prisma.patient.count({ where: { psychologistId: psy.id } }),
      this.prisma.patient.count({ where: { psychologistId: psy.id, status: 'active' } }),
      this.prisma.patient.count({
        where: { psychologistId: psy.id, createdAt: { gte: firstOfMonth } },
      }),
      this.prisma.patient.count({
        where: {
          psychologistId: psy.id,
          createdAt: { gte: firstOfLastMonth, lte: lastOfLastMonth },
        },
      }),
      // Count ALL sessions (not just paid) for the sessions KPI
      this.prisma.session.count({
        where: { psychologistId: psy.id, date: { gte: firstOfMonth } },
      }),
      this.prisma.session.count({
        where: {
          psychologistId: psy.id,
          date: { gte: firstOfLastMonth, lte: lastOfLastMonth },
        },
      }),
      // Revenue: only paid sessions
      this.prisma.session.aggregate({
        where: { psychologistId: psy.id, date: { gte: firstOfMonth }, paymentStatus: 'paid' },
        _sum: { rate: true },
      }),
      this.prisma.session.aggregate({
        where: {
          psychologistId: psy.id,
          date: { gte: firstOfLastMonth, lte: lastOfLastMonth },
          paymentStatus: 'paid',
        },
        _sum: { rate: true },
      }),
      this.prisma.appointment.count({
        where: {
          psychologistId: psy.id,
          scheduledAt: { gte: now },
          status: { in: ['scheduled', 'confirmed'] },
        },
      }),
      this.prisma.appointment.count({
        where: {
          psychologistId: psy.id,
          scheduledAt: { gte: todayStart, lt: todayEnd },
          status: { in: ['scheduled', 'confirmed'] },
        },
      }),
    ]);

    const revenueThisMonth = Number(revenueThisMonthAgg._sum.rate) || 0;
    const revenueLastMonth = Number(revenueLastMonthAgg._sum.rate) || 0;

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const result: DashboardKpis = {
      patients: {
        total: totalPatients,
        active: activePatients,
        newThisMonth: newPatientsThisMonth,
        trend: calcTrend(newPatientsThisMonth, newPatientsLastMonth),
      },
      sessions: {
        totalThisMonth: sessionsThisMonthCount,
        totalLastMonth: sessionsLastMonthCount,
        trend: calcTrend(sessionsThisMonthCount, sessionsLastMonthCount),
      },
      revenue: {
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        trend: calcTrend(revenueThisMonth, revenueLastMonth),
      },
      appointments: {
        upcoming: upcomingAppointments,
        today: todayAppointments,
      },
      subscription: psy.subscription
        ? {
            plan: psy.subscription.plan,
            status: psy.subscription.status,
            trialEndsAt: psy.subscription.trialEndsAt?.toISOString() ?? null,
            trialDaysLeft:
              psy.subscription.trialEndsAt
                ? Math.max(
                    0,
                    Math.ceil(
                      (psy.subscription.trialEndsAt.getTime() - Date.now()) /
                        86400000,
                    ),
                  )
                : null,
          }
        : null,
    };

    this.kpisCache.set(psychologistUserId, result);
    return result;
  }

  async getActivationChecklist(psychologistUserId: string): Promise<ActivationChecklist> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: psychologistUserId },
      include: { subscription: true, availability: { take: 1 } },
    });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');

    const [patientCount, sessionCount] = await Promise.all([
      this.prisma.patient.count({ where: { psychologistId: psy.id } }),
      this.prisma.session.count({ where: { psychologistId: psy.id } }),
    ]);

    const profileComplete =
      !!psy.name && !!psy.adeliNumber && !!psy.bio && !!psy.specialization;
    const availabilitySet = psy.availability.length > 0;
    const hasPatient = patientCount > 0;
    const hasSession = sessionCount > 0;
    const billingActive =
      !!psy.subscription &&
      ['active', 'trialing'].includes(psy.subscription.status);

    const steps: ActivationStep[] = [
      {
        id: 'profile',
        label: 'Compléter votre profil',
        description: 'Nom, numéro ADELI, spécialité et bio',
        completed: profileComplete,
        href: '/dashboard/settings/profile',
      },
      {
        id: 'availability',
        label: 'Configurer vos disponibilités',
        description: 'Définir vos créneaux de consultation',
        completed: availabilitySet,
        href: '/dashboard/settings/profile',
      },
      {
        id: 'first_patient',
        label: 'Ajouter votre premier patient',
        description: 'Créer la fiche du premier patient',
        completed: hasPatient,
        href: '/dashboard/patients/new',
      },
      {
        id: 'first_session',
        label: 'Enregistrer une séance',
        description: 'Créer votre première note de séance',
        completed: hasSession,
        href: '/dashboard/sessions/new',
      },
      {
        id: 'billing',
        label: 'Activer votre abonnement',
        description: 'Passer au plan Solo ou Pro',
        completed: billingActive,
        href: '/dashboard/settings/billing',
      },
    ];

    const completedCount = steps.filter((s) => s.completed).length;

    return {
      steps,
      completedCount,
      totalCount: steps.length,
      allDone: completedCount === steps.length,
    };
  }
}

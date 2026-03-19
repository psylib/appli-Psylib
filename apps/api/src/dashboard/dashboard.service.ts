import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  async getKpis(psychologistUserId: string): Promise<DashboardKpis> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId: psychologistUserId },
      include: { subscription: true },
    });
    if (!psy) throw new ForbiddenException('Profil psychologue introuvable');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalPatients,
      activePatients,
      newPatientsThisMonth,
      newPatientsLastMonth,
      sessionsThisMonth,
      sessionsLastMonth,
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
      this.prisma.session.findMany({
        where: { psychologistId: psy.id, date: { gte: firstOfMonth } },
        select: { rate: true, paymentStatus: true },
      }),
      this.prisma.session.findMany({
        where: {
          psychologistId: psy.id,
          date: { gte: firstOfLastMonth, lte: lastOfLastMonth },
        },
        select: { rate: true, paymentStatus: true },
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

    const revenueThisMonth = sessionsThisMonth
      .filter((s) => s.paymentStatus === 'paid')
      .reduce((acc, s) => acc + (Number(s.rate) || 0), 0);

    const revenueLastMonth = sessionsLastMonth
      .filter((s) => s.paymentStatus === 'paid')
      .reduce((acc, s) => acc + (Number(s.rate) || 0), 0);

    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      patients: {
        total: totalPatients,
        active: activePatients,
        newThisMonth: newPatientsThisMonth,
        trend: calcTrend(newPatientsThisMonth, newPatientsLastMonth),
      },
      sessions: {
        totalThisMonth: sessionsThisMonth.length,
        totalLastMonth: sessionsLastMonth.length,
        trend: calcTrend(sessionsThisMonth.length, sessionsLastMonth.length),
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
        description: 'Passer au plan Starter ou Pro',
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

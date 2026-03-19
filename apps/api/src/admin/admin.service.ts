import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunnelStep {
  step: 'signups' | 'onboarded' | 'first_patient' | 'first_session' | 'converted';
  label: string;
  count: number;
  rate: number;        // % du step précédent (0-100)
  rateFromTop: number; // % des inscriptions (0-100)
}

interface CohortWeek {
  week: string;        // ex: '2026-W11'
  signups: number;
  onboarded: number;
  firstPatient: number;
  firstSession: number;
  converted: number;
}

interface FunnelSummary {
  totalPsys: number;
  trialToPaidRate: number;
  mrr: number;
  avgPatientsByActivePsy: number;
}

export interface FunnelMetrics {
  funnel: FunnelStep[];
  cohorts: CohortWeek[];
  summary: FunnelSummary;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAN_PRICES: Record<string, number> = {
  starter: 49,
  pro: 97,
  clinic: 197,
};

/**
 * Converts a Date to ISO week string: 'YYYY-WXX'
 * Algorithm follows ISO 8601 (week 1 = week containing the first Thursday).
 */
function toISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 10000) / 100;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getFunnelMetrics(): Promise<FunnelMetrics> {
    // ------------------------------------------------------------------
    // 1. Funnel global — parallel queries, no N+1
    // ------------------------------------------------------------------
    const [
      totalPsys,
      onboarded,
      withPatient,
      withSession,
      converted,
      allSubs,
      activeSubs,
    ] = await Promise.all([
      this.prisma.psychologist.count(),

      this.prisma.psychologist.count({
        where: { isOnboarded: true },
      }),

      this.prisma.psychologist.count({
        where: { patients: { some: {} } },
      }),

      this.prisma.psychologist.count({
        where: { sessions: { some: {} } },
      }),

      this.prisma.psychologist.count({
        where: { subscription: { status: 'active' } },
      }),

      // Pour le calcul trial→paid
      this.prisma.subscription.findMany({
        select: { status: true, plan: true },
      }),

      // Pour le MRR
      this.prisma.subscription.findMany({
        where: { status: 'active' },
        select: { plan: true },
      }),
    ]);

    // Funnel steps
    const steps: FunnelStep[] = [
      {
        step: 'signups',
        label: 'Inscriptions',
        count: totalPsys,
        rate: 100,
        rateFromTop: 100,
      },
      {
        step: 'onboarded',
        label: 'Onboarding complété',
        count: onboarded,
        rate: pct(onboarded, totalPsys),
        rateFromTop: pct(onboarded, totalPsys),
      },
      {
        step: 'first_patient',
        label: 'Premier patient créé',
        count: withPatient,
        rate: pct(withPatient, onboarded),
        rateFromTop: pct(withPatient, totalPsys),
      },
      {
        step: 'first_session',
        label: 'Première séance',
        count: withSession,
        rate: pct(withSession, withPatient),
        rateFromTop: pct(withSession, totalPsys),
      },
      {
        step: 'converted',
        label: 'Payant actif',
        count: converted,
        rate: pct(converted, withSession),
        rateFromTop: pct(converted, totalPsys),
      },
    ];

    // ------------------------------------------------------------------
    // 2. Cohorts — 8 dernières semaines, sans N+1
    // ------------------------------------------------------------------
    const since8w = new Date(Date.now() - 8 * 7 * 24 * 3600 * 1000);

    const recentPsys = await this.prisma.psychologist.findMany({
      where: { user: { createdAt: { gte: since8w } } },
      include: {
        user: { select: { createdAt: true } },
        subscription: { select: { status: true } },
        patients: { take: 1, select: { id: true } },
        sessions: { take: 1, select: { id: true } },
      },
    });

    // Group in memory by ISO week
    const cohortMap = new Map<
      string,
      { signups: number; onboarded: number; firstPatient: number; firstSession: number; converted: number }
    >();

    for (const psy of recentPsys) {
      const week = toISOWeek(psy.user.createdAt);

      if (!cohortMap.has(week)) {
        cohortMap.set(week, {
          signups: 0,
          onboarded: 0,
          firstPatient: 0,
          firstSession: 0,
          converted: 0,
        });
      }

      const entry = cohortMap.get(week);
      if (!entry) continue;

      entry.signups += 1;
      if (psy.isOnboarded) entry.onboarded += 1;
      if (psy.patients.length > 0) entry.firstPatient += 1;
      if (psy.sessions.length > 0) entry.firstSession += 1;
      if (psy.subscription?.status === 'active') entry.converted += 1;
    }

    const cohorts: CohortWeek[] = Array.from(cohortMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // ------------------------------------------------------------------
    // 3. Summary
    // ------------------------------------------------------------------

    // MRR
    const mrr = activeSubs.reduce(
      (sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0),
      0,
    );

    // Trial → paid rate
    const trialCount = allSubs.filter((s) => s.status === 'trialing').length;
    const activeCount = allSubs.filter((s) => s.status === 'active').length;
    const trialToPaidRate = pct(activeCount, trialCount + activeCount);

    // Avg patients by active psy (psys with subscription active)
    const activePsyIds = await this.prisma.subscription.findMany({
      where: { status: 'active' },
      select: { psychologistId: true },
    });

    let avgPatientsByActivePsy = 0;

    if (activePsyIds.length > 0) {
      const ids = activePsyIds.map((s) => s.psychologistId);
      const patientCount = await this.prisma.patient.count({
        where: { psychologistId: { in: ids } },
      });
      avgPatientsByActivePsy =
        Math.round((patientCount / ids.length) * 100) / 100;
    }

    const summary: FunnelSummary = {
      totalPsys,
      trialToPaidRate,
      mrr,
      avgPatientsByActivePsy,
    };

    return { funnel: steps, cohorts, summary };
  }
}

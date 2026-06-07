import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { CacheService } from '../common/cache.service';
import { EmailService } from '../notifications/email.service';

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

export interface PendingVerification {
  id: string;
  name: string;
  email: string;
  adeliNumber: string | null;
  verificationNote: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAN_PRICES: Record<string, number> = {
  solo: 25,
  pro: 40,
  clinic: 79,
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
  private readonly logger = new Logger(AdminService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {
    this.frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'https://psylib.eu';
  }

  // ──────────────────────────────────────────────────────────────────
  // Vérification d'identité des psychologues (anti-usurpation ADELI/RPPS)
  // ──────────────────────────────────────────────────────────────────

  /** Liste les inscriptions en attente de contrôle manuel d'identité. */
  async listPendingVerifications(): Promise<PendingVerification[]> {
    const psys = await this.prisma.psychologist.findMany({
      where: { verificationStatus: 'pending' },
      select: {
        id: true,
        name: true,
        adeliNumber: true,
        verificationNote: true,
        createdAt: true,
        user: { select: { email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return psys.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.user?.email ?? '—',
      adeliNumber: p.adeliNumber,
      verificationNote: p.verificationNote,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /** Valide manuellement un psychologue → profil public activé. */
  async approveVerification(psychologistId: string): Promise<void> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { id: true, slug: true, name: true, user: { select: { email: true } } },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    await this.prisma.psychologist.update({
      where: { id: psychologistId },
      data: {
        verificationStatus: 'verified',
        rppsVerifiedAt: new Date(),
        verificationNote: null,
      },
    });

    // Le profil public était masqué → purge le cache pour qu'il apparaisse.
    void this.cache.del(`profile:${psy.slug}`);
    void this.cache.delByPattern(`slots:${psy.slug}:*`);
    void this.cache.del(`consultation-types:${psy.slug}`);

    this.logger.log(`Vérification approuvée: psychologistId=${psychologistId}`);

    // Notifie le psy que son profil est désormais visible (non bloquant).
    const email = psy.user?.email;
    if (email) {
      this.email
        .sendRawEmail(
          email,
          'Votre compte PsyLib est vérifié ✅',
          `<div style="font-family:Inter,Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
            <h2 style="color:#0D9488;margin:0 0 16px;">Identité vérifiée</h2>
            <p style="font-size:15px;color:#374151;">Bonjour ${psy.name},</p>
            <p style="font-size:15px;color:#374151;">Votre identité de psychologue a été vérifiée. Votre page de réservation publique est désormais active et vos patients peuvent prendre rendez-vous en ligne.</p>
            <a href="${this.frontendUrl}/dashboard" style="display:inline-block;margin-top:8px;background:#3D52A0;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Accéder à mon tableau de bord</a>
          </div>`,
        )
        .catch((err) =>
          this.logger.warn(
            `Email approbation échoué: ${(err as Error).message}`,
          ),
        );
    }
  }

  /** Rejette manuellement un psychologue (usurpation suspectée). */
  async rejectVerification(
    psychologistId: string,
    reason?: string,
  ): Promise<void> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { id: psychologistId },
      select: { id: true, slug: true },
    });
    if (!psy) throw new NotFoundException('Psychologue introuvable');

    await this.prisma.psychologist.update({
      where: { id: psychologistId },
      data: {
        verificationStatus: 'rejected',
        rppsVerifiedAt: null,
        verificationNote: reason?.slice(0, 500) ?? 'Rejeté manuellement',
      },
    });

    void this.cache.del(`profile:${psy.slug}`);
    void this.cache.delByPattern(`slots:${psy.slug}:*`);
    void this.cache.del(`consultation-types:${psy.slug}`);

    this.logger.log(`Vérification rejetée: psychologistId=${psychologistId}`);
  }

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

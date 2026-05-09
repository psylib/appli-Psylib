import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

interface OverviewResult {
  totalPatients: number;
  activePatients: number;
  totalSessions: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  avgSessionsPerPatient: number;
  portalAdoptionRate: number;
}

interface RevenueMonthResult {
  month: string;
  revenue: number;
  sessions: number;
}

interface PatientsMonthResult {
  month: string;
  new: number;
  total: number;
}

interface MoodTrendResult {
  week: string;
  avgMood: number;
  count: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatMonth(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()] ?? '?'} ${date.getFullYear()}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve Keycloak user ID (sub) → Psychologist.id
   */
  private async resolvePsychologistId(userId: string): Promise<string> {
    const psy = await this.prisma.psychologist.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!psy) {
      throw new NotFoundException('Psychologue introuvable');
    }
    return psy.id;
  }

  async getOverview(userId: string): Promise<OverviewResult> {
    const psychologistId = await this.resolvePsychologistId(userId);
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subtractMonths(now, 1));
    const lastMonthEnd = endOfMonth(subtractMonths(now, 1));

    const [
      totalPatients,
      activePatients,
      patientsWithPortal,
      totalSessions,
      sessionsThisMonthRaw,
      revenueThisMonthRaw,
      revenueLastMonthRaw,
    ] = await Promise.all([
      this.prisma.patient.count({
        where: { psychologistId, status: { not: 'archived' } },
      }),
      this.prisma.patient.count({
        where: { psychologistId, status: 'active' },
      }),
      this.prisma.patient.count({
        where: { psychologistId, userId: { not: null } },
      }),
      this.prisma.session.count({
        where: { psychologistId },
      }),
      this.prisma.session.count({
        where: {
          psychologistId,
          date: { gte: thisMonthStart, lte: thisMonthEnd },
        },
      }),
      this.prisma.session.aggregate({
        where: {
          psychologistId,
          date: { gte: thisMonthStart, lte: thisMonthEnd },
          rate: { not: null },
        },
        _sum: { rate: true },
      }),
      this.prisma.session.aggregate({
        where: {
          psychologistId,
          date: { gte: lastMonthStart, lte: lastMonthEnd },
          rate: { not: null },
        },
        _sum: { rate: true },
      }),
    ]);

    const sessionsThisMonth = sessionsThisMonthRaw;
    const revenueThisMonth = Number(revenueThisMonthRaw._sum.rate ?? 0);
    const revenueLastMonth = Number(revenueLastMonthRaw._sum.rate ?? 0);

    const avgSessionsPerPatient =
      totalPatients > 0
        ? Math.round((totalSessions / totalPatients) * 100) / 100
        : 0;

    const portalAdoptionRate =
      totalPatients > 0
        ? Math.round((patientsWithPortal / totalPatients) * 10000) / 100
        : 0;

    return {
      totalPatients,
      activePatients,
      totalSessions,
      sessionsThisMonth,
      revenueThisMonth,
      revenueLastMonth,
      avgSessionsPerPatient,
      portalAdoptionRate,
    };
  }

  async getRevenueByMonth(
    userId: string,
    months: number,
  ): Promise<RevenueMonthResult[]> {
    const psychologistId = await this.resolvePsychologistId(userId);
    const now = new Date();
    const oldestStart = startOfMonth(subtractMonths(now, months - 1));

    // Groupage côté DB via raw SQL — évite de charger toutes les sessions en mémoire
    const rows = await this.prisma.$queryRawUnsafe<Array<{ m: string; revenue: string; sessions: string }>>(
      `SELECT TO_CHAR(date, 'YYYY-MM') AS m,
              COALESCE(SUM(rate), 0) AS revenue,
              COUNT(*)::text AS sessions
       FROM sessions
       WHERE "psychologistId" = $1
         AND date >= $2
         AND date <= $3
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY m`,
      psychologistId,
      oldestStart,
      endOfMonth(now),
    );

    const rowMap = new Map(rows.map((r) => [r.m, r]));
    const results: RevenueMonthResult[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = subtractMonths(now, i);
      const key = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const row = rowMap.get(key);
      results.push({
        month: formatMonth(targetDate),
        revenue: row ? Math.round(Number(row.revenue) * 100) / 100 : 0,
        sessions: row ? Number(row.sessions) : 0,
      });
    }

    return results;
  }

  async getPatientsByMonth(
    userId: string,
    months: number,
  ): Promise<PatientsMonthResult[]> {
    const psychologistId = await this.resolvePsychologistId(userId);
    const now = new Date();
    const oldestStart = startOfMonth(subtractMonths(now, months - 1));
    const rangeEnd = endOfMonth(now);

    // Groupage côté DB — évite de charger tous les patients en mémoire
    const rows = await this.prisma.$queryRawUnsafe<Array<{ m: string; count: string }>>(
      `SELECT TO_CHAR("createdAt", 'YYYY-MM') AS m, COUNT(*)::text AS count
       FROM patients
       WHERE "psychologistId" = $1
         AND "createdAt" >= $2
         AND "createdAt" <= $3
       GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
       ORDER BY m`,
      psychologistId,
      oldestStart,
      rangeEnd,
    );

    // Total cumulé : patients créés AVANT la période
    const priorCount = await this.prisma.patient.count({
      where: { psychologistId, createdAt: { lt: oldestStart } },
    });

    const rowMap = new Map(rows.map((r) => [r.m, Number(r.count)]));
    const results: PatientsMonthResult[] = [];
    let runningTotal = priorCount;

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = subtractMonths(now, i);
      const key = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const newCount = rowMap.get(key) ?? 0;
      runningTotal += newCount;
      results.push({
        month: formatMonth(targetDate),
        new: newCount,
        total: runningTotal,
      });
    }

    return results;
  }

  async getMoodTrends(userId: string): Promise<MoodTrendResult[]> {
    const psychologistId = await this.resolvePsychologistId(userId);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const moodEntries = await this.prisma.moodTracking.findMany({
      where: {
        patient: { psychologistId },
        createdAt: { gte: thirtyDaysAgo, lte: now },
      },
      select: { mood: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    if (moodEntries.length === 0) {
      return [];
    }

    // Group by week — keyed on Monday's date
    const weekMap = new Map<string, { sum: number; count: number; startDate: Date }>();

    for (const entry of moodEntries) {
      const entryDate = new Date(entry.createdAt);
      const dayOfWeek = entryDate.getDay(); // 0=Sun
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(entryDate);
      monday.setDate(monday.getDate() + daysToMonday);
      monday.setHours(0, 0, 0, 0);

      const weekKey = monday.toISOString().slice(0, 10);

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, { sum: 0, count: 0, startDate: new Date(monday) });
      }

      const existing = weekMap.get(weekKey);
      if (existing) {
        existing.sum += entry.mood;
        existing.count += 1;
      }
    }

    const results: MoodTrendResult[] = [];

    for (const [, data] of weekMap) {
      const day = String(data.startDate.getDate()).padStart(2, '0');
      const month = String(data.startDate.getMonth() + 1).padStart(2, '0');
      results.push({
        week: `${day}/${month}`,
        avgMood: Math.round((data.sum / data.count) * 100) / 100,
        count: data.count,
      });
    }

    return results.sort((a, b) => a.week.localeCompare(b.week));
  }
}

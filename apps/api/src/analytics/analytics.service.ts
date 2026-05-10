import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { TtlCache } from '../common/ttl-cache';

export interface OverviewResult {
  totalPatients: number;
  activePatients: number;
  totalSessions: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  avgSessionsPerPatient: number;
  portalAdoptionRate: number;
}

export interface RevenueMonthResult {
  month: string;
  revenue: number;
  sessions: number;
}

export interface PatientsMonthResult {
  month: string;
  new: number;
  total: number;
}

export interface MoodTrendResult {
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
  private readonly overviewCache = new TtlCache<OverviewResult>(15 * 60 * 1000); // 15 min
  private readonly revenueCache = new TtlCache<RevenueMonthResult[]>(15 * 60 * 1000);
  private readonly patientsCache = new TtlCache<PatientsMonthResult[]>(15 * 60 * 1000);

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
    const cached = this.overviewCache.get(userId);
    if (cached) return cached;

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
          paymentStatus: 'paid',
        },
        _sum: { rate: true },
      }),
      this.prisma.session.aggregate({
        where: {
          psychologistId,
          date: { gte: lastMonthStart, lte: lastMonthEnd },
          rate: { not: null },
          paymentStatus: 'paid',
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

    const result: OverviewResult = {
      totalPatients,
      activePatients,
      totalSessions,
      sessionsThisMonth,
      revenueThisMonth,
      revenueLastMonth,
      avgSessionsPerPatient,
      portalAdoptionRate,
    };

    this.overviewCache.set(userId, result);
    return result;
  }

  async getRevenueByMonth(
    userId: string,
    months: number,
  ): Promise<RevenueMonthResult[]> {
    const cacheKey = `${userId}:${months}`;
    const cached = this.revenueCache.get(cacheKey);
    if (cached) return cached;

    const psychologistId = await this.resolvePsychologistId(userId);
    const now = new Date();
    const oldestStart = startOfMonth(subtractMonths(now, months - 1));

    // Groupage côté DB via raw SQL — évite de charger toutes les sessions en mémoire
    const endDate = endOfMonth(now);
    const rows = await this.prisma.$queryRaw<Array<{ m: string; revenue: string; sessions: string }>>`
      SELECT TO_CHAR(date, 'YYYY-MM') AS m,
              COALESCE(SUM(rate), 0) AS revenue,
              COUNT(*)::text AS sessions
       FROM sessions
       WHERE "psychologist_id" = ${psychologistId}
         AND date >= ${oldestStart}
         AND date <= ${endDate}
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY m`;

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

    this.revenueCache.set(cacheKey, results);
    return results;
  }

  async getPatientsByMonth(
    userId: string,
    months: number,
  ): Promise<PatientsMonthResult[]> {
    const cacheKey = `${userId}:${months}`;
    const cached = this.patientsCache.get(cacheKey);
    if (cached) return cached;

    const psychologistId = await this.resolvePsychologistId(userId);
    const now = new Date();
    const oldestStart = startOfMonth(subtractMonths(now, months - 1));
    const rangeEnd = endOfMonth(now);

    // Groupage côté DB — évite de charger tous les patients en mémoire
    const rows = await this.prisma.$queryRaw<Array<{ m: string; count: string }>>`
      SELECT TO_CHAR("created_at", 'YYYY-MM') AS m, COUNT(*)::text AS count
       FROM patients
       WHERE "psychologist_id" = ${psychologistId}
         AND "created_at" >= ${oldestStart}
         AND "created_at" <= ${rangeEnd}
       GROUP BY TO_CHAR("created_at", 'YYYY-MM')
       ORDER BY m`;

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

    this.patientsCache.set(cacheKey, results);
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

    return results.sort((a, b) => {
      const [aD, aM] = a.week.split('/').map(Number);
      const [bD, bM] = b.week.split('/').map(Number);
      return (aM! - bM!) || (aD! - bD!);
    });
  }
}

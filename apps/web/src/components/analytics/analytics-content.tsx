'use client';

import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, TrendingUp, TrendingDown, Users, CalendarCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  analyticsApi,
  type AnalyticsOverview,
  type RevenuePoint,
  type PatientPoint,
  type MoodTrend,
} from '@/lib/api/analytics';

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  title: string;
  value: string;
  trend?: number;
  subtitle?: string;
  icon: ReactNode;
  iconBg: string;
}

function KpiCard({ title, value, trend, subtitle, icon, iconBg }: KpiCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn('p-2 rounded-lg', iconBg)}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <TrendingUp size={13} className="text-emerald-600" />
            ) : (
              <TrendingDown size={13} className="text-red-500" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                isPositive ? 'text-emerald-600' : 'text-red-500',
              )}
            >
              {isPositive ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        )}
        {trend === undefined && subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-3 bg-slate-100 rounded w-28" />
        <div className="h-8 w-8 bg-slate-100 rounded-lg" />
      </div>
      <div className="h-7 bg-slate-100 rounded w-20 mb-2" />
      <div className="h-3 bg-slate-100 rounded w-24" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar Chart SVG — Revenus
// ---------------------------------------------------------------------------

function BarChartSvg({ data }: { data: RevenuePoint[] }) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.revenue), 1);
  const chartWidth = 560;
  const chartHeight = 180;
  const paddingLeft = 52;
  const paddingRight = 16;
  const paddingTop = 28;
  const paddingBottom = 32;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = Math.min(40, (innerWidth / data.length) * 0.6);
  const barGap = innerWidth / data.length;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full"
      aria-label="Graphique des revenus mensuels"
      role="img"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = paddingTop + innerHeight - ratio * innerHeight;
        const gridValue = Math.round(maxValue * ratio);
        return (
          <g key={ratio}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={chartWidth - paddingRight}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {gridValue >= 1000 ? `${Math.round(gridValue / 1000)}k` : gridValue}€
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((point, i) => {
        const barHeight = (point.revenue / maxValue) * innerHeight;
        const x = paddingLeft + i * barGap + barGap / 2 - barWidth / 2;
        const y = paddingTop + innerHeight - barHeight;

        return (
          <g key={point.month}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 2)}
              rx="4"
              fill="#3D52A0"
              className="hover:fill-[#5468b8] transition-colors cursor-default"
            />
            {point.revenue > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="9"
                fill="#3D52A0"
                fontWeight="600"
              >
                {point.revenue >= 1000
                  ? `${(point.revenue / 1000).toFixed(1)}k€`
                  : `${point.revenue}€`}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={chartHeight - 6}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {point.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BarChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-end gap-3 h-40">
        {[60, 80, 45, 90, 70, 55].map((h, i) => (
          <div key={i} className="flex-1 bg-slate-100 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line Chart SVG — Patients
// ---------------------------------------------------------------------------

function LineChartSvg({ data }: { data: PatientPoint[] }) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.total), 1);
  const chartWidth = 520;
  const chartHeight = 160;
  const paddingLeft = 40;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const points = data.map((point, i) => {
    const x = paddingLeft + (data.length > 1 ? (i / (data.length - 1)) * innerWidth : innerWidth / 2);
    const y = paddingTop + innerHeight - (point.total / maxValue) * innerHeight;
    return { x, y, ...point };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  if (!firstPoint || !lastPoint) return null;

  const areaPath =
    `M ${firstPoint.x},${paddingTop + innerHeight} ` +
    points.map((p) => `L ${p.x},${p.y}`).join(' ') +
    ` L ${lastPoint.x},${paddingTop + innerHeight} Z`;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full"
      aria-label="Graphique de croissance des patients"
      role="img"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D9488" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((ratio) => {
        const y = paddingTop + innerHeight - ratio * innerHeight;
        return (
          <g key={ratio}>
            <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {Math.round(maxValue * ratio)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#lineGradient)" />
      <polyline points={polylinePoints} fill="none" stroke="#0D9488" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p) => (
        <g key={p.month}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#0D9488" strokeWidth="2" />
          <text x={p.x} y={chartHeight - 4} textAnchor="middle" fontSize="10" fill="#64748b">
            {p.month}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Mood Trend Bars
// ---------------------------------------------------------------------------

function getMoodColor(value: number): string {
  if (value >= 8) return 'bg-emerald-500';
  if (value >= 6) return 'bg-green-400';
  if (value >= 4) return 'bg-amber-400';
  if (value >= 2) return 'bg-orange-400';
  return 'bg-red-500';
}

function getMoodLabel(value: number): string {
  if (value >= 8) return 'Excellent';
  if (value >= 6) return 'Bon';
  if (value >= 4) return 'Neutre';
  if (value >= 2) return 'Difficile';
  return 'Critique';
}

function MoodBars({ data }: { data: MoodTrend[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Pas encore de données d&apos;humeur
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.week} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-20 flex-shrink-0">Sem. {item.week}</span>
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', getMoodColor(item.avgMood))}
              style={{ width: `${(item.avgMood / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-foreground w-20 flex-shrink-0">
            {item.avgMood.toFixed(1)}/10 — {getMoodLabel(item.avgMood)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AnalyticsContent() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.getOverview(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['analytics', 'revenue', 6],
    queryFn: () => analyticsApi.getRevenue(token!, 6),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { data: patientGrowth, isLoading: patientLoading } = useQuery({
    queryKey: ['analytics', 'patients', 6],
    queryFn: () => analyticsApi.getPatientGrowth(token!, 6),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { data: moodTrends, isLoading: moodLoading } = useQuery({
    queryKey: ['analytics', 'mood-trends'],
    queryFn: () => analyticsApi.getMoodTrends(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const formatEur = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const revenueTrend = overview
    ? calcTrend(overview.revenueThisMonth, overview.revenueLastMonth)
    : undefined;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={20} className="text-primary" aria-hidden />
          <h1 className="text-2xl font-bold text-foreground">Analytiques</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Suivez vos revenus, patients et tendances thérapeutiques
        </p>
      </div>

      {/* Section 1 — KPI Cards */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
          Indicateurs clés
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {overviewLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : overview ? (
            <>
              <KpiCard
                title="Revenus ce mois"
                value={formatEur(overview.revenueThisMonth)}
                trend={revenueTrend}
                subtitle="vs mois précédent"
                icon={<span className="text-primary font-bold text-sm">€</span>}
                iconBg="bg-primary/10"
              />
              <KpiCard
                title="Patients actifs"
                value={String(overview.activePatients)}
                subtitle={`${overview.totalPatients} patients au total`}
                icon={<Users size={16} className="text-teal-600" />}
                iconBg="bg-teal-50"
              />
              <KpiCard
                title="Séances ce mois"
                value={String(overview.sessionsThisMonth)}
                subtitle={`Moy. ${overview.avgSessionsPerPatient} séances/patient`}
                icon={<CalendarCheck size={16} className="text-violet-600" />}
                iconBg="bg-violet-50"
              />
              <KpiCard
                title="Adoption portail"
                value={`${overview.portalAdoptionRate.toFixed(1)}%`}
                subtitle="patients avec accès"
                icon={<Activity size={16} className="text-amber-600" />}
                iconBg="bg-amber-50"
              />
            </>
          ) : (
            <p className="col-span-4 text-sm text-muted-foreground">Impossible de charger les KPIs.</p>
          )}
        </div>
      </section>

      {/* Section 2 — Graphique revenus */}
      <section aria-labelledby="revenue-heading">
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 id="revenue-heading" className="text-base font-semibold text-foreground mb-6">
            Revenus mensuels (6 mois)
          </h2>
          {revenueLoading ? (
            <BarChartSkeleton />
          ) : revenue && revenue.length > 0 ? (
            <BarChartSvg data={revenue} />
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              Pas encore de données de revenus
            </div>
          )}
        </div>
      </section>

      {/* Section 3 — Patients + Humeur */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart patients */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-6">
            Croissance patients (6 mois)
          </h2>
          {patientLoading ? (
            <div className="animate-pulse h-32 bg-slate-100 rounded" />
          ) : patientGrowth && patientGrowth.length > 0 ? (
            <>
              <LineChartSvg data={patientGrowth} />
              <p className="text-xs text-muted-foreground mt-2">
                Courbe du total patients cumulés par mois
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Pas encore de données patients
            </div>
          )}
        </div>

        {/* Mood trends */}
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-6">
            Tendance humeur (4 semaines)
          </h2>
          {moodLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 bg-slate-100 rounded w-20" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full" />
                  <div className="h-3 bg-slate-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : moodTrends && moodTrends.length > 0 ? (
            <MoodBars data={moodTrends} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Pas encore de données d&apos;humeur — encouragez vos patients à utiliser le portail
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-6 pt-4 border-t border-border">
            Moyenne des humeurs rapportées via le portail patient (1 = difficile, 10 = excellent)
          </p>
        </div>
      </section>

      {/* Section 4 — Stats globales */}
      {overview && (
        <section className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Résumé du cabinet</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-surface rounded-lg">
              <p className="text-2xl font-bold text-foreground">{overview.totalPatients}</p>
              <p className="text-xs text-muted-foreground mt-1">Patients total</p>
            </div>
            <div className="text-center p-4 bg-surface rounded-lg">
              <p className="text-2xl font-bold text-foreground">{overview.totalSessions}</p>
              <p className="text-xs text-muted-foreground mt-1">Séances total</p>
            </div>
            <div className="text-center p-4 bg-surface rounded-lg">
              <p className="text-2xl font-bold text-foreground">{overview.avgSessionsPerPatient}</p>
              <p className="text-xs text-muted-foreground mt-1">Séances / patient</p>
            </div>
            <div className="text-center p-4 bg-surface rounded-lg">
              <p className="text-2xl font-bold text-foreground">{formatEur(overview.revenueLastMonth)}</p>
              <p className="text-xs text-muted-foreground mt-1">Revenus mois dernier</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

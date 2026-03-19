'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  rate: number;
  rateFromTop: number;
}

interface CohortWeek {
  week: string;
  signups: number;
  onboarded: number;
  firstPatient: number;
  firstSession: number;
  converted: number;
}

interface FunnelMetrics {
  funnel: FunnelStep[];
  cohorts: CohortWeek[];
  summary: {
    totalPsys: number;
    trialToPaidRate: number;
    mrr: number;
    avgPatientsByActivePsy: number;
  };
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function KpiCard({ label, value, subtitle, icon, iconBg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn('p-2 rounded-lg', iconBg)}>{icon}</div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-3 bg-muted rounded w-28" />
        <div className="h-8 w-8 bg-muted rounded-lg" />
      </div>
      <div className="h-7 bg-muted rounded w-20 mb-2" />
      <div className="h-3 bg-muted rounded w-24" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Funnel SVG — Entonnoir horizontal
// ---------------------------------------------------------------------------

function FunnelSvg({ steps }: { steps: FunnelStep[] }) {
  if (steps.length === 0) return null;

  const svgWidth = 720;
  const svgHeight = 240;
  const paddingX = 12;
  const paddingY = 20;
  const labelAreaHeight = 56;
  const funnelHeight = svgHeight - paddingY * 2 - labelAreaHeight;
  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  // Each step occupies an equal horizontal slice
  const sliceWidth = (svgWidth - paddingX * 2) / steps.length;

  // Funnel shape: trapezoid per step, height proportional to count
  // Min height = 8px so zero-count steps are still visible
  const minBarHeight = 8;
  const centerY = paddingY + funnelHeight / 2;

  // Gradient colors from dark primary to lighter blue
  const stepColors = [
    '#3D52A0',
    '#4A60B5',
    '#576EC9',
    '#647CDE',
    '#7B9CDA',
  ];

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full"
      aria-label="Entonnoir d'activation"
      role="img"
    >
      <defs>
        {steps.map((_, i) => {
          const color = stepColors[i] ?? '#7B9CDA';
          return (
            <linearGradient
              key={i}
              id={`funnel-grad-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
          );
        })}
      </defs>

      {steps.map((step, i) => {
        const barHeight = Math.max(
          minBarHeight,
          (step.count / maxCount) * funnelHeight,
        );

        const x = paddingX + i * sliceWidth;
        const y = centerY - barHeight / 2;

        // Next step height for the connecting trapezoid shape
        const nextStep = steps[i + 1];
        const nextBarHeight = nextStep
          ? Math.max(minBarHeight, (nextStep.count / maxCount) * funnelHeight)
          : barHeight;

        // Draw trapezoid: current left edge → next right edge
        const x1 = x;
        const x2 = x + sliceWidth;
        const topY1 = centerY - barHeight / 2;
        const botY1 = centerY + barHeight / 2;
        const topY2 = centerY - nextBarHeight / 2;
        const botY2 = centerY + nextBarHeight / 2;

        const points = `${x1},${topY1} ${x2},${topY2} ${x2},${botY2} ${x1},${botY1}`;

        const labelY = svgHeight - labelAreaHeight + 12;

        return (
          <g key={step.step}>
            {/* Trapezoid segment */}
            <polygon
              points={points}
              fill={`url(#funnel-grad-${i})`}
              className="transition-opacity hover:opacity-90"
            />

            {/* Separator line between steps */}
            {i > 0 && (
              <line
                x1={x}
                y1={topY1}
                x2={x}
                y2={botY1}
                stroke="white"
                strokeWidth="2"
                opacity="0.6"
              />
            )}

            {/* Count — inside the bar if tall enough, else above */}
            {barHeight >= 32 ? (
              <text
                x={x + sliceWidth / 2}
                y={y + barHeight / 2 + 5}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="white"
              >
                {step.count.toLocaleString('fr-FR')}
              </text>
            ) : (
              <text
                x={x + sliceWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={stepColors[i] ?? '#3D52A0'}
              >
                {step.count.toLocaleString('fr-FR')}
              </text>
            )}

            {/* Step label */}
            <text
              x={x + sliceWidth / 2}
              y={labelY}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#1E1B4B"
            >
              {step.label}
            </text>

            {/* Conversion rate — shown for all steps except the first */}
            {i > 0 && (
              <text
                x={x + sliceWidth / 2}
                y={labelY + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {step.rate.toFixed(0)}% du prec.
              </text>
            )}
            {i === 0 && (
              <text
                x={x + sliceWidth / 2}
                y={labelY + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                base 100%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function FunnelSkeleton() {
  return (
    <div className="animate-pulse flex items-end gap-1 h-40 px-4">
      {[100, 75, 55, 38, 22].map((pct, i) => (
        <div
          key={i}
          className="flex-1 bg-muted rounded-t"
          style={{ height: `${pct}%` }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cohort Table
// ---------------------------------------------------------------------------

function pct(value: number, base: number): string {
  if (base === 0) return '—';
  return `${Math.round((value / base) * 100)}%`;
}

interface CohortTableProps {
  cohorts: CohortWeek[];
}

function CohortTable({ cohorts }: CohortTableProps) {
  if (cohorts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Pas encore de données de cohortes
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 pr-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Semaine
            </th>
            <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Inscrits
            </th>
            <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Onboarding
            </th>
            <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1er patient
            </th>
            <th className="text-right py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1ere seance
            </th>
            <th className="text-right py-3 pl-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payant
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {cohorts.map((cohort, idx) => {
            const convertedPct = cohort.signups > 0
              ? (cohort.converted / cohort.signups) * 100
              : 0;
            const isPaidGood = convertedPct > 10;

            return (
              <tr
                key={cohort.week}
                className={cn(
                  'hover:bg-surface transition-colors',
                  idx % 2 === 0 ? 'bg-white' : 'bg-surface/40',
                )}
              >
                <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">
                  {cohort.week}
                </td>
                <td className="py-3 px-3 text-right">
                  <p className="font-semibold text-foreground">
                    {cohort.signups}
                  </p>
                </td>
                <td className="py-3 px-3 text-right">
                  <p className="font-semibold text-foreground">
                    {cohort.onboarded}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pct(cohort.onboarded, cohort.signups)}
                  </p>
                </td>
                <td className="py-3 px-3 text-right">
                  <p className="font-semibold text-foreground">
                    {cohort.firstPatient}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pct(cohort.firstPatient, cohort.signups)}
                  </p>
                </td>
                <td className="py-3 px-3 text-right">
                  <p className="font-semibold text-foreground">
                    {cohort.firstSession}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pct(cohort.firstSession, cohort.signups)}
                  </p>
                </td>
                <td className="py-3 pl-3 text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      isPaidGood ? 'text-emerald-600' : 'text-foreground',
                    )}
                  >
                    {cohort.converted}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      isPaidGood
                        ? 'text-emerald-500'
                        : 'text-muted-foreground',
                    )}
                  >
                    {pct(cohort.converted, cohort.signups)}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CohortTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-muted rounded" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, j) => (
            <div key={j} className="h-8 bg-muted rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function FunnelContent() {
  const session = useSession();
  const token = session.data?.accessToken;

  const { data, isLoading, error } = useQuery<FunnelMetrics, ApiError>({
    queryKey: ['admin-funnel'],
    queryFn: () => apiClient.get<FunnelMetrics>('/admin/funnel', token),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  // 403 error handling
  if (error instanceof ApiError && error.statusCode === 403) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acces admin requis.</p>
      </div>
    );
  }

  const formatEur = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Funnel d&apos;activation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivi de la conversion inscription &rarr; payant
        </p>
      </div>

      {/* KPI Cards */}
      <section aria-labelledby="funnel-kpi-heading">
        <h2
          id="funnel-kpi-heading"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4"
        >
          Indicateurs globaux
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : data ? (
            <>
              <KpiCard
                label="Total psys inscrits"
                value={data.summary.totalPsys.toLocaleString('fr-FR')}
                subtitle="comptes crees"
                icon={<Users size={16} className="text-primary" />}
                iconBg="bg-primary/10"
              />
              <KpiCard
                label="Trial → Payant"
                value={`${data.summary.trialToPaidRate.toFixed(1)}%`}
                subtitle="taux de conversion"
                icon={<TrendingUp size={16} className="text-emerald-600" />}
                iconBg="bg-emerald-50"
              />
              <KpiCard
                label="MRR"
                value={formatEur(data.summary.mrr)}
                subtitle="revenus recurrents mensuels"
                icon={<CreditCard size={16} className="text-violet-600" />}
                iconBg="bg-violet-50"
              />
              <KpiCard
                label="Patients / psy active"
                value={data.summary.avgPatientsByActivePsy.toFixed(1)}
                subtitle="moyenne sur psys actives"
                icon={<Activity size={16} className="text-amber-600" />}
                iconBg="bg-amber-50"
              />
            </>
          ) : (
            <p className="col-span-4 text-sm text-muted-foreground">
              Impossible de charger les indicateurs.
            </p>
          )}
        </div>
      </section>

      {/* Funnel visuel */}
      <section aria-labelledby="funnel-visual-heading">
        <div className="bg-white rounded-xl border border-border p-6">
          <h2
            id="funnel-visual-heading"
            className="text-base font-semibold text-foreground mb-6"
          >
            Entonnoir d&apos;activation
          </h2>
          {isLoading ? (
            <FunnelSkeleton />
          ) : data && data.funnel.length > 0 ? (
            <FunnelSvg steps={data.funnel} />
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
              Pas encore de donnees de funnel
            </div>
          )}
        </div>
      </section>

      {/* Table des cohortes */}
      <section aria-labelledby="funnel-cohorts-heading">
        <div className="bg-white rounded-xl border border-border p-6">
          <h2
            id="funnel-cohorts-heading"
            className="text-base font-semibold text-foreground mb-6"
          >
            Cohortes hebdomadaires (8 semaines)
          </h2>
          {isLoading ? (
            <CohortTableSkeleton />
          ) : data ? (
            <CohortTable cohorts={data.cohorts.slice(-8)} />
          ) : (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              Impossible de charger les cohortes.
            </div>
          )}
        </div>
      </section>

      {/* Legend */}
      {!isLoading && data && (
        <p className="text-xs text-muted-foreground text-right">
          % = part des inscrits de la semaine ayant atteint cette etape
        </p>
      )}
    </div>
  );
}

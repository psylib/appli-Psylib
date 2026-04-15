'use client';

import { useQuery } from '@tanstack/react-query';
import { accountingApi, type AccountingDashboard } from '@/lib/api/accounting';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function getMonthLabel(monthStr: string): string {
  const date = new Date(monthStr + '-01');
  if (isNaN(date.getTime())) return monthStr;
  return MONTHS_SHORT[date.getMonth()] ?? monthStr;
}

// ─── Monthly P&L Bar Chart (SVG) ─────────────────────────────────────────────

interface MonthlyBar {
  month: string;
  income: number;
  expenses: number;
}

function MonthlyPnLChart({ data }: { data: MonthlyBar[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Pas encore de données pour cette période
      </div>
    );
  }

  const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expenses]), 1);
  const chartWidth = 600;
  const chartHeight = 200;
  const paddingLeft = 56;
  const paddingRight = 16;
  const paddingTop = 24;
  const paddingBottom = 32;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const groupWidth = innerWidth / data.length;
  const barPad = groupWidth * 0.15;
  const barWidth = (groupWidth - barPad * 2) / 2;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full"
      aria-label="Graphique recettes et dépenses mensuelles"
      role="img"
    >
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = paddingTop + innerHeight - ratio * innerHeight;
        const val = Math.round(maxValue * ratio);
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
            <text x={paddingLeft - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k€` : `${val}€`}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g>
        <rect x={paddingLeft} y={4} width={10} height={10} rx="2" fill="#3D52A0" />
        <text x={paddingLeft + 14} y={13} fontSize="10" fill="#64748b">Recettes</text>
        <rect x={paddingLeft + 80} y={4} width={10} height={10} rx="2" fill="#EF4444" />
        <text x={paddingLeft + 94} y={13} fontSize="10" fill="#64748b">Dépenses</text>
      </g>

      {/* Bars */}
      {data.map((point, i) => {
        const groupX = paddingLeft + i * groupWidth + barPad;

        const incomeH = Math.max((point.income / maxValue) * innerHeight, point.income > 0 ? 2 : 0);
        const expenseH = Math.max((point.expenses / maxValue) * innerHeight, point.expenses > 0 ? 2 : 0);

        const incomeX = groupX;
        const expenseX = groupX + barWidth + 2;

        return (
          <g key={point.month}>
            {/* Income bar */}
            <rect
              x={incomeX}
              y={paddingTop + innerHeight - incomeH}
              width={barWidth}
              height={incomeH}
              rx="3"
              fill="#3D52A0"
            />
            {/* Expense bar */}
            <rect
              x={expenseX}
              y={paddingTop + innerHeight - expenseH}
              width={barWidth}
              height={expenseH}
              rx="3"
              fill="#EF4444"
              opacity="0.75"
            />
            {/* Month label */}
            <text
              x={groupX + barWidth + 1}
              y={chartHeight - 6}
              textAnchor="middle"
              fontSize="9"
              fill="#64748b"
            >
              {getMonthLabel(point.month)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Expense Category Pie Chart (SVG) ────────────────────────────────────────

const PIE_COLORS = ['#3D52A0', '#0D9488', '#7C3AED', '#F59E0B', '#EF4444', '#10B981', '#6366F1'];

interface PieSlice {
  category: string;
  amount: number;
  percentage: number;
}

function ExpensePieChart({ data }: { data: PieSlice[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Aucune dépense enregistrée
      </div>
    );
  }

  const cx = 80;
  const cy = 80;
  const r = 70;

  let cumulativeAngle = -Math.PI / 2;

  const slices = data.map((item, i) => {
    const angle = (item.percentage / 100) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { path, color: PIE_COLORS[i % PIE_COLORS.length] ?? '#3D52A0', ...item };
  });

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4">
      <svg viewBox="0 0 160 160" className="w-40 h-40 flex-shrink-0" aria-label="Répartition des dépenses" role="img">
        {slices.map((slice) => (
          <path key={slice.category} d={slice.path} fill={slice.color} />
        ))}
        <circle cx={cx} cy={cy} r={38} fill="white" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1E1B4B">
          {data.length} cat.
        </text>
      </svg>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {slices.map((slice) => (
          <div key={slice.category} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-xs text-muted-foreground truncate flex-1">{slice.category}</span>
            <span className="text-xs font-medium text-foreground tabular-nums">
              {slice.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Monthly P&L Table ────────────────────────────────────────────────────────

function MonthlyTable({ dashboard }: { dashboard: AccountingDashboard }) {
  const { revenueByMonth, expensesByMonth } = dashboard.currentYear;

  const months = revenueByMonth.map((r) => {
    const expRow = expensesByMonth.find((e) => e.month === r.month);
    const expenses = expRow?.amount ?? 0;
    return {
      month: r.month,
      income: r.amount,
      expenses,
      net: r.amount - expenses,
    };
  });

  if (months.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Aucune donnée mensuelle disponible.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mois</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recettes</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dépenses</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Net</th>
          </tr>
        </thead>
        <tbody>
          {months.map((row) => (
            <tr key={row.month} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
              <td className="py-2 px-3 text-foreground">{row.month}</td>
              <td className="py-2 px-3 text-right text-accent font-medium">{formatCurrency(row.income)}</td>
              <td className="py-2 px-3 text-right text-destructive">{formatCurrency(row.expenses)}</td>
              <td className={`py-2 px-3 text-right font-semibold ${row.net >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {formatCurrency(row.net)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Dashboard Skeleton ───────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-6 animate-pulse">
      <div className="h-5 bg-slate-100 rounded w-48" />
      <div className="h-40 bg-slate-100 rounded" />
      <div className="h-5 bg-slate-100 rounded w-36" />
      <div className="h-32 bg-slate-100 rounded" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FinancialDashboard({ token }: { token: string }) {
  const { data: dashboard, isLoading, isError } = useQuery({
    queryKey: ['accounting-dashboard'],
    queryFn: () => accountingApi.getDashboard(token),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !dashboard) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
        Impossible de charger le tableau de bord financier.
      </div>
    );
  }

  // Build monthly bars from currentYear data
  const monthlyBars: MonthlyBar[] = dashboard.currentYear.revenueByMonth.map((r) => {
    const expRow = dashboard.currentYear.expensesByMonth.find((e) => e.month === r.month);
    return {
      month: r.month,
      income: r.amount,
      expenses: expRow?.amount ?? 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* Monthly income vs expenses chart */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Recettes et dépenses mensuelles</h2>
        <MonthlyPnLChart data={monthlyBars} />
      </div>

      {/* Expense breakdown + monthly table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Dépenses par catégorie</h2>
          <ExpensePieChart data={dashboard.topExpenseCategories} />
        </div>

        <div className="rounded-xl border border-border bg-white p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Récapitulatif mensuel</h2>
          <MonthlyTable dashboard={dashboard} />
        </div>
      </div>
    </div>
  );
}

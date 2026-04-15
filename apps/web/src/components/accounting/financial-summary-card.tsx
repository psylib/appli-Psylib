'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from 'lucide-react';
import { accountingApi } from '@/lib/api/accounting';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 bg-slate-100 rounded" />
        <div className="h-3 bg-slate-100 rounded w-24" />
      </div>
      <div className="h-6 bg-slate-100 rounded w-28" />
    </div>
  );
}

export function FinancialSummaryCard({ token }: { token: string }) {
  const { data: summary, isLoading, isError } = useQuery({
    queryKey: ['accounting-summary'],
    queryFn: () => accountingApi.getSummary(token),
    enabled: !!token,
    staleTime: 60_000,
  });

  const { data: socialCharges } = useQuery({
    queryKey: ['accounting-social-charges', new Date().getFullYear()],
    queryFn: () => accountingApi.getSocialCharges(token, new Date().getFullYear()),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  if (isError || !summary) {
    return (
      <div className="rounded-xl border border-border bg-white p-4 text-sm text-muted-foreground">
        Impossible de charger les indicateurs financiers.
      </div>
    );
  }

  const netResult = summary.netIncome ?? 0;
  const monthlyProvision = socialCharges
    ? socialCharges.totalCharges / 12
    : netResult / 12;

  const cards = [
    {
      label: 'Total recettes',
      value: summary.revenue ?? 0,
      icon: TrendingUp,
      color: 'text-accent',
    },
    {
      label: 'Total dépenses',
      value: summary.expenses ?? 0,
      icon: TrendingDown,
      color: 'text-destructive',
    },
    {
      label: 'Résultat net',
      value: netResult,
      icon: DollarSign,
      color: netResult >= 0 ? 'text-accent' : 'text-destructive',
    },
    {
      label: 'Provision mensuelle',
      value: monthlyProvision,
      icon: PiggyBank,
      color: 'text-primary',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-white p-4 space-y-1 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <card.icon size={16} className={card.color} aria-hidden />
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {card.label}
            </p>
          </div>
          <p className={cn('text-xl font-bold', card.color)}>
            {formatCurrency(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

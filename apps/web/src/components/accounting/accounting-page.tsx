'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { accountingApi } from '@/lib/api/accounting';
import { IncomeBook } from './income-book';
import { ExpenseList } from './expense-list';
import { AccountingLedger } from './accounting-ledger';
import { RecurringExpensesCard } from './recurring-expenses-card';
import { cn } from '@/lib/utils';

type Tab = 'recettes' | 'depenses' | 'livre-journal';

const TAB_LABELS: Record<Tab, string> = {
  recettes:       'Recettes',
  depenses:       'Dépenses',
  'livre-journal':'Livre-journal',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className={color} aria-hidden />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className={cn('text-xl font-bold', color)}>{formatCurrency(value)}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AccountingPageContent() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [activeTab, setActiveTab] = useState<Tab>('recettes');

  const { data: summary } = useQuery({
    queryKey: ['accounting-summary'],
    queryFn: () => accountingApi.getSummary(token),
    enabled: !!token,
    staleTime: 60_000,
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comptabilité</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Livre des recettes, dépenses et journal comptable
        </p>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            label="Recettes"
            value={summary.revenue ?? 0}
            icon={TrendingUp}
            color="text-accent"
          />
          <KpiCard
            label="Dépenses"
            value={summary.expenses ?? 0}
            icon={TrendingDown}
            color="text-destructive"
          />
          <KpiCard
            label="Résultat net"
            value={summary.netIncome ?? 0}
            icon={DollarSign}
            color={(summary.netIncome ?? 0) >= 0 ? 'text-accent' : 'text-destructive'}
          />
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-border">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === tab
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {TAB_LABELS[tab]}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'recettes' && <IncomeBook token={token} />}
      {activeTab === 'depenses' && (
        <div className="space-y-6">
          <ExpenseList token={token} />
          <RecurringExpensesCard token={token} />
        </div>
      )}
      {activeTab === 'livre-journal' && <AccountingLedger token={token} />}
    </div>
  );
}

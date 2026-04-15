'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientRowSkeleton } from '@/components/ui/skeleton';
import { accountingApi } from '@/lib/api/accounting';
import { ExpenseCategoryBadge } from './expense-category-badge';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const PAGE_SIZE = 20;

interface Props {
  token: string;
}

export function AccountingLedger({ token }: Props) {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounting-book', { page, type: typeFilter, dateFrom, dateTo }],
    queryFn: () =>
      accountingApi.getBook(token, {
        page,
        limit: PAGE_SIZE,
        type: typeFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled: !!token,
    staleTime: 30_000,
  });

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const totalIncome = entries
    .filter((e) => e.type === 'income')
    .reduce((acc, e) => acc + Number(e.amount), 0);
  const totalExpenses = entries
    .filter((e) => e.type === 'expense')
    .reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-surface/50">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 h-8"
        >
          <option value="">Tout</option>
          <option value="income">Recettes</option>
          <option value="expense">Dépenses</option>
        </select>

        <span className="text-sm text-muted-foreground">Période :</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="h-8 text-sm w-auto"
          title="Date depuis"
        />
        <span className="text-muted-foreground text-sm">→</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="h-8 text-sm w-auto"
          title="Date jusqu'au"
        />
      </div>

      {/* Table header */}
      {!isLoading && entries.length > 0 && (
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span className="w-28">Date</span>
          <span className="w-20">Type</span>
          <span className="flex-1">Libellé</span>
          <span className="w-24 text-right">Débit</span>
          <span className="w-24 text-right">Crédit</span>
          <span className="w-36">Catégorie</span>
          <span className="w-28">Contrepartie</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => <PatientRowSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-sm text-destructive">Erreur de chargement</div>
      ) : !entries.length ? (
        <EmptyState
          icon={BookOpen}
          title="Livre-journal vide"
          description="Les recettes et dépenses apparaissent ici au fur et à mesure"
        />
      ) : (
        <ul role="list" className="divide-y divide-border">
          {entries.map((entry) => {
            const isIncome = entry.type === 'income';
            return (
              <li key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors">
                <span className="w-28 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(entry.date)}
                </span>
                <span className="w-20">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                      isIncome
                        ? 'bg-accent/10 text-accent'
                        : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {isIncome ? 'Recette' : 'Dépense'}
                  </span>
                </span>
                <span className="flex-1 text-sm font-medium text-foreground truncate">
                  {entry.label}
                </span>
                {/* Débit (expense) */}
                <span className={cn('w-24 text-sm font-semibold text-right', !isIncome ? 'text-destructive' : 'text-transparent select-none')}>
                  {!isIncome ? formatCurrency(Number(entry.amount)) : '—'}
                </span>
                {/* Crédit (income) */}
                <span className={cn('w-24 text-sm font-semibold text-right', isIncome ? 'text-accent' : 'text-transparent select-none')}>
                  {isIncome ? formatCurrency(Number(entry.amount)) : '—'}
                </span>
                <span className="w-36">
                  {entry.category ? (
                    <ExpenseCategoryBadge category={entry.category} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </span>
                <span className="w-28 text-xs text-muted-foreground truncate">
                  {entry.patientName ?? entry.reference ?? '—'}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/50">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">{total} écriture{total !== 1 ? 's' : ''}</span>
            <span className="text-accent font-semibold">+{formatCurrency(totalIncome)}</span>
            <span className="text-destructive font-semibold">-{formatCurrency(totalExpenses)}</span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 hover:bg-surface transition-colors"
              >
                Préc.
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 text-xs rounded border border-border disabled:opacity-40 hover:bg-surface transition-colors"
              >
                Suiv.
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientRowSkeleton } from '@/components/ui/skeleton';
import { accountingApi } from '@/lib/api/accounting';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const PAGE_SIZE = 20;

const PAYMENT_LABELS: Record<string, string> = {
  card: 'CB',
  cash: 'Espèces',
  check: 'Chèque',
  bank_transfer: 'Virement',
  direct_debit: 'Prélèvement',
  other: 'Autre',
};

interface Props {
  token: string;
}

export function IncomeBook({ token }: Props) {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounting-book', { type: 'income', page, dateFrom, dateTo }],
    queryFn: () =>
      accountingApi.getBook(token, {
        type: 'income',
        page,
        limit: PAGE_SIZE,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled: !!token,
    staleTime: 30_000,
  });

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const totalAmount = entries.reduce((acc, e) => acc + Number(e.amount), 0);

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-surface/50">
        <span className="text-sm font-medium text-foreground">Période :</span>
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
          <span className="w-32">Patient</span>
          <span className="flex-1">Libellé</span>
          <span className="w-24 text-right">Montant</span>
          <span className="w-24">Mode</span>
          <span className="w-28">N° pièce</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div>
          {Array.from({ length: 4 }).map((_, i) => <PatientRowSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-sm text-destructive">Erreur de chargement</div>
      ) : !entries.length ? (
        <EmptyState
          icon={TrendingUp}
          title="Aucune recette"
          description="Les encaissements apparaissent ici après paiement d'une séance"
        />
      ) : (
        <ul role="list" className="divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors">
              <span className="w-28 text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(entry.date)}
              </span>
              <span className="w-32 text-xs text-muted-foreground truncate">
                {entry.patientName ?? '—'}
              </span>
              <span className="flex-1 text-sm font-medium text-foreground truncate">
                {entry.label}
              </span>
              <span className="w-24 text-sm font-semibold text-accent text-right">
                {formatCurrency(Number(entry.amount))}
              </span>
              <span className="w-24 text-xs text-muted-foreground">
                {entry.reference ? (PAYMENT_LABELS[entry.reference] ?? entry.reference) : '—'}
              </span>
              <span className="w-28 text-xs text-muted-foreground font-mono truncate">
                {entry.invoiceNumber ?? '—'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Footer: total + pagination */}
      {entries.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{total} recette{total !== 1 ? 's' : ''}</span>
            <span className="text-xs font-bold text-accent">
              Total : {formatCurrency(totalAmount)}
            </span>
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

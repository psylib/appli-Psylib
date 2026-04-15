'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Paperclip, Pencil, Trash2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientRowSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { expensesApi } from '@/lib/api/expenses';
import { ExpenseCategoryBadge, CATEGORY_OPTIONS } from './expense-category-badge';
import { ExpenseFormDialog } from './expense-form-dialog';
import type { ExpenseRecord } from '@/lib/api/expenses';

const PAYMENT_LABELS: Record<string, string> = {
  card: 'CB',
  bank_transfer: 'Virement',
  cash: 'Espèces',
  check: 'Chèque',
  direct_debit: 'Prélèvement',
  other: 'Autre',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

interface Props {
  token: string;
}

export function ExpenseList({ token }: Props) {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseRecord | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: expenses, isLoading, isError } = useQuery({
    queryKey: ['expenses', { search, category, dateFrom, dateTo }],
    queryFn: () => expensesApi.list(token, { search: search || undefined, category: category || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, limit: 50 }),
    enabled: !!token,
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.delete(id, token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['expenses'] });
      success('Dépense supprimée');
      setDeleteConfirm(null);
    },
    onError: () => showError('Erreur lors de la suppression'),
  });

  const handleEdit = (expense: ExpenseRecord) => {
    setEditExpense(expense);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditExpense(undefined);
  };

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border bg-surface/50">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 h-8"
        >
          <option value="">Toutes catégories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-8 text-sm w-auto"
          title="Date depuis"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-8 text-sm w-auto"
          title="Date jusqu'au"
        />

        <Button size="sm" onClick={() => { setEditExpense(undefined); setShowForm(true); }}>
          <Plus size={14} />
          Nouvelle dépense
        </Button>
      </div>

      {/* Table header */}
      {!isLoading && expenses && expenses.length > 0 && (
        <div className="hidden md:flex items-center gap-3 px-4 py-2.5 border-b border-border bg-surface text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span className="w-24">Date</span>
          <span className="flex-1">Libellé</span>
          <span className="w-36">Catégorie</span>
          <span className="w-24 text-right">Montant</span>
          <span className="w-24">Mode</span>
          <span className="w-24">Fournisseur</span>
          <span className="w-8 text-center" title="Justificatif">J.</span>
          <span className="w-16" />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div>
          {Array.from({ length: 4 }).map((_, i) => <PatientRowSkeleton key={i} />)}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-sm text-destructive">Erreur de chargement</div>
      ) : !expenses?.length ? (
        <EmptyState
          icon={Receipt}
          title="Aucune dépense"
          description="Enregistrez votre première dépense professionnelle"
          action={{ label: 'Ajouter une dépense', onClick: () => setShowForm(true) }}
        />
      ) : (
        <ul role="list" className="divide-y divide-border">
          {expenses.map((exp) => (
            <li key={exp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors">
              <span className="w-24 text-xs text-muted-foreground whitespace-nowrap">{formatDate(exp.date)}</span>
              <span className="flex-1 text-sm font-medium text-foreground truncate">{exp.label}</span>
              <span className="w-36">
                <ExpenseCategoryBadge category={exp.category} />
              </span>
              <span className="w-24 text-sm font-semibold text-foreground text-right">
                {formatCurrency(exp.amount)}
              </span>
              <span className="w-24 text-xs text-muted-foreground">
                {PAYMENT_LABELS[exp.paymentMethod] ?? exp.paymentMethod}
              </span>
              <span className="w-24 text-xs text-muted-foreground truncate">
                {exp.supplier ?? '—'}
              </span>
              <span className="w-8 text-center">
                {exp.receiptUrl && (
                  <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer" title="Justificatif">
                    <Paperclip size={14} className="text-muted-foreground hover:text-foreground" aria-hidden />
                  </a>
                )}
              </span>
              <div className="w-16 flex items-center gap-1 justify-end">
                <button
                  onClick={() => handleEdit(exp)}
                  className="p-1.5 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
                  title="Modifier"
                >
                  <Pencil size={14} aria-hidden />
                </button>
                <button
                  onClick={() => setDeleteConfirm(exp.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Total */}
      {expenses && expenses.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface/50">
          <span className="text-xs text-muted-foreground">{expenses.length} dépense{expenses.length !== 1 ? 's' : ''}</span>
          <span className="text-sm font-bold text-foreground">
            Total : {formatCurrency(expenses.reduce((acc, e) => acc + Number(e.amount), 0))}
          </span>
        </div>
      )}

      {/* Form dialog */}
      {showForm && (
        <ExpenseFormDialog
          token={token}
          expense={editExpense}
          onClose={handleCloseForm}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Supprimer la dépense ?</h3>
            <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirm)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

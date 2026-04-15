'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { recurringExpensesApi } from '@/lib/api/recurring-expenses';
import { ExpenseCategoryBadge, CATEGORY_OPTIONS } from './expense-category-badge';
import { cn } from '@/lib/utils';
import type { RecurringExpenseRecord } from '@/lib/api/recurring-expenses';

const FREQUENCY_LABELS: Record<string, string> = {
  monthly:   'Mensuel',
  quarterly: 'Trimestriel',
  annual:    'Annuel',
  weekly:    'Hebdomadaire',
};

const PAYMENT_METHODS = [
  { value: 'card',          label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'cash',          label: 'Espèces' },
  { value: 'check',         label: 'Chèque' },
  { value: 'direct_debit',  label: 'Prélèvement' },
  { value: 'other',         label: 'Autre' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Create form ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  label:         z.string().min(1, 'Libellé requis'),
  amount:        z.number({ invalid_type_error: 'Montant invalide' }).positive('Montant > 0'),
  category:      z.string().min(1, 'Catégorie requise'),
  paymentMethod: z.string().min(1, 'Mode de paiement requis'),
  supplier:      z.string().optional(),
  frequency:     z.string().min(1, 'Fréquence requise'),
  dayOfMonth:    z.number({ invalid_type_error: 'Jour invalide' }).min(1).max(28),
  startDate:     z.string().min(1, 'Date de début requise'),
  endDate:       z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

function CreateRecurringDialog({ token, onClose }: { token: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSchema as any),
    defaultValues: {
      dayOfMonth: 1,
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateForm) =>
      recurringExpensesApi.create({
        label: data.label,
        amount: data.amount,
        category: data.category,
        paymentMethod: data.paymentMethod,
        supplier: data.supplier || undefined,
        frequency: data.frequency,
        dayOfMonth: data.dayOfMonth,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
      }, token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
      success('Dépense récurrente créée');
      onClose();
    },
    onError: () => showError('Erreur lors de la création'),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-foreground">Nouvelle dépense récurrente</h2>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Libellé</label>
            <Input placeholder="ex : Loyer cabinet" {...register('label')} />
            {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Montant (€)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="800.00"
                {...register('amount', { valueAsNumber: true })}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Jour du mois</label>
              <Input
                type="number"
                min="1"
                max="28"
                placeholder="1"
                {...register('dayOfMonth', { valueAsNumber: true })}
              />
              {errors.dayOfMonth && <p className="text-xs text-destructive">{errors.dayOfMonth.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Catégorie</label>
            <select
              {...register('category')}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Choisir…</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Fréquence</label>
              <select
                {...register('frequency')}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {Object.entries(FREQUENCY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {errors.frequency && <p className="text-xs text-destructive">{errors.frequency.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Mode paiement</label>
              <select
                {...register('paymentMethod')}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Début</label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Fin <span className="text-muted-foreground">(opt.)</span></label>
              <Input type="date" {...register('endDate')} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Fournisseur <span className="text-muted-foreground">(opt.)</span></label>
            <Input placeholder="ex : EDF" {...register('supplier')} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function RecurringRow({ item, token }: { item: RecurringExpenseRecord; token: string }) {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();

  const toggleMutation = useMutation({
    mutationFn: () =>
      recurringExpensesApi.update(item.id, { }, token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recurring-expenses'] });
      success(item.isActive ? 'Dépense suspendue' : 'Dépense réactivée');
    },
    onError: () => showError('Erreur'),
  });

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-surface/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
        {item.supplier && (
          <p className="text-xs text-muted-foreground">{item.supplier}</p>
        )}
      </div>
      <ExpenseCategoryBadge category={item.category} />
      <span className="text-sm font-semibold text-foreground w-20 text-right">
        {formatCurrency(item.amount)}
      </span>
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary">
        {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
      </span>
      {item.nextOccurrence && (
        <span className="text-xs text-muted-foreground w-24 text-right">
          {formatDate(item.nextOccurrence)}
        </span>
      )}
      <button
        onClick={() => toggleMutation.mutate()}
        disabled={toggleMutation.isPending}
        className={cn(
          'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
          item.isActive ? 'bg-primary' : 'bg-muted',
        )}
        aria-label={item.isActive ? 'Suspendre' : 'Réactiver'}
        title={item.isActive ? 'Actif — cliquer pour suspendre' : 'Suspendu — cliquer pour réactiver'}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            item.isActive ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </li>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface Props {
  token: string;
}

export function RecurringExpensesCard({ token }: Props) {
  const [showCreate, setShowCreate] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['recurring-expenses'],
    queryFn: () => recurringExpensesApi.list(token),
    enabled: !!token,
    staleTime: 60_000,
  });

  return (
    <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-primary" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">Dépenses récurrentes</h2>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="p-4 text-sm text-muted-foreground text-center">Chargement…</div>
      ) : !items?.length ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">Aucune dépense récurrente configurée.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Configurer une dépense récurrente
          </button>
        </div>
      ) : (
        <ul role="list" className="divide-y divide-border">
          {items.map((item) => (
            <RecurringRow key={item.id} item={item} token={token} />
          ))}
        </ul>
      )}

      {showCreate && (
        <CreateRecurringDialog token={token} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

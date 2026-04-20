'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { expensesApi, type ExpenseRecord } from '@/lib/api/expenses';
import { CATEGORY_OPTIONS } from './expense-category-badge';

const PAYMENT_METHODS = [
  { value: 'card',        label: 'Carte bancaire' },
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'cash',        label: 'Espèces' },
  { value: 'check',       label: 'Chèque' },
  { value: 'direct_debit',label: 'Prélèvement' },
  { value: 'other',       label: 'Autre' },
];

const LAST_PAYMENT_KEY = 'psylib_last_payment_method';

const schema = z.object({
  date:          z.string().min(1, 'Date requise'),
  label:         z.string().min(1, 'Libellé requis'),
  amount:        z.number({ invalid_type_error: 'Montant invalide' }).positive('Montant > 0'),
  category:      z.string().min(1, 'Catégorie requise'),
  paymentMethod: z.string().min(1, 'Mode de paiement requis'),
  supplier:      z.string().optional(),
  notes:         z.string().optional(),
  isDeductible:  z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  token: string;
  expense?: ExpenseRecord;
  onClose: () => void;
}

export function ExpenseFormDialog({ token, expense, onClose }: Props) {
  const qc = useQueryClient();
  const { success, error: showError } = useToast();
  const isEdit = !!expense;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    
    resolver: zodResolver(schema as any),
    defaultValues: {
      date:          expense?.date ?? new Date().toISOString().split('T')[0],
      label:         expense?.label ?? '',
      amount:        expense?.amount ?? undefined,
      category:      expense?.category ?? '',
      paymentMethod: expense?.paymentMethod ?? (typeof window !== 'undefined' ? (localStorage.getItem(LAST_PAYMENT_KEY) ?? 'card') : 'card'),
      supplier:      expense?.supplier ?? '',
      notes:         expense?.notes ?? '',
      isDeductible:  expense?.isDeductible ?? true,
    },
  });

  const isDeductible = watch('isDeductible');

  useEffect(() => {
    if (!isEdit && typeof window !== 'undefined') {
      const saved = localStorage.getItem(LAST_PAYMENT_KEY);
      if (saved) setValue('paymentMethod', saved);
    }
  }, [isEdit, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        date: data.date,
        label: data.label,
        amount: data.amount,
        category: data.category,
        paymentMethod: data.paymentMethod,
        supplier: data.supplier || undefined,
        notes: data.notes || undefined,
        isDeductible: data.isDeductible ?? true,
      };
      if (isEdit && expense) {
        return expensesApi.update(expense.id, payload, token);
      }
      return expensesApi.create(payload, token);
    },
    onSuccess: (_result, data) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LAST_PAYMENT_KEY, data.paymentMethod);
      }
      void qc.invalidateQueries({ queryKey: ['expenses'] });
      success(isEdit ? 'Dépense modifiée' : 'Dépense ajoutée');
      onClose();
    },
    onError: () => showError('Erreur lors de l\'enregistrement'),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-foreground">
          {isEdit ? 'Modifier la dépense' : 'Nouvelle dépense'}
        </h2>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {/* Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Date</label>
            <Input type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          {/* Label */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Libellé</label>
            <Input placeholder="ex : Loyer cabinet octobre" {...register('label')} />
            {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Montant (€)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="ex : 800.00"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Catégorie</label>
            <select
              {...register('category')}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Choisir une catégorie…</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          {/* Payment method */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Mode de paiement</label>
            <select
              {...register('paymentMethod')}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>}
          </div>

          {/* Supplier */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Fournisseur <span className="text-muted-foreground">(optionnel)</span></label>
            <Input placeholder="ex : EDF, SFR…" {...register('supplier')} />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Notes <span className="text-muted-foreground">(optionnel)</span></label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Remarques…"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {/* Deductible toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isDeductible}
              onClick={() => setValue('isDeductible', !isDeductible)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${isDeductible ? 'bg-primary' : 'bg-muted'}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isDeductible ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
            <span className="text-sm text-foreground">Déductible fiscalement</span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

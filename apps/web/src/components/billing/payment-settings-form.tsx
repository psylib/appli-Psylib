'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { PaymentMode } from '@psyscale/shared-types';
import type { ConnectSettings } from '@psyscale/shared-types';
import { billingApi } from '@/lib/api/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Save } from 'lucide-react';

const settingsSchema = z.object({
  paymentMode: z.nativeEnum(PaymentMode),
  defaultSessionRate: z.coerce.number().min(0, 'Le tarif doit être positif'),
  cancellationDelay: z.coerce.number().int(),
  autoRefund: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const PAYMENT_MODE_OPTIONS = [
  { value: PaymentMode.PREPAID, label: 'Prépaiement à la réservation' },
  { value: PaymentMode.POSTPAID, label: 'Paiement après séance' },
  { value: PaymentMode.BOTH, label: 'Les deux' },
] as const;

const CANCELLATION_OPTIONS = [
  { value: 24, label: '24 heures' },
  { value: 48, label: '48 heures' },
  { value: 72, label: '72 heures' },
] as const;

export function PaymentSettingsForm() {
  const { data: session } = useSession();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const { data: connectStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['connectStatus'],
    queryFn: () => billingApi.getConnectStatus(session!.accessToken),
    enabled: !!session?.accessToken,
    staleTime: 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    
    resolver: zodResolver(settingsSchema as any),
    defaultValues: {
      paymentMode: PaymentMode.BOTH,
      defaultSessionRate: 60,
      cancellationDelay: 48,
      autoRefund: true,
    },
  });

  const paymentMode = watch('paymentMode');
  const autoRefund = watch('autoRefund');

  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: (data: ConnectSettings) =>
      billingApi.updateConnectSettings(data, session!.accessToken),
    onSuccess: () => {
      success('Paramètres de paiement enregistrés.');
      void queryClient.invalidateQueries({ queryKey: ['connectStatus'] });
    },
    onError: () => {
      showError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    },
  });

  const onSubmit = (data: SettingsForm) => {
    saveSettings(data);
  };

  // Don't show form if Connect is not fully set up
  if (statusLoading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (!connectStatus?.chargesEnabled) {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-foreground mb-1">Paramètres de paiement</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Configurez le mode de paiement et les conditions d&apos;annulation.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Payment mode */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">
            Mode de paiement
          </legend>
          <div className="space-y-2">
            {PAYMENT_MODE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-surface transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  value={opt.value}
                  checked={paymentMode === opt.value}
                  onChange={() => setValue('paymentMode', opt.value, { shouldDirty: true })}
                  className="h-4 w-4 text-primary accent-[#3D52A0]"
                />
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.paymentMode && (
            <p className="text-xs text-destructive" role="alert">{errors.paymentMode.message}</p>
          )}
        </fieldset>

        {/* Default session rate */}
        <Input
          label="Tarif par défaut (€)"
          type="number"
          step="0.01"
          min={0}
          {...register('defaultSessionRate')}
          error={errors.defaultSessionRate?.message}
          hint="Ce tarif sera utilisé par défaut lors de la création d'un lien de paiement."
        />

        {/* Cancellation delay */}
        <div className="space-y-1.5">
          <label htmlFor="cancellationDelay" className="block text-sm font-medium text-foreground">
            Délai d&apos;annulation gratuite
          </label>
          <select
            id="cancellationDelay"
            {...register('cancellationDelay')}
            className="flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            {CANCELLATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.cancellationDelay && (
            <p className="text-xs text-destructive" role="alert">{errors.cancellationDelay.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Le patient peut annuler sans frais avant ce délai.
          </p>
        </div>

        {/* Auto refund */}
        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Remboursement automatique</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rembourser automatiquement en cas d&apos;annulation dans le délai autorisé.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoRefund}
            onClick={() => setValue('autoRefund', !autoRefund, { shouldDirty: true })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
              autoRefund ? 'bg-accent' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                autoRefund ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={isPending} disabled={!isDirty}>
            <Save size={16} aria-hidden />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}

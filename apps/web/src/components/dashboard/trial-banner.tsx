'use client';

import Link from 'next/link';
import { AlertTriangle, Zap, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/use-analytics';

interface TrialBannerProps {
  status: string;
  plan: string;
  trialDaysLeft: number | null;
}

export function TrialBanner({ status, plan, trialDaysLeft }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { track } = useAnalytics();

  if (dismissed) return null;

  // Cas 1 : trial actif proche de la fin (≤ 7 jours)
  if (status === 'trialing' && trialDaysLeft !== null && trialDaysLeft <= 7) {
    const urgent = trialDaysLeft <= 2;
    return (
      <div
        className={cn(
          'rounded-xl border p-4 flex items-center gap-4',
          urgent
            ? 'bg-red-50 border-red-200'
            : 'bg-amber-50 border-amber-200',
        )}
        role="alert"
      >
        <div
          className={cn(
            'p-2 rounded-lg flex-shrink-0',
            urgent ? 'bg-red-100' : 'bg-amber-100',
          )}
        >
          <AlertTriangle
            size={18}
            className={urgent ? 'text-red-600' : 'text-amber-600'}
            aria-hidden
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', urgent ? 'text-red-800' : 'text-amber-800')}>
            {trialDaysLeft === 0
              ? "Votre essai expire aujourd'hui"
              : trialDaysLeft === 1
              ? 'Votre essai expire demain'
              : `Votre essai expire dans ${trialDaysLeft} jours`}
          </p>
          <p className={cn('text-xs mt-0.5', urgent ? 'text-red-600' : 'text-amber-700')}>
            Passez au plan Pro pour conserver vos données et continuer à utiliser PsyLib sans interruption.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/dashboard/settings/billing"
            onClick={() => track('upgrade_clicked', { source: 'trial_banner', days_left: trialDaysLeft ?? 0 })}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              urgent
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white',
            )}
          >
            <Zap size={12} aria-hidden />
            Passer au Pro
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className={cn(
              'p-1 rounded-md hover:bg-black/10 transition-colors',
              urgent ? 'text-red-400' : 'text-amber-400',
            )}
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Cas 2 : paiement en échec
  if (status === 'past_due') {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-4"
        role="alert"
      >
        <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
          <AlertTriangle size={18} className="text-red-600" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800">
            Paiement en échec
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            Votre abonnement est suspendu. Mettez à jour votre moyen de paiement pour continuer.
          </p>
        </div>
        <Link
          href="/dashboard/settings/billing"
          onClick={() => track('upgrade_clicked', { source: 'past_due_banner' })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex-shrink-0"
        >
          Mettre à jour
        </Link>
      </div>
    );
  }

  // Plan free sans abonnement actif
  if (plan === 'free' && status !== 'trialing') {
    return (
      <div
        className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4"
        role="alert"
      >
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Zap size={18} className="text-primary" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Passez au plan Pro
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Patients illimités, séances illimitées, IA illimitée — 40€/mois.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/dashboard/settings/billing"
            onClick={() => track('upgrade_clicked', { source: 'free_plan_banner' })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            <Zap size={12} aria-hidden />
            Découvrir Pro
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-md hover:bg-black/10 transition-colors text-muted-foreground"
            aria-label="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

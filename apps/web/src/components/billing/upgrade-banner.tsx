'use client';

import { AlertTriangle } from 'lucide-react';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { Button } from '@/components/ui/button';
import { useCreateCheckout } from '@/hooks/use-billing';
import { useAnalytics } from '@/hooks/use-analytics';

type LimitReason = 'patients_limit' | 'sessions_limit' | 'ai_limit';

const MESSAGES: Record<LimitReason, string> = {
  patients_limit: 'Vous avez atteint la limite de patients de votre plan.',
  sessions_limit: 'Vous avez atteint la limite de séances mensuelle.',
  ai_limit: 'Vous avez épuisé vos résumés IA ce mois-ci.',
};

interface UpgradeBannerProps {
  reason: LimitReason;
  currentPlan?: SubscriptionPlan;
}

export function UpgradeBanner({ reason, currentPlan }: UpgradeBannerProps) {
  const { mutate: checkout, isPending } = useCreateCheckout();
  const { track } = useAnalytics();

  const targetPlan =
    currentPlan === SubscriptionPlan.FREE || !currentPlan
      ? SubscriptionPlan.STARTER
      : SubscriptionPlan.PRO;

  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center gap-3"
    >
      <AlertTriangle
        size={20}
        className="text-amber-600 flex-shrink-0"
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-900">{MESSAGES[reason]}</p>
        <p className="text-xs text-amber-700 mt-0.5">
          Passez au plan{' '}
          {targetPlan === SubscriptionPlan.STARTER ? 'Solo (25€/mois)' : 'Pro (50€/mois)'}{' '}
          pour continuer.
        </p>
      </div>
      <Button
        size="sm"
        variant="default"
        onClick={() => {
          track('upgrade_clicked', { plan: targetPlan, from_plan: currentPlan ?? 'free', source: reason });
          checkout(targetPlan);
        }}
        loading={isPending}
        className="flex-shrink-0"
      >
        Mettre à niveau
      </Button>
    </div>
  );
}

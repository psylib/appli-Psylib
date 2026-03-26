'use client';

import { Check, Zap } from 'lucide-react';
import { SubscriptionPlan, PLAN_PRICES, PLAN_LIMITS } from '@psyscale/shared-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCreateCheckout } from '@/hooks/use-billing';
import { useAnalytics } from '@/hooks/use-analytics';
import type { SubscriptionDetails } from '@/lib/api/billing';

const PLAN_FEATURES: Record<string, string[]> = {
  [SubscriptionPlan.FREE]: [
    '5 patients',
    '10 séances / mois',
    'Support email',
  ],
  [SubscriptionPlan.STARTER]: [
    '40 patients',
    '40 séances / mois',
    '10 résumés IA / mois',
    'Support email',
  ],
  [SubscriptionPlan.PRO]: [
    'Patients illimités',
    'Séances illimitées',
    '100 résumés IA / mois',
    'Analytics avancées',
    'Support prioritaire',
  ],
  [SubscriptionPlan.CLINIC]: [
    'Patients illimités',
    'Séances illimitées',
    'IA illimitée',
    'Multi-praticiens',
    'Formations illimitées',
    'Support dédié',
  ],
};

const PLAN_LABELS: Record<string, string> = {
  [SubscriptionPlan.FREE]: 'Gratuit',
  [SubscriptionPlan.STARTER]: 'Starter',
  [SubscriptionPlan.PRO]: 'Pro',
  [SubscriptionPlan.CLINIC]: 'Clinic',
};

interface PlanSelectorProps {
  subscription: SubscriptionDetails | undefined;
}

export function PlanSelector({ subscription }: PlanSelectorProps) {
  const { mutate: checkout, isPending } = useCreateCheckout();
  const { track } = useAnalytics();
  const currentPlan = subscription?.plan ?? SubscriptionPlan.FREE;

  const plans = [SubscriptionPlan.STARTER, SubscriptionPlan.PRO, SubscriptionPlan.CLINIC];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const isCurrentPlan = plan === currentPlan;
        const isRecommended = plan === SubscriptionPlan.PRO;
        const price = PLAN_PRICES[plan];
        const features = PLAN_FEATURES[plan] ?? [];

        return (
          <div
            key={plan}
            className={cn(
              'relative rounded-xl border-2 p-6 transition-shadow',
              isRecommended
                ? 'border-primary shadow-lg shadow-primary/10'
                : 'border-border hover:border-primary/30',
              isCurrentPlan && 'bg-primary/5',
            )}
          >
            {isRecommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white">
                  <Zap size={10} aria-hidden /> Recommandé
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">{PLAN_LABELS[plan]}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{price}€</span>
                  <span className="text-sm text-muted-foreground">/mois</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">14 jours d&apos;essai gratuit</p>
              </div>

              <ul className="space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <Check
                      size={14}
                      className={cn('flex-shrink-0', isRecommended ? 'text-primary' : 'text-accent')}
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={isRecommended ? 'default' : 'outline'}
                disabled={isCurrentPlan || isPending}
                loading={isPending}
                onClick={() => {
                  track('upgrade_clicked', { plan, from_plan: currentPlan, source: 'billing_page' });
                  checkout(plan);
                }}
              >
                {isCurrentPlan ? 'Plan actuel' : `Choisir ${PLAN_LABELS[plan]}`}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

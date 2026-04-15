'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import { SubscriptionPlan } from '@psyscale/shared-types';
import { useSubscription, useInvoices } from '@/hooks/use-billing';
import { useToast } from '@/components/ui/toast';
import { PlanSelector } from './plan-selector';
import { CurrentSubscriptionCard } from './current-subscription-card';
import { InvoicesTable } from './invoices-table';
import { Skeleton } from '@/components/ui/skeleton';

export function BillingPage() {
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices, isLoading: invLoading } = useInvoices();
  const searchParams = useSearchParams();
  const { success, error } = useToast();

  // Feedback après retour Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      success('Abonnement activé ! Bienvenue sur PsyLib 🎉');
    }
    if (searchParams.get('canceled') === 'true') {
      error('Abonnement non complété. Vous pouvez réessayer à tout moment.');
    }
  }, [searchParams, success, error]);

  const isFreePlan =
    !subscription || subscription.plan === SubscriptionPlan.FREE;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Abonnement</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez votre plan et consultez l&apos;historique de facturation.
        </p>
      </div>

      {/* État abonnement courant */}
      <section aria-labelledby="current-plan-title">
        <h2 id="current-plan-title" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <CreditCard size={14} aria-hidden />
          Plan actuel
        </h2>
        {subLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : subscription ? (
          <CurrentSubscriptionCard subscription={subscription} />
        ) : (
          <div className="rounded-xl border border-border bg-white p-6 text-sm text-muted-foreground">
            Aucun abonnement actif. Choisissez un plan ci-dessous.
          </div>
        )}
      </section>

      {/* Choix de plan */}
      {isFreePlan && (
        <section aria-labelledby="plans-title">
          <h2 id="plans-title" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} aria-hidden />
            Choisir un plan
          </h2>
          <PlanSelector subscription={subscription} />
          <p className="text-xs text-muted-foreground text-center mt-4">
            Gratuit pour toujours · Sans engagement · Annulation possible à tout moment
          </p>
        </section>
      )}

      {/* Upgrade depuis plan payant */}
      {!isFreePlan && (
        <section aria-labelledby="upgrade-title">
          <h2 id="upgrade-title" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} aria-hidden />
            Changer de plan
          </h2>
          <PlanSelector subscription={subscription} />
        </section>
      )}

      {/* Historique factures */}
      <section aria-labelledby="invoices-title">
        <h2 id="invoices-title" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <FileText size={14} aria-hidden />
          Historique des factures
        </h2>
        {invLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <InvoicesTable invoices={invoices ?? []} />
        )}
      </section>
    </div>
  );
}

'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { CreditCard, ArrowRight, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { ConnectOnboardingCard } from '@/components/billing/connect-onboarding-card';
import { PaymentSettingsForm } from '@/components/billing/payment-settings-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function PaymentsSettingsContent() {
  const { isPro, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // If not Pro or above, show upsell
  if (!isPro) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Paiements en ligne</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acceptez les paiements de vos patients via Stripe.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-8 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles size={24} className="text-primary" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Fonctionnalité Pro
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Le paiement en ligne est disponible a partir du plan Pro.
            Encaissez vos seances automatiquement et simplifiez votre gestion.
          </p>
          <Link href="/dashboard/settings/billing">
            <Button>
              <ArrowRight size={16} aria-hidden />
              Passer au plan Pro
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Paiements en ligne</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez Stripe Connect pour accepter les paiements de vos patients.
        </p>
      </div>

      <section aria-labelledby="connect-title">
        <h2 id="connect-title" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <CreditCard size={14} aria-hidden />
          Compte Stripe
        </h2>
        <ConnectOnboardingCard />
      </section>

      <section aria-labelledby="settings-title">
        <h2 id="settings-title" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <CreditCard size={14} aria-hidden />
          Configuration
        </h2>
        <PaymentSettingsForm />
      </section>
    </div>
  );
}

export default function PaymentsSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      }
    >
      <PaymentsSettingsContent />
    </Suspense>
  );
}

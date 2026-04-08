'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { CheckCircle2, ExternalLink, Landmark } from 'lucide-react';
import { billingApi } from '@/lib/api/billing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function ConnectOnboardingCard() {
  const { data: session } = useSession();

  const { data: status, isLoading } = useQuery({
    queryKey: ['connectStatus'],
    queryFn: () => billingApi.getConnectStatus(session!.accessToken),
    enabled: !!session?.accessToken,
    staleTime: 60 * 1000,
  });

  const [error, setError] = useState<string | null>(null);

  const { mutate: startOnboarding, isPending } = useMutation({
    mutationFn: () => billingApi.startConnectOnboarding(session!.accessToken),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err: Error) => {
      setError(err.message || 'Une erreur est survenue lors de la connexion à Stripe.');
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-11 w-44" />
      </div>
    );
  }

  const isOnboarded = status?.chargesEnabled && status?.detailsSubmitted;

  if (!isOnboarded) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Landmark size={20} className="text-primary" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Connectez votre compte bancaire</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configurez Stripe Connect pour recevoir les paiements de vos patients directement sur votre compte.
            </p>
          </div>
        </div>
        <Button onClick={() => { setError(null); startOnboarding(); }} loading={isPending}>
          <ExternalLink size={16} aria-hidden />
          Connecter mon compte
        </Button>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/10 p-2.5">
            <Landmark size={20} className="text-accent" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Compte Stripe Connect</h3>
            <Badge variant="success" className="mt-1">
              <CheckCircle2 size={12} className="mr-1" aria-hidden />
              Compte Stripe actif
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm">
          {status.chargesEnabled ? (
            <CheckCircle2 size={14} className="text-accent" aria-hidden />
          ) : (
            <span className="h-3.5 w-3.5 rounded-full bg-amber-400" />
          )}
          <span className={status.chargesEnabled ? 'text-foreground' : 'text-muted-foreground'}>
            Paiements {status.chargesEnabled ? 'actifs' : 'en attente'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {status.payoutsEnabled ? (
            <CheckCircle2 size={14} className="text-accent" aria-hidden />
          ) : (
            <span className="h-3.5 w-3.5 rounded-full bg-amber-400" />
          )}
          <span className={status.payoutsEnabled ? 'text-foreground' : 'text-muted-foreground'}>
            Virements {status.payoutsEnabled ? 'actifs' : 'en attente'}
          </span>
        </div>
      </div>
    </div>
  );
}

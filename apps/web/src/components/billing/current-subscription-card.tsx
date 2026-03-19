'use client';

import { CreditCard, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SubscriptionPlan, SubscriptionStatus } from '@psyscale/shared-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCreatePortal } from '@/hooks/use-billing';
import type { SubscriptionDetails } from '@/lib/api/billing';

const PLAN_LABELS: Record<string, string> = {
  [SubscriptionPlan.FREE]: 'Gratuit',
  [SubscriptionPlan.STARTER]: 'Starter',
  [SubscriptionPlan.PRO]: 'Pro',
  [SubscriptionPlan.CLINIC]: 'Clinic',
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'error'; icon: typeof CheckCircle2 }> = {
  [SubscriptionStatus.ACTIVE]: { label: 'Actif', variant: 'success', icon: CheckCircle2 },
  [SubscriptionStatus.TRIALING]: { label: 'Essai gratuit', variant: 'success', icon: CheckCircle2 },
  [SubscriptionStatus.PAST_DUE]: { label: 'Paiement en retard', variant: 'warning', icon: AlertTriangle },
  [SubscriptionStatus.CANCELED]: { label: 'Annulé', variant: 'error', icon: AlertTriangle },
};

interface CurrentSubscriptionCardProps {
  subscription: SubscriptionDetails;
}

export function CurrentSubscriptionCard({ subscription }: CurrentSubscriptionCardProps) {
  const { mutate: openPortal, isPending } = useCreatePortal();
  const statusConfig = STATUS_CONFIG[subscription.status] ?? STATUS_CONFIG[SubscriptionStatus.ACTIVE]!;
  const StatusIcon = statusConfig.icon;

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return null;
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <CreditCard size={20} className="text-primary" aria-hidden />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Plan {PLAN_LABELS[subscription.plan] ?? subscription.plan}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <StatusIcon
                size={13}
                className={cn(
                  statusConfig.variant === 'success' && 'text-accent',
                  statusConfig.variant === 'warning' && 'text-amber-500',
                  statusConfig.variant === 'error' && 'text-destructive',
                )}
                aria-hidden
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  statusConfig.variant === 'success' && 'text-accent',
                  statusConfig.variant === 'warning' && 'text-amber-600',
                  statusConfig.variant === 'error' && 'text-destructive',
                )}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {subscription.plan !== SubscriptionPlan.FREE && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openPortal()}
            loading={isPending}
          >
            Gérer l&apos;abonnement
          </Button>
        )}
      </div>

      {/* Informations période */}
      {subscription.currentPeriodEnd && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar size={14} aria-hidden />
          {subscription.cancelAtPeriodEnd ? (
            <span>
              Annulation le{' '}
              <strong className="text-destructive">
                {formatDate(subscription.currentPeriodEnd)}
              </strong>
            </span>
          ) : (
            <span>
              Prochain renouvellement le{' '}
              <strong className="text-foreground">
                {formatDate(subscription.currentPeriodEnd)}
              </strong>
            </span>
          )}
        </div>
      )}

      {/* Essai en cours */}
      {subscription.trialEndsAt && subscription.status === SubscriptionStatus.TRIALING && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
          <p className="font-medium text-primary">
            Période d&apos;essai jusqu&apos;au {formatDate(subscription.trialEndsAt)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aucun débit avant la fin de l&apos;essai. Annulation possible à tout moment.
          </p>
        </div>
      )}

      {/* Alerte paiement en retard */}
      {subscription.status === SubscriptionStatus.PAST_DUE && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-sm">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="font-medium text-amber-900">Paiement en attente</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Mettez à jour votre moyen de paiement pour conserver l&apos;accès à toutes les fonctionnalités.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

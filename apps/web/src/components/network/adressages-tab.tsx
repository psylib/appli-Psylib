'use client';

import {
  AlertCircle,
  Loader2,
  Send,
  Check,
  X,
} from 'lucide-react';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  type Referral,
  REFERRAL_STATUS_LABELS,
  REFERRAL_STATUS_COLORS,
} from '@/lib/api/network';

// ─── Referral item ───────────────────────────────────────────────────────────

interface ReferralItemProps {
  referral: Referral;
  direction: 'sent' | 'received';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  loadingId: string | null;
}

function ReferralItem({ referral, direction, onAccept, onDecline, loadingId }: ReferralItemProps) {
  const colors = REFERRAL_STATUS_COLORS[referral.status];
  const label = REFERRAL_STATUS_LABELS[referral.status];
  const psy = direction === 'sent' ? referral.toPsy : referral.fromPsy;
  const isLoading = loadingId === referral.id;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white hover:bg-surface/50 transition-colors">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
        {psy ? getInitials(psy.name) : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{psy?.name ?? 'Inconnu'}</p>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
              colors.bg,
              colors.text,
              colors.border,
            )}
          >
            {label}
          </span>
        </div>
        {referral.patientInitials && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Patient : {referral.patientInitials}
          </p>
        )}
        {referral.reason && (
          <p className="text-xs text-muted-foreground line-clamp-1">{referral.reason}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(referral.createdAt)}
        </p>
      </div>

      {direction === 'received' && referral.status === 'pending' && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onAccept?.(referral.id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
            aria-label="Accepter"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDecline?.(referral.id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
            aria-label="Décliner"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AdressagesTabProps {
  sentReferrals: Referral[];
  receivedReferrals: Referral[];
  loading: boolean;
  error: string | null;
  loadingReferralId: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onRetry: () => void;
  onGoToAnnuaire: () => void;
}

export function AdressagesTab({
  sentReferrals,
  receivedReferrals,
  loading,
  error,
  loadingReferralId,
  onAccept,
  onDecline,
  onRetry,
  onGoToAnnuaire,
}: AdressagesTabProps) {
  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
          <Loader2 size={20} className="animate-spin" aria-hidden />
          <span className="text-sm">Chargement des adressages...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertCircle size={18} aria-hidden />
          <div>
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="text-xs underline mt-0.5 hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Received */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Adressages reçus
                {receivedReferrals.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({receivedReferrals.length})
                  </span>
                )}
              </h2>
              {receivedReferrals.filter((r) => r.status === 'pending').length > 0 && (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  {receivedReferrals.filter((r) => r.status === 'pending').length} en attente
                </span>
              )}
            </div>
            {receivedReferrals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun adressage reçu pour l&apos;instant.
              </p>
            ) : (
              <div className="space-y-2">
                {receivedReferrals.map((referral) => (
                  <ReferralItem
                    key={referral.id}
                    referral={referral}
                    direction="received"
                    onAccept={onAccept}
                    onDecline={onDecline}
                    loadingId={loadingReferralId}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sent */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Adressages envoyés
              {sentReferrals.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({sentReferrals.length})
                </span>
              )}
            </h2>
            {sentReferrals.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Send size={32} className="text-muted-foreground/40" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Vous n&apos;avez pas encore envoyé d&apos;adressage.
                </p>
                <Button size="sm" variant="outline" onClick={onGoToAnnuaire}>
                  Parcourir l&apos;annuaire
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sentReferrals.map((referral) => (
                  <ReferralItem
                    key={referral.id}
                    referral={referral}
                    direction="sent"
                    loadingId={loadingReferralId}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Banknote, RotateCcw, Coins, CreditCard, Building2, ArrowRightLeft, MoreHorizontal, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PaymentBadge } from '@/components/billing/payment-badge';
import { useToast } from '@/components/ui/toast';
import { billingApi } from '@/lib/api/billing';
import { Dialog } from '@/components/ui/dialog';

const OFFLINE_METHODS = [
  { value: 'cash', label: 'Especes', icon: Coins },
  { value: 'check', label: 'Cheque', icon: Banknote },
  { value: 'card', label: 'Carte bancaire', icon: CreditCard },
  { value: 'transfer', label: 'Virement', icon: ArrowRightLeft },
  { value: 'other', label: 'Autre', icon: MoreHorizontal },
] as const;

interface PaymentActionsAppointment {
  id: string;
  bookingPaymentStatus?: 'none' | 'pending_payment' | 'paid' | 'payment_failed' | string;
  paidOnline?: boolean;
  paymentIntentId?: string;
  paymentAmount?: number | null;
  cardHoldStatus?: 'none' | 'pending' | 'secured' | 'captured' | 'released' | 'failed' | string;
}

interface PaymentActionsProps {
  appointment: PaymentActionsAppointment;
  compact?: boolean;
}

export function PaymentActions({ appointment, compact = false }: PaymentActionsProps) {
  const { data: session } = useSession();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);
  const [showPaymentMethodPicker, setShowPaymentMethodPicker] = useState(false);
  const [showCaptureDialog, setShowCaptureDialog] = useState(false);
  const [captureAmount, setCaptureAmount] = useState<number>(appointment.paymentAmount ?? 0);

  // Resynchronise le montant par défaut quand le composant est réutilisé pour un autre RDV
  useEffect(() => {
    setCaptureAmount(appointment.paymentAmount ?? 0);
  }, [appointment.id, appointment.paymentAmount]);
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);

  const paymentLinkMutation = useMutation({
    mutationFn: () =>
      billingApi.createPaymentLink(
        { appointmentId: appointment.id, amount: appointment.paymentAmount ?? undefined },
        session!.accessToken,
      ),
    onSuccess: (data) => {
      success('Lien de paiement cree avec succes.');
      // Copy checkout URL to clipboard
      void navigator.clipboard.writeText(data.checkoutUrl).catch(() => {
        // Clipboard not available — user can still see the toast
      });
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: () => {
      showError('Impossible de creer le lien de paiement.');
    },
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      billingApi.refund(appointment.id, session!.accessToken),
    onSuccess: () => {
      success('Remboursement effectue avec succes.');
      setShowRefundConfirm(false);
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: () => {
      showError('Erreur lors du remboursement.');
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (method: string) =>
      billingApi.markPaidOnSite(appointment.id, session!.accessToken, method),
    onSuccess: () => {
      success('Marque comme paye sur place.');
      setShowPaymentMethodPicker(false);
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: () => {
      showError('Erreur lors de la mise a jour.');
    },
  });

  const captureImprintMutation = useMutation({
    mutationFn: (amount: number) =>
      billingApi.captureImprint(appointment.id, amount, session!.accessToken),
    onSuccess: (data) => {
      setShowCaptureDialog(false);
      if (data.fallbackLink) {
        success('La carte nécessite une validation : un lien de paiement a été envoyé au patient.');
      } else {
        success('Paiement encaissé.');
      }
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: () => {
      showError('Erreur lors de l\'encaissement.');
    },
  });

  const releaseImprintMutation = useMutation({
    mutationFn: () =>
      billingApi.releaseImprint(appointment.id, session!.accessToken),
    onSuccess: () => {
      success('Empreinte libérée.');
      setShowReleaseConfirm(false);
      void queryClient.invalidateQueries({ queryKey: ['appointments'] });
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: () => {
      showError('Erreur lors de la libération de l\'empreinte.');
    },
  });

  const status = appointment.bookingPaymentStatus;
  const isPaid = status === 'paid';
  const isPending = status === 'pending_payment';
  const isNone = !status || status === 'none';

  // Map booking payment status to PaymentBadge status
  const badgeStatus = isPaid
    ? 'paid'
    : isPending
      ? 'pending'
      : status === 'payment_failed'
        ? 'failed'
        : '';

  const cardHold = appointment.cardHoldStatus;
  const isImprintSecured = cardHold === 'secured';
  const isImprintPending = cardHold === 'pending';

  const buttonSize = compact ? 'sm' as const : 'default' as const;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status badge */}
      {badgeStatus && <PaymentBadge status={badgeStatus} />}

      {/* Send payment link — when no payment initiated */}
      {isNone && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => paymentLinkMutation.mutate()}
          loading={paymentLinkMutation.isPending}
          disabled={!session?.accessToken}
        >
          <Send size={14} aria-hidden />
          {!compact && 'Envoyer lien de paiement'}
          {compact && 'Lien paiement'}
        </Button>
      )}

      {/* Pending payment — disabled info badge */}
      {isPending && (
        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          Lien envoye
        </span>
      )}

      {/* Refund — only if paid online */}
      {isPaid && appointment.paidOnline && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => setShowRefundConfirm(true)}
          className="text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          <RotateCcw size={14} aria-hidden />
          Rembourser
        </Button>
      )}

      {/* Mark paid on site — when not yet paid */}
      {!isPaid && !showPaymentMethodPicker && (
        <Button
          variant="secondary"
          size={buttonSize}
          onClick={() => setShowPaymentMethodPicker(true)}
          disabled={!session?.accessToken}
        >
          <Banknote size={14} aria-hidden />
          {!compact && 'Paye sur place'}
          {compact && 'Sur place'}
        </Button>
      )}

      {/* Payment method picker */}
      {showPaymentMethodPicker && (
        <div className="flex items-center gap-1 flex-wrap">
          {OFFLINE_METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.value}
                type="button"
                onClick={() => markPaidMutation.mutate(method.value)}
                disabled={markPaidMutation.isPending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-white hover:bg-surface hover:border-primary/30 transition-colors disabled:opacity-50"
                title={method.label}
              >
                <Icon size={12} />
                {method.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowPaymentMethodPicker(false)}
            className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      {/* Imprint status labels */}
      {isImprintPending && (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          <Lock size={11} aria-hidden />
          Empreinte en attente
        </span>
      )}
      {isImprintSecured && (
        <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
          <Lock size={11} aria-hidden />
          Empreinte enregistrée
        </span>
      )}

      {/* Imprint actions — only when secured */}
      {isImprintSecured && (
        <>
          <Button
            variant="outline"
            size={buttonSize}
            onClick={() => {
              setCaptureAmount(appointment.paymentAmount ?? 0);
              setShowCaptureDialog(true);
            }}
            disabled={!session?.accessToken}
          >
            <CreditCard size={14} aria-hidden />
            Encaisser
          </Button>
          <Button
            variant="outline"
            size={buttonSize}
            onClick={() => setShowReleaseConfirm(true)}
            disabled={!session?.accessToken}
            className="text-muted-foreground"
          >
            <Unlock size={14} aria-hidden />
            {!compact && 'Libérer l\'empreinte'}
            {compact && 'Libérer'}
          </Button>
        </>
      )}

      {/* Refund confirmation dialog */}
      <ConfirmDialog
        open={showRefundConfirm}
        onClose={() => setShowRefundConfirm(false)}
        onConfirm={() => refundMutation.mutate()}
        title="Confirmer le remboursement"
        description="Le patient sera rembourse integralement. Cette action est irreversible."
        confirmLabel="Rembourser"
        variant="destructive"
        loading={refundMutation.isPending}
      />

      {/* Release imprint confirmation dialog */}
      <ConfirmDialog
        open={showReleaseConfirm}
        onClose={() => setShowReleaseConfirm(false)}
        onConfirm={() => releaseImprintMutation.mutate()}
        title="Libérer l'empreinte ?"
        description="Aucun montant ne sera débité. L'empreinte bancaire sera annulée."
        confirmLabel="Libérer"
        variant="destructive"
        loading={releaseImprintMutation.isPending}
      />

      {/* Capture amount dialog */}
      <Dialog
        open={showCaptureDialog}
        onClose={() => setShowCaptureDialog(false)}
        title="Encaisser l'empreinte"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="capture-amount" className="text-sm font-medium text-foreground">
              Montant à encaisser (€)
            </label>
            <input
              id="capture-amount"
              type="number"
              min={0.01}
              step="0.01"
              value={captureAmount}
              onChange={(e) => setCaptureAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCaptureDialog(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!captureAmount || captureAmount <= 0}
              loading={captureImprintMutation.isPending}
              onClick={() => captureImprintMutation.mutate(captureAmount)}
            >
              Encaisser {captureAmount > 0 ? `${captureAmount}€` : ''}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

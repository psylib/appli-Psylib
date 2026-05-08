'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Banknote, RotateCcw, Coins, CreditCard, Building2, ArrowRightLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PaymentBadge } from '@/components/billing/payment-badge';
import { useToast } from '@/components/ui/toast';
import { billingApi } from '@/lib/api/billing';

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
    </div>
  );
}

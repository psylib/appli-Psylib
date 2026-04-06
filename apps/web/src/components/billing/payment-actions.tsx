'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Banknote, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PaymentBadge } from '@/components/billing/payment-badge';
import { useToast } from '@/components/ui/toast';
import { billingApi } from '@/lib/api/billing';

interface PaymentActionsAppointment {
  id: string;
  bookingPaymentStatus?: 'none' | 'pending_payment' | 'paid' | 'payment_failed' | string;
  paidOnline?: boolean;
  paymentIntentId?: string;
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

  const paymentLinkMutation = useMutation({
    mutationFn: () =>
      billingApi.createPaymentLink(
        { appointmentId: appointment.id },
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
    mutationFn: () =>
      billingApi.markPaidOnSite(appointment.id, session!.accessToken),
    onSuccess: () => {
      success('Marque comme paye sur place.');
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
      {!isPaid && (
        <Button
          variant="secondary"
          size={buttonSize}
          onClick={() => markPaidMutation.mutate()}
          loading={markPaidMutation.isPending}
          disabled={!session?.accessToken}
        >
          <Banknote size={14} aria-hidden />
          {!compact && 'Paye sur place'}
          {compact && 'Sur place'}
        </Button>
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

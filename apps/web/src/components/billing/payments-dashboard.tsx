'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { LucideIcon } from 'lucide-react';
import {
  DollarSign,
  Clock,
  Hash,
  Globe,
  Banknote,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { billingApi } from '@/lib/api/billing';
import type { PaymentItem } from '@/lib/api/billing';
import { PaymentBadge } from './payment-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton, KpiCardSkeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Filters {
  from: string;
  to: string;
  status: string;
  mode: string;
  page: number;
}

export function PaymentsDashboard() {
  const { data: session } = useSession();
  const { success, error: showError } = useToast();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Filters>({
    from: '',
    to: '',
    status: '',
    mode: '',
    page: 1,
  });

  const [refundTarget, setRefundTarget] = useState<PaymentItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', filters],
    queryFn: () => billingApi.getPayments(filters, session!.accessToken),
    enabled: !!session?.accessToken,
    staleTime: 30 * 1000,
  });

  const { mutate: refund, isPending: isRefunding } = useMutation({
    mutationFn: (appointmentId: string) =>
      billingApi.refund(appointmentId, session!.accessToken),
    onSuccess: () => {
      success('Remboursement effectué avec succès.');
      setRefundTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    onError: () => {
      showError('Erreur lors du remboursement. Veuillez réessayer.');
    },
  });

  const kpis = data?.kpis;
  const payments = data?.payments ?? [];
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  const updateFilter = (key: keyof Filters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Paiements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Suivez les paiements de vos patients et gerez les remboursements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
            <KpiCardSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              label="Encaissé ce mois"
              value={formatCurrency((kpis?.totalReceived ?? 0) / 100)}
              icon={DollarSign}
              iconClassName="text-accent bg-accent/10"
            />
            <KpiCard
              label="En attente"
              value={formatCurrency((kpis?.totalPending ?? 0) / 100)}
              icon={Clock}
              iconClassName="text-amber-600 bg-amber-100"
            />
            <KpiCard
              label="Transactions"
              value={String(kpis?.transactionCount ?? 0)}
              icon={Hash}
              iconClassName="text-primary bg-primary/10"
            />
            <KpiCard
              label="Taux en ligne"
              value={`${kpis?.onlineRate ?? 0}%`}
              icon={TrendingUp}
              iconClassName="text-primary bg-primary/10"
            />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Input
            label="Du"
            type="date"
            value={filters.from}
            onChange={(e) => updateFilter('from', e.target.value)}
          />
        </div>
        <div className="w-40">
          <Input
            label="Au"
            type="date"
            value={filters.to}
            onChange={(e) => updateFilter('to', e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="filter-status" className="block text-sm font-medium text-foreground">
            Statut
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="flex h-11 rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <option value="">Tous</option>
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
            <option value="refunded">Remboursé</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="filter-mode" className="block text-sm font-medium text-foreground">
            Mode
          </label>
          <select
            id="filter-mode"
            value={filters.mode}
            onChange={(e) => updateFilter('mode', e.target.value)}
            className="flex h-11 rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <option value="">Tous</option>
            <option value="online">En ligne</option>
            <option value="on_site">Sur place</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Patient</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Montant</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Mode</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20 mx-auto" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    onRefund={() => setRefundTarget(payment)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {filters.page} sur {totalPages} ({data?.total ?? 0} résultats)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => updateFilter('page', filters.page - 1)}
              >
                <ChevronLeft size={16} aria-hidden />
                Précédent
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Suivant
                <ChevronRight size={16} aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Refund confirmation dialog */}
      <ConfirmDialog
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        onConfirm={() => {
          if (refundTarget?.appointment?.id) {
            refund(refundTarget.appointment.id);
          }
        }}
        title="Confirmer le remboursement"
        description={
          refundTarget
            ? `Rembourser ${formatCurrency(refundTarget.amount / 100)} à ${refundTarget.patient?.name ?? 'ce patient'} ? Cette action est irréversible.`
            : ''
        }
        confirmLabel="Rembourser"
        variant="destructive"
        loading={isRefunding}
      />
    </div>
  );
}

// --- Sub-components ---

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`rounded-lg p-2 ${iconClassName}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function PaymentRow({
  payment,
  onRefund,
}: {
  payment: PaymentItem;
  onRefund: () => void;
}) {
  const isOnline = !!payment.stripePaymentIntentId;
  const canRefund = payment.status === 'paid' && isOnline;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-surface/30 transition-colors">
      <td className="px-4 py-3 text-foreground">
        {formatDateTime(payment.createdAt)}
      </td>
      <td className="px-4 py-3">
        {payment.patient ? (
          <div>
            <p className="font-medium text-foreground">{payment.patient.name}</p>
            <p className="text-xs text-muted-foreground">{payment.patient.email}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-right font-medium text-foreground">
        {formatCurrency(payment.amount / 100)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          {isOnline ? (
            <>
              <Globe size={14} aria-hidden />
              <span>En ligne</span>
            </>
          ) : (
            <>
              <Banknote size={14} aria-hidden />
              <span>Sur place</span>
            </>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <PaymentBadge status={payment.status} />
      </td>
      <td className="px-4 py-3 text-right">
        {canRefund && (
          <Button variant="ghost" size="sm" onClick={onRefund}>
            Rembourser
          </Button>
        )}
      </td>
    </tr>
  );
}

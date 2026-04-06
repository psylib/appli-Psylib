'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Receipt, Plus, Download, Send, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/empty-state';
import { PatientRowSkeleton } from '@/components/ui/skeleton';
import { invoicesApi, type InvoiceRecord } from '@/lib/api/invoices';
import { patientsApi } from '@/lib/api/patients';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

// ─── Schema ───────────────────────────────────────────────────────────────────

const createSchema = z.object({
  patientId: z.string().min(1, 'Sélectionnez un patient'),
  amountTtc: z.number({ invalid_type_error: 'Montant invalide' }).positive('Montant > 0'),
  issuedAt: z.string().min(1, 'Date requise'),
});
type CreateForm = z.infer<typeof createSchema>;

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-surface text-muted-foreground',
  sent: 'bg-primary/10 text-primary',
  paid: 'bg-accent/10 text-accent',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
};

// ─── Modal create ─────────────────────────────────────────────────────────────

function CreateInvoiceModal({
  token,
  onClose,
}: {
  token: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const { data: patients } = useQuery({
    queryKey: ['patients', 'all'],
    queryFn: () => patientsApi.list({ limit: 200 }, token),
    enabled: !!token,
    staleTime: 30_000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSchema as any),
    defaultValues: {
      patientId: '',
      amountTtc: undefined,
      issuedAt: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateForm) =>
      invoicesApi.create(
        { patientId: data.patientId, sessions: [], amountTtc: data.amountTtc, issuedAt: data.issuedAt },
        token,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      success('Facture créée');
      onClose();
    },
    onError: () => error('Erreur lors de la création'),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <h2 className="text-lg font-bold text-foreground">Nouvelle facture</h2>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="space-y-4"
        >
          {/* Patient */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Patient</label>
            <select
              {...register('patientId')}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Choisir un patient…</option>
              {patients?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-xs text-destructive">{errors.patientId.message}</p>
            )}
          </div>

          {/* Montant */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Montant TTC (€)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="ex : 60.00"
              {...register('amountTtc', { valueAsNumber: true })}
            />
            {errors.amountTtc && (
              <p className="text-xs text-destructive">{errors.amountTtc.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Date d'émission</label>
            <Input type="date" {...register('issuedAt')} />
            {errors.issuedAt && (
              <p className="text-xs text-destructive">{errors.issuedAt.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function InvoiceRow({ invoice, token }: { invoice: InvoiceRecord; token: string }) {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const [downloading, setDownloading] = useState(false);

  const sendMutation = useMutation({
    mutationFn: () => invoicesApi.markAsSent(invoice.id, token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['invoices'] });
      success(`Facture ${invoice.invoiceNumber} envoyée au patient`);
    },
    onError: () => error("Erreur lors de l'envoi"),
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await invoicesApi.downloadPdf(invoice.id, invoice.invoiceNumber, token);
    } catch {
      error('Erreur téléchargement PDF');
    } finally {
      setDownloading(false);
    }
  };

  const dateFormatted = new Date(invoice.issuedAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const amountFormatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(invoice.amountTtc));

  return (
    <li className="flex items-center gap-4 px-5 py-4 hover:bg-surface/50 transition-colors">
      {/* Icon */}
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <FileText size={16} className="text-primary" aria-hidden />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground font-mono">
          {invoice.invoiceNumber}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {invoice.patient?.name ?? 'Patient'} · {dateFormatted}
        </p>
      </div>

      {/* Amount */}
      <p className="text-sm font-medium text-foreground w-20 text-right">{amountFormatted}</p>

      {/* Status */}
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium w-20 justify-center',
          STATUS_STYLES[invoice.status] ?? STATUS_STYLES['draft'],
        )}
      >
        {STATUS_LABELS[invoice.status] ?? invoice.status}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-1.5 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          title="Télécharger PDF"
        >
          {downloading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} aria-hidden />
          )}
        </button>
        {invoice.status === 'draft' && invoice.patient?.email && (
          <button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Envoyer par email au patient"
          >
            {sendMutation.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} aria-hidden />
            )}
          </button>
        )}
      </div>
    </li>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function InvoicesPageContent() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';
  const [showModal, setShowModal] = useState(false);

  const { data: invoices, isLoading, isError } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.list(token),
    enabled: !!token,
    staleTime: 30_000,
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {invoices ? `${invoices.length} facture${invoices.length !== 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} />
          Nouvelle facture
        </Button>
      </div>

      {/* Summary cards */}
      {invoices && invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {(['draft', 'sent', 'paid'] as const).map((s) => {
            const count = invoices.filter((i) => i.status === s).length;
            const total = invoices
              .filter((i) => i.status === s)
              .reduce((acc, i) => acc + Number(i.amountTtc), 0);
            return (
              <div key={s} className="rounded-xl border border-border bg-white p-4 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  {STATUS_LABELS[s]}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {count} facture{count !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <PatientRowSkeleton key={i} />)
        ) : isError ? (
          <div className="p-8 text-center text-sm text-destructive">Erreur de chargement</div>
        ) : !invoices?.length ? (
          <EmptyState
            icon={Receipt}
            title="Aucune facture"
            description="Créez votre première facture patient pour commencer"
            action={{ label: 'Créer une facture', onClick: () => setShowModal(true) }}
          />
        ) : (
          <>
            {/* Table header */}
            <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-surface">
              <div className="w-9 flex-shrink-0" />
              <p className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Facture
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20 text-right">
                Montant
              </p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20 text-center">
                Statut
              </p>
              <div className="w-16" />
            </div>
            <ul role="list" className="divide-y divide-border">
              {invoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} token={token} />
              ))}
            </ul>
          </>
        )}
      </div>

      {showModal && <CreateInvoiceModal token={token} onClose={() => setShowModal(false)} />}
    </div>
  );
}

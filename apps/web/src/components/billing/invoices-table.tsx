'use client';

import { FileText, ExternalLink, Download } from 'lucide-react';
import { cn, formatDateUnix } from '@/lib/utils';
import type { InvoiceItem } from '@/lib/api/billing';

interface InvoicesTableProps {
  invoices: InvoiceItem[];
}

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-accent/10 text-accent',
  open: 'bg-amber-100 text-amber-700',
  draft: 'bg-surface text-muted-foreground',
  void: 'bg-surface text-muted-foreground',
  uncollectible: 'bg-destructive/10 text-destructive',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Payée',
  open: 'En attente',
  draft: 'Brouillon',
  void: 'Annulée',
  uncollectible: 'Irrécupérable',
};

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center">
        <FileText size={32} className="text-muted-foreground mx-auto mb-3" aria-hidden />
        <p className="text-sm font-medium text-foreground">Aucune facture</p>
        <p className="text-xs text-muted-foreground mt-1">
          Vos factures apparaîtront ici après votre premier paiement.
        </p>
      </div>
    );
  }

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const formatDate = (unix: number) => formatDateUnix(unix);

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Numéro
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Date
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Montant
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Statut
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice, idx) => (
            <tr
              key={invoice.id}
              className={cn(
                'border-b border-border last:border-0 hover:bg-surface/50 transition-colors',
                idx % 2 === 0 ? 'bg-white' : 'bg-surface/20',
              )}
            >
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {invoice.number ?? invoice.id.slice(0, 8)}
              </td>
              <td className="px-4 py-3 text-foreground">{formatDate(invoice.date)}</td>
              <td className="px-4 py-3 font-medium text-foreground">
                {formatAmount(invoice.amountPaid)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                    STATUS_STYLES[invoice.status ?? 'draft'] ?? STATUS_STYLES['draft'],
                  )}
                >
                  {STATUS_LABELS[invoice.status ?? 'draft'] ?? invoice.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {invoice.hostedInvoiceUrl && (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      aria-label="Voir la facture"
                    >
                      <ExternalLink size={12} aria-hidden />
                      Voir
                    </a>
                  )}
                  {invoice.invoicePdf && (
                    <a
                      href={invoice.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Télécharger le PDF"
                    >
                      <Download size={12} aria-hidden />
                      PDF
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

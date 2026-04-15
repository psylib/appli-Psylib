'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, Check, ClipboardList } from 'lucide-react';
import { accountingApi } from '@/lib/api/accounting';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

function buildYearOptions(): number[] {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2];
}

// ─── TaxLine ─────────────────────────────────────────────────────────────────

function TaxLine({
  code,
  label,
  amount,
  bold,
}: {
  code: string;
  label: string;
  amount: number;
  bold?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(amount.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {code && (
          <span className="text-xs font-mono bg-surface px-1.5 py-0.5 rounded text-muted-foreground flex-shrink-0">
            {code}
          </span>
        )}
        <span className={cn('text-sm text-foreground truncate', bold && 'font-bold')}>{label}</span>
      </div>
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <span className={cn('text-sm font-medium tabular-nums', bold && 'font-bold')}>
          {formatCurrency(amount)}
        </span>
        <button
          onClick={handleCopy}
          title="Copier le montant"
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          aria-label={`Copier ${formatCurrency(amount)}`}
        >
          {copied ? (
            <Check size={12} className="text-accent" />
          ) : (
            <Copy size={12} />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TaxPrepSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-100 rounded w-40" />
        <div className="h-8 bg-slate-100 rounded w-24" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-1.5">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TaxPrepPanel({ token }: { token: string }) {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const yearOptions = buildYearOptions();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounting-tax-prep', year],
    queryFn: () => accountingApi.getTaxPrep(token, year),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <TaxPrepSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Préparation 2035</h2>
            <p className="text-xs text-muted-foreground">Aide au remplissage de la déclaration 2035</p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">Impossible de charger les données fiscales pour {year}.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0 mt-0.5">
            <ClipboardList size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Préparation 2035</h2>
            <p className="text-xs text-muted-foreground">Aide au remplissage de la déclaration 2035 — exercice {year}</p>
          </div>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Income lines */}
      <div className="space-y-0 border border-border rounded-lg divide-y divide-border/50 px-3">
        <div className="py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recettes</p>
        </div>
        <TaxLine code="AA" label="Recettes encaissées" amount={data.totalRevenue} />
      </div>

      {/* Expense lines */}
      <div className="space-y-0 border border-border rounded-lg divide-y divide-border/50 px-3">
        <div className="py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dépenses déductibles</p>
        </div>
        <TaxLine code="BG" label="Total dépenses déductibles" amount={data.totalDeductibleExpenses} />
        <TaxLine code="CP" label="Charges sociales URSSAF" amount={data.estimatedSocialCharges} />
      </div>

      {/* Taxable income */}
      <div className="border border-border rounded-lg divide-y divide-border/50 px-3">
        <div className="py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Résultat</p>
        </div>
        <TaxLine code="CF" label="Revenu imposable (bénéfice)" amount={data.taxableIncome} bold />
      </div>

      {/* Quarterly payments */}
      {data.quarterlyPayments && data.quarterlyPayments.length > 0 && (
        <div className="space-y-0 border border-border rounded-lg divide-y divide-border/50 px-3">
          <div className="py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Acomptes provisionnels
            </p>
          </div>
          {data.quarterlyPayments.map((q) => (
            <TaxLine
              key={q.quarter}
              code={q.quarter}
              label={`Acompte — échéance ${q.dueDate}`}
              amount={q.amount}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 italic">
          Ces données sont calculées automatiquement à titre indicatif. Vérifiez auprès de votre expert-comptable avant de déposer votre déclaration. PsyLib ne se substitue pas à un conseil fiscal professionnel.
        </p>
      </div>
    </div>
  );
}

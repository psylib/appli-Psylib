'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calculator } from 'lucide-react';
import { accountingApi } from '@/lib/api/accounting';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

function buildYearOptions(): number[] {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2];
}

// ─── ChargesLine ─────────────────────────────────────────────────────────────

function ChargesLine({
  label,
  amount,
  bold,
}: {
  label: string;
  amount: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-sm', bold ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      <span className={cn('text-sm tabular-nums', bold ? 'font-bold text-foreground' : 'text-foreground')}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SocialChargesSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-slate-100 rounded w-56" />
        <div className="h-8 bg-slate-100 rounded w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="h-4 bg-slate-100 rounded w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 bg-slate-100 rounded w-32" />
              <div className="h-3 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="border border-border rounded-lg p-4 space-y-3">
          <div className="h-4 bg-slate-100 rounded w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 bg-slate-100 rounded w-32" />
              <div className="h-3 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Derived calculations from SocialChargesData ─────────────────────────────
// The API returns totalRevenue, urssafRate, urssafAmount, cfpRate, cfpAmount.
// We derive CIPAV and URSSAF line items using standard 2024 rates for liberal psychologists.

const URSSAF_RATES = {
  maladie: 0.066,
  allocationsFamiliales: 0.031,
  csgCrds: 0.097,
  cfp: 0.0025,
};

const CIPAV_RATES = {
  retraiteBase: 0.0885,
  retraiteComplementaire: 0.0245,
  invaliditeDeces: 0.004,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function SocialChargesCard({ token }: { token: string }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const yearOptions = buildYearOptions();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounting-social-charges', year],
    queryFn: () => accountingApi.getSocialCharges(token, year),
    enabled: !!token,
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <SocialChargesSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Estimation charges sociales</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-input rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          Impossible de charger les charges sociales pour {year}.
        </p>
      </div>
    );
  }

  // Compute line-level breakdown from total revenue (or from API amounts if available)
  const base = data.totalRevenue;

  const urssaf = {
    maladie: base * URSSAF_RATES.maladie,
    allocationsFamiliales: base * URSSAF_RATES.allocationsFamiliales,
    csgCrds: base * URSSAF_RATES.csgCrds,
    cfp: base * URSSAF_RATES.cfp,
    // Use API total if available (it may include abattements), otherwise sum
    total: data.urssafAmount > 0 ? data.urssafAmount : base * (URSSAF_RATES.maladie + URSSAF_RATES.allocationsFamiliales + URSSAF_RATES.csgCrds + URSSAF_RATES.cfp),
  };

  const cipav = {
    retraiteBase: base * CIPAV_RATES.retraiteBase,
    retraiteComplementaire: base * CIPAV_RATES.retraiteComplementaire,
    invaliditeDeces: base * CIPAV_RATES.invaliditeDeces,
    total: base * (CIPAV_RATES.retraiteBase + CIPAV_RATES.retraiteComplementaire + CIPAV_RATES.invaliditeDeces),
  };

  const total = data.totalCharges > 0 ? data.totalCharges : urssaf.total + cipav.total;
  const monthlyProvision = total / 12;
  const effectiveRate = base > 0 ? (total / base) * 100 : 0;

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-accent/10 rounded-lg flex-shrink-0 mt-0.5">
            <Calculator size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Estimation charges sociales</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Calcul basé sur les revenus {year} — taux libéral (URSSAF + CIPAV)
            </p>
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

      {/* Two columns: URSSAF + CIPAV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* URSSAF */}
        <div className="border border-border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">URSSAF</h3>
          <ChargesLine label="Maladie (6,6%)" amount={urssaf.maladie} />
          <ChargesLine label="Allocations familiales (3,1%)" amount={urssaf.allocationsFamiliales} />
          <ChargesLine label="CSG / CRDS (9,7%)" amount={urssaf.csgCrds} />
          <ChargesLine label="CFP (0,25%)" amount={urssaf.cfp} />
          <div className="border-t border-border pt-2">
            <ChargesLine label="Total URSSAF" amount={urssaf.total} bold />
          </div>
        </div>

        {/* CIPAV */}
        <div className="border border-border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">CIPAV</h3>
          <ChargesLine label="Retraite de base (8,85%)" amount={cipav.retraiteBase} />
          <ChargesLine label="Retraite complémentaire (2,45%)" amount={cipav.retraiteComplementaire} />
          <ChargesLine label="Invalidité-décès (0,4%)" amount={cipav.invaliditeDeces} />
          <div className="border-t border-border pt-2">
            <ChargesLine label="Total CIPAV" amount={cipav.total} bold />
          </div>
        </div>
      </div>

      {/* Summary box */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Total annuel estimé</span>
          <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(total)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Provision mensuelle recommandée</span>
          <span className="text-sm font-bold text-primary tabular-nums">{formatCurrency(monthlyProvision)}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-primary/20">
          <span className="text-xs text-muted-foreground">Taux effectif sur le revenu</span>
          <span className="text-xs font-medium text-muted-foreground">{effectiveRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* Quarterly breakdown if available */}
      {data.quarterlyBreakdown && data.quarterlyBreakdown.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Acomptes trimestriels
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 px-2 text-xs font-medium text-muted-foreground">Trimestre</th>
                  <th className="text-right py-1.5 px-2 text-xs font-medium text-muted-foreground">Revenus</th>
                  <th className="text-right py-1.5 px-2 text-xs font-medium text-muted-foreground">Charges</th>
                </tr>
              </thead>
              <tbody>
                {data.quarterlyBreakdown.map((q) => (
                  <tr key={q.quarter} className="border-b border-border/50">
                    <td className="py-1.5 px-2 text-foreground">{q.quarter}</td>
                    <td className="py-1.5 px-2 text-right text-accent tabular-nums">{formatCurrency(q.revenue)}</td>
                    <td className="py-1.5 px-2 text-right text-foreground tabular-nums">{formatCurrency(q.charges)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 italic">
          Estimation indicative basée sur les taux 2024 pour libéraux non-médecins affiliés CIPAV. Les taux réels peuvent varier selon votre situation (début d&apos;activité, exonérations ACRE, etc.). Consultez votre expert-comptable ou l&apos;URSSAF pour un calcul précis.
        </p>
      </div>
    </div>
  );
}

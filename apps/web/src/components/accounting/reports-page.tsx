'use client';

import { useSession } from 'next-auth/react';
import { FinancialSummaryCard } from './financial-summary-card';
import { FinancialDashboard } from './financial-dashboard';
import { ExportSection } from './export-section';
import { TaxPrepPanel } from './tax-prep-panel';
import { SocialChargesCard } from './social-charges-card';

export function ReportsPageContent() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rapports comptables</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Tableaux de bord, exports et préparation fiscale
        </p>
      </div>

      <FinancialSummaryCard token={token} />
      <FinancialDashboard token={token} />
      <ExportSection token={token} />
      <TaxPrepPanel token={token} />
      <SocialChargesCard token={token} />
    </div>
  );
}

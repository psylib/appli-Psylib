'use client';

import { Calculator } from 'lucide-react';
import { FeatureLock } from '@/components/shared/feature-lock';
import { ReportsPageContent } from '@/components/accounting/reports-page';

export default function ReportsPage() {
  return (
    <FeatureLock
      requiredPlan="pro"
      featureName="Rapports comptables"
      featureDescription="Export FEC, préparation 2035 et charges sociales. Disponible à partir du plan Pro."
      icon={Calculator}
    >
      <ReportsPageContent />
    </FeatureLock>
  );
}

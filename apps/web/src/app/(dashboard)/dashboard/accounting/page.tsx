'use client';

import { Calculator } from 'lucide-react';
import { FeatureLock } from '@/components/shared/feature-lock';
import { AccountingPageContent } from '@/components/accounting/accounting-page';

export default function AccountingPage() {
  return (
    <FeatureLock
      requiredPlan="pro"
      featureName="Comptabilité intégrée"
      featureDescription="Gérez vos recettes, dépenses, export FEC et préparation 2035 en un seul endroit. Disponible à partir du plan Pro."
      icon={Calculator}
    >
      <AccountingPageContent />
    </FeatureLock>
  );
}

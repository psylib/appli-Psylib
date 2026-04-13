'use client';

import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';
import { FeatureLock } from '@/components/shared/feature-lock';

const MarketingPageContent = dynamic(
  () => import('./marketing-page-content').then(m => m.MarketingPageContent),
  { ssr: false },
);

export function MarketingGated() {
  return (
    <FeatureLock
      requiredPlan="pro"
      featureName="Marketing IA"
      featureDescription="Générez des posts LinkedIn, newsletters et articles de blog optimisés avec l'IA."
      icon={Sparkles}
    >
      <MarketingPageContent />
    </FeatureLock>
  );
}

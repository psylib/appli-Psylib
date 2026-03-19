'use client';

import dynamic from 'next/dynamic';
import { BarChart2 } from 'lucide-react';
import { FeatureLock } from '@/components/shared/feature-lock';
import { KpiCardSkeleton } from '@/components/ui/skeleton';

// Lazy-load : ne charge pas les SVG charts si le psy n'a pas le plan Pro
const AnalyticsContent = dynamic(
  () => import('./analytics-content').then(m => ({ default: m.AnalyticsContent })),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        </div>
      </div>
    ),
  },
);

export function AnalyticsGated() {
  return (
    <FeatureLock
      requiredPlan="pro"
      featureName="Analytics avancées"
      featureDescription="Visualisez l'évolution de vos revenus, de vos patients et du bien-être de vos consultants sur plusieurs mois."
      icon={BarChart2}
    >
      <AnalyticsContent />
    </FeatureLock>
  );
}

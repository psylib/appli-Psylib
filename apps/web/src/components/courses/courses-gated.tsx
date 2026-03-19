'use client';

import dynamic from 'next/dynamic';
import { BookOpen } from 'lucide-react';
import { FeatureLock } from '@/components/shared/feature-lock';

// Lazy-load : ne charge pas le module Courses si le psy n'a pas le plan Clinic
const CoursesContent = dynamic(
  () => import('./courses-content').then(m => ({ default: m.CoursesContent })),
  { ssr: false },
);

export function CoursesGated() {
  return (
    <FeatureLock
      requiredPlan="clinic"
      featureName="Formations en ligne"
      featureDescription="Créez des formations vidéo, vendez-les à vos patients ou au grand public, et générez des revenus passifs."
      icon={BookOpen}
    >
      <CoursesContent />
    </FeatureLock>
  );
}

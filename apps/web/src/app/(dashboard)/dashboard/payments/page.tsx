'use client';

import { Suspense } from 'react';
import { PaymentsDashboard } from '@/components/billing/payments-dashboard';
import { Skeleton, KpiCardSkeleton } from '@/components/ui/skeleton';

function PaymentsPageFallback() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<PaymentsPageFallback />}>
      <PaymentsDashboard />
    </Suspense>
  );
}

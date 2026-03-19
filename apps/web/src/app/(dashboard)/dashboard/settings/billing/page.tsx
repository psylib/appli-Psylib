import { Suspense } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { BillingPage } from '@/components/billing/billing-page';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Abonnement',
};

export default async function BillingPageRoute() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      }
    >
      <BillingPage />
    </Suspense>
  );
}

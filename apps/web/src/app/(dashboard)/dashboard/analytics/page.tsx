import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { AnalyticsGated } from '@/components/analytics/analytics-gated';

export const metadata = {
  title: 'Analytiques — PsyLib',
  description: 'Suivez vos revenus, patients et tendances',
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <AnalyticsGated />;
}

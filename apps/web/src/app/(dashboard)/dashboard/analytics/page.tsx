import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const AnalyticsGated = dynamic(
  () => import('@/components/analytics/analytics-gated').then(mod => ({ default: mod.AnalyticsGated })),
  { loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin h-8 w-8 border-2 border-[#3D52A0] border-t-transparent rounded-full" /></div> }
);

export const metadata = {
  title: 'Analytiques — PsyLib',
  description: 'Suivez vos revenus, patients et tendances',
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <AnalyticsGated />;
}

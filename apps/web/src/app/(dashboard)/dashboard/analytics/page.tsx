import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const AnalyticsGated = dynamic(
  () => import('@/components/analytics/analytics-gated').then(mod => ({ default: mod.AnalyticsGated })),
  { loading: () => <div className="p-6 space-y-4"><div className="h-8 w-48 rounded-lg bg-muted animate-pulse" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div><div className="h-64 rounded-xl bg-muted animate-pulse" /></div> }
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

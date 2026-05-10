import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@psyscale/shared-types';
import dynamic from 'next/dynamic';

const FunnelContent = dynamic(
  () => import('@/components/admin/funnel-content').then(mod => ({ default: mod.FunnelContent })),
  { loading: () => <div className="p-6 space-y-4"><div className="h-8 w-48 rounded-lg bg-muted animate-pulse" /><div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div></div> }
);

export const metadata = { title: 'Funnel Activation — PsyLib Admin' };

export default async function AdminFunnelPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== UserRole.ADMIN) redirect('/dashboard');
  return <FunnelContent />;
}

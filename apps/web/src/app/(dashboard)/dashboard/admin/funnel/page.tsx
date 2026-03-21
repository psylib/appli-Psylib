import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const FunnelContent = dynamic(
  () => import('@/components/admin/funnel-content').then(mod => ({ default: mod.FunnelContent })),
  { loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin h-8 w-8 border-2 border-[#3D52A0] border-t-transparent rounded-full" /></div> }
);

export const metadata = { title: 'Funnel Activation — PsyLib Admin' };

export default async function AdminFunnelPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/dashboard');
  return <FunnelContent />;
}

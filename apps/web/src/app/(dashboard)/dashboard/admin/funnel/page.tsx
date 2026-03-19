import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { FunnelContent } from '@/components/admin/funnel-content';

export const metadata = { title: 'Funnel Activation — PsyLib Admin' };

export default async function AdminFunnelPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/dashboard');
  return <FunnelContent />;
}

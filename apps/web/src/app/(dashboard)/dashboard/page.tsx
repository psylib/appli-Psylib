import { redirect } from 'next/navigation';
import { UserRole } from '@psyscale/shared-types';
import { auth } from '@/lib/auth/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  // Les assistant·es n'ont pas accès aux widgets cliniques du dashboard
  // (stats patients, séances récentes → 403). On les redirige vers leur
  // espace de travail principal : l'agenda.
  if (session?.user?.role === UserRole.ASSISTANT) {
    redirect('/dashboard/calendar');
  }
  return <DashboardContent userName={session?.user?.name ?? session?.user?.email ?? ''} />;
}

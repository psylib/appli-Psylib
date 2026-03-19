import { auth } from '@/lib/auth/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  return <DashboardContent userName={session?.user?.name ?? session?.user?.email ?? ''} />;
}

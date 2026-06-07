import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@psyscale/shared-types';
import dynamic from 'next/dynamic';

const VerificationsContent = dynamic(
  () =>
    import('@/components/admin/verifications-content').then((mod) => ({
      default: mod.VerificationsContent,
    })),
  {
    loading: () => (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    ),
  },
);

export const metadata = { title: 'Vérifications identité — PsyLib Admin' };

export default async function AdminVerificationsPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if (session.user.role !== UserRole.ADMIN) redirect('/dashboard');
  return <VerificationsContent />;
}

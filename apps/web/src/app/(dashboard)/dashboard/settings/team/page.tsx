import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { UserRole } from '@psyscale/shared-types';
import { TeamSettings } from '@/components/settings/team-settings';

export const metadata: Metadata = {
  title: 'Mon équipe',
};

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  // Seul·e le·la psychologue gère son équipe
  if (session.user.role === UserRole.ASSISTANT) redirect('/dashboard');

  const token = session.accessToken;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mon équipe</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invitez vos assistant·es à gérer votre agenda et vos patients en toute
          sécurité.
        </p>
      </div>

      <TeamSettings token={token} />
    </div>
  );
}

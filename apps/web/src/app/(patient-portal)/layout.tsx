import type { ReactNode } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@psyscale/shared-types';
import { PatientLogoutButton } from '@/components/patient-portal/patient-logout-button';
import { PatientBottomNav } from '@/components/patient-portal/patient-bottom-nav';

export default async function PatientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/patient/login?callbackUrl=/patient-portal');
  }

  if (session.user.role !== UserRole.PATIENT && session.user.role !== UserRole.GUARDIAN) {
    redirect('/dashboard');
  }

  const isGuardian = session.user.role === UserRole.GUARDIAN;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-semibold text-primary">PsyLib</span>
        <div className="flex items-center gap-3">
          {isGuardian && (
            <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full">
              Tuteur
            </span>
          )}
          <span className="text-sm text-muted-foreground hidden sm:inline">{session.user.email}</span>
          <PatientLogoutButton />
        </div>
      </header>

      <main className="flex-1 p-4">{children}</main>

      {/* Bottom nav — mobile (client component for active state) */}
      <PatientBottomNav />
    </div>
  );
}

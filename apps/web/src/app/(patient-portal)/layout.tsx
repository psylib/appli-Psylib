import type { ReactNode } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@psyscale/shared-types';
import { PatientLogoutButton } from '@/components/patient-portal/patient-logout-button';

export default async function PatientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/patient/login');
  }

  if (session.user.role !== UserRole.PATIENT) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-semibold text-primary">PsyLib</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">{session.user.email}</span>
          <PatientLogoutButton />
        </div>
      </header>

      <main className="flex-1 p-4">{children}</main>

      {/* Bottom nav — mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex md:hidden pb-safe">
        {[
          { label: 'Accueil', href: '/patient-portal' },
          { label: 'Humeur', href: '/patient-portal/mood' },
          { label: 'Exercices', href: '/patient-portal/exercises' },
          { label: 'Journal', href: '/patient-portal/journal' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center py-3 text-xs text-muted-foreground hover:text-primary transition-colors min-h-touch"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

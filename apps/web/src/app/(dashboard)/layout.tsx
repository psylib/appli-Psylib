import type { ReactNode } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@psyscale/shared-types';
import { Sidebar } from '@/components/layouts/sidebar';
import { MobileNav } from '@/components/layouts/mobile-nav';
import { Topbar } from '@/components/layouts/topbar';
import { CrispWidget } from '@/components/crisp-widget';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect('/login');
  if (session.user.role === UserRole.PATIENT) redirect('/patient-portal');

  // Vérifier si le psy a complété l'onboarding
  try {
    const res = await fetch(`${API_BASE}/api/v1/onboarding/profile`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const profile = (await res.json()) as { isOnboarded?: boolean };
      if (!profile.isOnboarded) {
        redirect('/onboarding');
      }
    }
  } catch {
    // Si l'API est indisponible, on laisse passer pour ne pas bloquer
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar userEmail={session.user.email ?? ''} userName={session.user.name ?? ''} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar userEmail={session.user.email ?? ''} userName={session.user.name ?? ''} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
      <MobileNav />
      <CrispWidget />
    </div>
  );
}

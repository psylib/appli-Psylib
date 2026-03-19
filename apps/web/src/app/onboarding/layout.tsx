import type { ReactNode } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect('/login');

  // Si déjà onboardé, rediriger vers le dashboard
  try {
    const res = await fetch(`${API_BASE}/api/v1/onboarding/profile`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const profile = (await res.json()) as { isOnboarded?: boolean };
      if (profile.isOnboarded) {
        redirect('/dashboard');
      }
    }
  } catch {
    // Si l'API est indisponible, on laisse continuer l'onboarding
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-4 flex justify-center border-b border-border bg-white">
        <span className="text-xl font-bold text-primary">PsyLib</span>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}

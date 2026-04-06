import type { ReactNode } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect('/login');

  // Skip isOnboarded check for success page — it was just set to true
  const headersList = await headers();
  const pathname = headersList.get('x-next-pathname') ?? '';
  const isSuccessPage = pathname.endsWith('/success');

  if (!isSuccessPage) {
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
  }

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}

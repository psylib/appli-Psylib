import { Suspense } from 'react';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/settings/profile-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon profil',
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mon profil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Informations professionnelles affichées sur votre espace et vos documents.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4" aria-busy="true" aria-label="Chargement du formulaire">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        }
      >
        <ProfileForm />
      </Suspense>
    </div>
  );
}

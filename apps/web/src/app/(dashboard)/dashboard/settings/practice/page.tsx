import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AvailabilityManager } from '@/components/settings/availability-manager';

export const metadata: Metadata = {
  title: 'Cabinet',
};

export default async function PracticePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Cabinet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Informations de votre cabinet, adresse et tarifs de consultation.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h2 className="text-base font-medium text-foreground">Adresse du cabinet</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Adresse
            </label>
            <input
              type="text"
              placeholder="12 rue de la Paix"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Code postal
              </label>
              <input
                type="text"
                placeholder="75001"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Ville
              </label>
              <input
                type="text"
                placeholder="Paris"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h2 className="text-base font-medium text-foreground">Tarifs</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Tarif de consultation (€)
            </label>
            <input
              type="number"
              placeholder="60"
              min={0}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Durée de séance par défaut (minutes)
            </label>
            <input
              type="number"
              placeholder="50"
              min={15}
              step={5}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h2 className="text-base font-medium text-foreground">Informations de contact</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Téléphone
            </label>
            <input
              type="tel"
              placeholder="+33 6 00 00 00 00"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Disponibilités — prise de RDV en ligne */}
      <AvailabilityManager />

      <p className="text-xs text-muted-foreground text-center">
        La gestion complète du cabinet est disponible depuis votre profil.
      </p>
    </div>
  );
}

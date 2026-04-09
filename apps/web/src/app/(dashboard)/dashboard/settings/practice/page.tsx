import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AvailabilityManager } from '@/components/settings/availability-manager';
import { ConsultationTypesSettings } from '@/components/settings/consultation-types-settings';
import { MspSettings } from '@/components/settings/msp-settings';
import { ReminderSettings } from '@/components/settings/reminder-settings';
import { PaymentSettings } from '@/components/settings/payment-settings';
import { VisioSettings } from '@/components/settings/visio-settings';
import { InvoiceSettings } from '@/components/settings/invoice-settings';

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
              Tarif de consultation (EUR)
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
              Duree de seance par defaut (minutes)
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

      {/* Motifs de consultation */}
      <ConsultationTypesSettings />

      {/* Mon Soutien Psy */}
      <MspSettings />

      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h2 className="text-base font-medium text-foreground">Informations de contact</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Telephone
            </label>
            <input
              type="tel"
              placeholder="+33 6 00 00 00 00"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Visioconference */}
      <VisioSettings />

      {/* Disponibilites — prise de RDV en ligne */}
      <AvailabilityManager />

      {/* Rappels de rendez-vous */}
      <ReminderSettings />

      {/* Paiement en ligne */}
      <PaymentSettings />

      {/* Facturation automatique */}
      <InvoiceSettings />

      <p className="text-xs text-muted-foreground text-center">
        La gestion complete du cabinet est disponible depuis votre profil.
      </p>
    </div>
  );
}

import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { PracticeInfoSettings } from '@/components/settings/practice-info-settings';
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

  const token = session.accessToken;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Cabinet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Informations de votre cabinet, adresse et tarifs de consultation.
        </p>
      </div>

      {/* Adresse, tarifs, contact — câblé à l'API */}
      <PracticeInfoSettings token={token} />

      {/* Motifs de consultation */}
      <ConsultationTypesSettings token={token} />

      {/* Mon Soutien Psy */}
      <MspSettings token={token} />

      {/* Visioconference */}
      <VisioSettings token={token} />

      {/* Disponibilites — prise de RDV en ligne */}
      <AvailabilityManager token={token} />

      {/* Rappels de rendez-vous */}
      <ReminderSettings token={token} />

      {/* Paiement en ligne */}
      <PaymentSettings token={token} />

      {/* Facturation automatique */}
      <InvoiceSettings token={token} />

      <p className="text-xs text-muted-foreground text-center">
        La gestion complete du cabinet est disponible depuis votre profil.
      </p>
    </div>
  );
}

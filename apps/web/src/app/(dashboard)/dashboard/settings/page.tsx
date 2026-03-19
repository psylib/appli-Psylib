import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, CreditCard, Building2, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paramètres',
};

const settingsLinks = [
  {
    href: '/dashboard/settings/profile',
    label: 'Mon profil',
    description: 'Informations professionnelles, ADELI, photo',
    icon: User,
  },
  {
    href: '/dashboard/settings/billing',
    label: 'Abonnement & facturation',
    description: 'Plan actuel, historique des paiements',
    icon: CreditCard,
  },
  {
    href: '/dashboard/settings/practice',
    label: 'Cabinet',
    description: 'Adresse, horaires, tarifs',
    icon: Building2,
  },
  {
    href: '/dashboard/settings/privacy',
    label: 'Confidentialité & RGPD',
    description: 'Consentements, export de données',
    icon: Shield,
  },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez votre compte et votre cabinet.
        </p>
      </div>

      <div className="grid gap-4">
        {settingsLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

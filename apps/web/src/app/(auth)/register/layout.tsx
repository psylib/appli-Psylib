import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Inscription psychologue — PsyLib',
  description:
    'Créez votre compte PsyLib gratuitement. Logiciel de gestion de cabinet pour psychologues libéraux — agenda, notes de séances, comptabilité, visio.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://psylib.eu/register' },
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

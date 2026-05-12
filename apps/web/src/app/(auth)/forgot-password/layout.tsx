import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Mot de passe oublié — PsyLib',
  description: 'Réinitialisez votre mot de passe PsyLib',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

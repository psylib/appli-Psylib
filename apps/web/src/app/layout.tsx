import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://psylib.eu'),
  title: {
    default: 'PsyLib — Gestion cabinet psychologue',
    template: '%s | PsyLib',
  },
  description:
    'La plateforme tout-en-un pour psychologues libéraux. Gestion cabinet, suivi patient, formations et assistant IA. Conforme HDS.',
  keywords: ['psychologue', 'gestion cabinet', 'suivi patient', 'formations', 'HDS'],
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://psylib.eu',
    languages: {
      'fr-FR': 'https://psylib.eu',
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'PsyLib',
      url: 'https://psylib.eu',
      logo: 'https://psylib.eu/logo.png',
      description:
        'Plateforme SaaS de gestion de cabinet pour psychologues liberaux en France. Dossiers patients securises, notes cliniques, facturation, outcome tracking. Conforme HDS.',
      foundingDate: '2026',
      areaServed: {
        '@type': 'Country',
        name: 'France',
      },
      availableLanguage: {
        '@type': 'Language',
        name: 'French',
        alternateName: 'fr',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@psylib.eu',
        contactType: 'customer support',
        availableLanguage: 'French',
      },
    },
    {
      '@type': 'WebSite',
      name: 'PsyLib',
      url: 'https://psylib.eu',
      description:
        'Logiciel de gestion de cabinet tout-en-un pour psychologues liberaux. Conforme HDS France.',
      inLanguage: 'fr',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://psylib.eu/trouver-mon-psy?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-dm-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

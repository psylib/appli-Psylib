import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webinaire RGPD & HDS pour psychologues libéraux — gratuit',
  description:
    "Webinaire gratuit de 45 min : ce que dit vraiment la loi sur vos données patients et pourquoi 80% des logiciels utilisés par les psys sont hors conformité. Jeudi 16 avril 2026 12h30.",
  keywords: [
    'webinaire psychologue',
    'RGPD psychologue',
    'HDS psychologue',
    'conformité données santé psy',
    'logiciel psy RGPD',
    'CNIL psychologue',
    'formation RGPD psy gratuit',
  ],
  alternates: {
    canonical: 'https://psylib.eu/webinaires/rgpd-hds',
  },
  openGraph: {
    title: 'Webinaire RGPD & HDS pour psychologues libéraux — gratuit',
    description:
      "45 min en direct avec Q&A. Découvrez ce que dit vraiment la loi sur vos données patients. Replay offert à tous les inscrits.",
    url: 'https://psylib.eu/webinaires/rgpd-hds',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'PsyLib',
  },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

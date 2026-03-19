import type { Metadata } from 'next';
import { RevenueCalculator } from './calculator';

export const metadata: Metadata = {
  title: 'Calculateur de Revenus Psychologue Libéral 2026 | PsyLib',
  description:
    'Estimez vos revenus nets en tant que psychologue libéral : chiffre d\'affaires, charges, cotisations URSSAF, revenus mensuels et annuels. Outil gratuit.',
  keywords: [
    'calculateur revenus psychologue',
    'revenus psychologue libéral',
    'salaire psychologue libéral',
    'charges psychologue libéral',
    'URSSAF psychologue',
    'combien gagne un psychologue libéral',
    'revenu net psychologue libéral',
    'simulation revenus psy',
  ],
  alternates: { canonical: 'https://psylib.eu/outils/calculateur-revenus' },
  openGraph: {
    title: 'Calculateur de Revenus Psychologue Libéral 2026',
    description: 'Simulez vos revenus nets : CA, charges, URSSAF, net mensuel. Outil gratuit pour psychologues libéraux.',
    url: 'https://psylib.eu/outils/calculateur-revenus',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Calculateur de Revenus Psychologue Libéral',
  description: 'Simulez vos revenus nets en tant que psychologue libéral.',
  url: 'https://psylib.eu/outils/calculateur-revenus',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
};

export default function CalculateurRevenusPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RevenueCalculator />
    </>
  );
}

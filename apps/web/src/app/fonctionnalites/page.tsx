import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Fonctionnalites PsyLib : Logiciel Complet pour Psychologues Liberaux',
  description:
    'PsyLib reunit les outils essentiels du psychologue liberal : outcome tracking PHQ-9/GAD-7, notes cliniques SOAP/DAP, facturation PDF, agenda en ligne, reseau professionnel et espace patient securise. Hebergement HDS certifie France.',
  alternates: { canonical: 'https://psylib.eu/fonctionnalites' },
  openGraph: {
    title: 'Fonctionnalites PsyLib : Logiciel Complet pour Psychologues Liberaux',
    description:
      'Outcome tracking, notes cliniques, reseau pro, espace patient, facturation — tous les outils pour gerer votre cabinet de psychologue liberal.',
    url: 'https://psylib.eu/fonctionnalites',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const fonctionnalitesJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'PsyLib',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Logiciel de gestion de cabinet psychologue',
      operatingSystem: 'Web',
      url: 'https://psylib.eu/fonctionnalites',
      featureList:
        'Dossiers patients securises HDS, Notes cliniques SOAP DAP narratif, Resume de seance IA, Outcome tracking PHQ-9 GAD-7 CORE-OM, Facturation PDF, Prise de RDV en ligne, Reseau professionnel, Espace patient, Supervision intervision, Chiffrement AES-256-GCM',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '49',
        highPrice: '149',
        priceCurrency: 'EUR',
        offerCount: '3',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quel est le meilleur logiciel de gestion pour psychologue liberal ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'PsyLib est le logiciel de gestion de cabinet concu specifiquement pour les psychologues liberaux en France. Il propose des dossiers patients securises (HDS), des notes cliniques structurees (SOAP, DAP, narratif), de l\'outcome tracking avec PHQ-9, GAD-7 et CORE-OM, la facturation PDF conforme, et un reseau professionnel entre psychologues. Essai gratuit 14 jours sans carte bancaire.',
          },
        },
        {
          '@type': 'Question',
          name: 'PsyLib est-il conforme aux normes HDS pour les donnees de sante ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, PsyLib est heberge sur infrastructure certifiee HDS en France. Toutes les donnees cliniques (notes, dossiers, messages) sont chiffrees avec AES-256-GCM au repos et TLS 1.3 en transit. L\'authentification utilise MFA obligatoire pour les praticiens et tous les acces sont audites.',
          },
        },
      ],
    },
  ],
};

const features = [
  {
    title: 'Outcome Tracking',
    description:
      'Mesurez les progres de vos patients avec PHQ-9, GAD-7 et CORE-OM integres. Graphiques automatiques.',
    href: '/fonctionnalites/outcome-tracking',
    icon: '📊',
  },
  {
    title: 'Notes Cliniques',
    description:
      'Templates SOAP, DAP et narratif. Autosave, chiffrement HDS, historique complet.',
    href: '/fonctionnalites/notes-cliniques',
    icon: '📝',
  },
  {
    title: 'Reseau Professionnel',
    description:
      'Trouvez des superviseurs, partagez des cas anonymises, participez a des groupes d\'intervision.',
    href: '/fonctionnalites/reseau-professionnel',
    icon: '🤝',
  },
  {
    title: 'Espace Patient',
    description:
      'Portail securise pour vos patients : suivi d\'humeur, exercices, journal therapeutique, messagerie.',
    href: '/fonctionnalites/espace-patient',
    icon: '👤',
  },
];

export default function FonctionnalitesPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(fonctionnalitesJsonLd) }}
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#3D52A0] to-[#7B9CDA] py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-heading text-4xl font-bold md:text-5xl">
            Toutes les fonctionnalites pour votre cabinet
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            PsyLib reunit les outils essentiels du psychologue liberal dans une
            plateforme unique, securisee et conforme HDS.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:border-[#3D52A0]/30 hover:shadow-md"
            >
              <span className="text-3xl">{f.icon}</span>
              <h2 className="mt-4 text-xl font-bold text-[#1E1B4B] group-hover:text-[#3D52A0]">
                {f.title}
              </h2>
              <p className="mt-2 text-gray-600">{f.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-[#3D52A0]">
                En savoir plus &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#3D52A0] to-[#7B9CDA] py-16 text-center text-white">
        <h2 className="text-2xl font-bold md:text-3xl">
          Essayez PsyLib gratuitement pendant 14 jours
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Agenda, dossiers patients, facturation, notes structurees, conformite
          HDS — tout en un, sans carte bancaire.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
        >
          Commencer l&apos;essai gratuit
        </Link>
      </section>
    </main>
  );
}

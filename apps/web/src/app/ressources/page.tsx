import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadMagnetCTA } from '@/components/lead-magnet-cta';

export const metadata: Metadata = {
  title: 'Ressources gratuites pour psychologues liberaux | PsyLib',
  description:
    'Telechargez gratuitement nos guides PDF pour psychologues liberaux : kit de demarrage cabinet, templates notes TCC, guide tarifs et facturation.',
  alternates: { canonical: 'https://psylib.eu/ressources' },
  openGraph: {
    title: 'Ressources gratuites pour psychologues liberaux',
    description:
      'Guides PDF gratuits : demarrage cabinet, notes TCC, tarifs et facturation. Par PsyLib.',
    url: 'https://psylib.eu/ressources',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'PsyLib',
  },
  robots: { index: true, follow: true },
};

const ressourcesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Ressources gratuites pour psychologues liberaux',
  description:
    'Guides PDF gratuits pour aider les psychologues liberaux a demarrer et gerer leur cabinet.',
  url: 'https://psylib.eu/ressources',
  isPartOf: {
    '@type': 'WebSite',
    name: 'PsyLib',
    url: 'https://psylib.eu',
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: 'https://psylib.eu',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Ressources',
        item: 'https://psylib.eu/ressources',
      },
    ],
  },
};

const RESOURCES = [
  {
    slug: 'kit-demarrage-cabinet' as const,
    icon: '🏠',
    title: 'Kit de demarrage cabinet psy',
    description:
      'Checklist complete pour ouvrir votre cabinet : enregistrement ADELI, assurance RC Pro, choix du local, declaration URSSAF, logiciel HDS et communication.',
    ctaDescription:
      'Recevez la checklist complete (PDF) pour ouvrir votre cabinet de psychologue liberal sans rien oublier.',
  },
  {
    slug: 'templates-notes-tcc' as const,
    icon: '📋',
    title: 'Templates notes cliniques TCC',
    description:
      'Grilles de pensees automatiques, tableau ABC (Ellis), analyse fonctionnelle SECCA, restructuration cognitive et plan de prevention de la rechute.',
    ctaDescription:
      'Recevez 6 templates de notes cliniques TCC prets a l\'emploi pour structurer vos seances.',
  },
  {
    slug: 'guide-tarifs-facturation' as const,
    icon: '💰',
    title: 'Guide tarifs et facturation',
    description:
      'Tarifs moyens 2026, exoneration TVA (Art. 261), obligations URSSAF, mentions obligatoires sur facture, dispositif MonPsy et outils de facturation.',
    ctaDescription:
      'Recevez le guide complet tarifs et facturation pour psychologues liberaux (PDF gratuit).',
  },
];

export default function RessourcesPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ressourcesJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#3D52A0] to-[#7B9CDA] py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-heading text-4xl font-bold md:text-5xl">
            Ressources gratuites pour psychologues
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Guides PDF pratiques pour demarrer et gerer votre cabinet de psychologue liberal.
            Entrez votre email pour recevoir le document instantanement.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-800">Accueil</Link> ›{' '}
          <span className="text-gray-800 font-medium">Ressources</span>
        </nav>
      </div>

      {/* Resources */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="space-y-8">
          {RESOURCES.map((resource) => (
            <div
              key={resource.slug}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="text-3xl">{resource.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-[#1E1B4B]">{resource.title}</h2>
                    <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-green-100 text-green-700">
                      PDF Gratuit
                    </span>
                  </div>
                  <p className="text-gray-600">{resource.description}</p>
                </div>
              </div>

              <LeadMagnetCTA
                slug={resource.slug}
                title={resource.title}
                description={resource.ctaDescription}
              />
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-gradient-to-r from-[#3D52A0] to-[#7B9CDA] py-16 text-center text-white">
        <h2 className="text-2xl font-bold md:text-3xl">
          Gerez votre cabinet avec PsyLib
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Dossiers patients securises, notes cliniques, facturation, agenda — tout en un.
          Conforme HDS. Essai gratuit 14 jours.
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

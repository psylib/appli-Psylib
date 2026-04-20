import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Guides pratiques pour psychologues libéraux | PsyLib',
  description:
    'Tarifs, facturation, dossiers patients, HDS, TCC, agenda, supervision — tous nos guides pratiques pour les psychologues libéraux en France.',
  keywords: [
    'guide psychologue libéral',
    'ressources psychologue',
    'gestion cabinet psy',
    'logiciel psychologue',
    'facturation psychologue',
    'conformité HDS psy',
  ],
  alternates: { canonical: 'https://psylib.eu/guides' },
  openGraph: {
    title: 'Guides pratiques pour psychologues libéraux | PsyLib',
    description:
      'Tarifs, facturation, dossiers patients, HDS, TCC, agenda, supervision — tous nos guides pratiques pour les psychologues libéraux en France.',
    url: 'https://psylib.eu/guides',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'PsyLib',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      name: 'Guides pratiques pour psychologues libéraux',
      description:
        'Ressources complètes pour exercer en libéral : tarifs, facturation, conformité HDS, logiciels, supervision et pratiques cliniques.',
      url: 'https://psylib.eu/guides',
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
      ],
    },
  ],
};

const guides = [
  {
    slug: 'tarif-psychologue-liberal',
    title: 'Tarif psychologue libéral : grille des prix 2026',
    description:
      'Tarifs moyens en France (80-120 €/séance), variables selon la ville, la spécialité et le secteur. Comment PsyLib simplifie la facturation.',
    category: 'Facturation & Tarifs',
  },
  {
    slug: 'remboursement-psychologue-mutuelle',
    title: 'Remboursement psychologue par la mutuelle : tout comprendre',
    description:
      'Ce qui est remboursé ou non, comment générer des attestations conformes, MonPsy vs libéral. PsyLib automatise les attestations.',
    category: 'Facturation & Tarifs',
  },
  {
    slug: 'facturation-psychologue-tva',
    title: 'Facturation psychologue et TVA : exonération et mentions légales',
    description:
      "Exonération TVA (art. 261), mentions obligatoires sur une facture psy, numéro ADELI. PsyLib génère des factures conformes en un clic.",
    category: 'Facturation & Tarifs',
  },
  {
    slug: 'agenda-psychologue-logiciel',
    title: 'Agenda psychologue : choisir le bon logiciel en 2026',
    description:
      'Critères de choix : rappels SMS, synchro Google, gestion des annulations, confidentialité HDS. Fonctionnalités agenda de PsyLib.',
    category: 'Gestion du cabinet',
  },
  {
    slug: 'dossier-patient-psychologue',
    title: 'Dossier patient psychologue : obligations légales et bonnes pratiques',
    description:
      'Obligations légales, chiffrement HDS, RGPD, contenu optimal. PsyLib centralise et sécurise les dossiers patients.',
    category: 'Gestion du cabinet',
  },
  {
    slug: 'ouvrir-cabinet-psychologue',
    title: 'Ouvrir un cabinet de psychologue libéral : guide étape par étape',
    description:
      "ADELI, URSSAF, RC Pro, local professionnel, outils numériques — checklist complète pour démarrer son cabinet en libéral.",
    category: 'Gestion du cabinet',
  },
  {
    slug: 'logiciel-hds-donnees-sante',
    title: 'Logiciel HDS et données de santé : ce que les psys doivent savoir',
    description:
      "Qu'est-ce que la certification HDS, pourquoi elle est obligatoire, risques d'un logiciel non conforme. PsyLib est hébergé HDS.",
    category: 'Conformité & Sécurité',
  },
  {
    slug: 'teleconsultation-psychologue',
    title: 'Téléconsultation psychologue : cadre légal et outils conformes',
    description:
      'Cadre légal de la consultation à distance, outils visio conformes HDS, intégration avec PsyLib pour une pratique sécurisée.',
    category: 'Pratique clinique',
  },
  {
    slug: 'supervision-psychologue-liberale',
    title: "Supervision psychologue libérale : tout ce qu'il faut savoir",
    description:
      'Importance de la supervision, différence supervision/intervision, trouver un groupe. PsyLib intègre un module de supervision.',
    category: 'Pratique clinique',
  },
  {
    slug: 'tcc-therapie-cognitive-comportementale',
    title: 'TCC — Thérapie Cognitive et Comportementale : outils numériques',
    description:
      'Présentation de la TCC, outils de suivi (grilles de pensées, tableaux), templates TCC structurés dans PsyLib.',
    category: 'Pratique clinique',
  },
  {
    slug: 'notes-seance-structurees',
    title: 'Notes de séance structurées : formats SOAP, DAP et modèles',
    description:
      'Importance des notes structurées, formats SOAP, DAP, narratif. PsyLib propose des templates par orientation thérapeutique.',
    category: 'Pratique clinique',
  },
  {
    slug: 'espace-patient-numerique',
    title: 'Espace patient numérique : portail sécurisé pour les psys',
    description:
      'Ce que peut faire le patient (humeur, exercices, journal, messagerie), sécurité HDS, PsyLib espace patient intégré.',
    category: 'Pratique clinique',
  },
  {
    slug: 'burnout-psychologue-liberale',
    title: 'Burnout du psychologue libéral : causes, prévention et solutions',
    description:
      "Causes du burnout psy (charge admin, isolement), solutions concrètes, rôle du logiciel dans la prévention de l'épuisement.",
    category: 'Bien-être professionnel',
  },
  {
    slug: 'psychologue-en-ligne-visio',
    title: 'Psychologue en ligne : tout savoir sur la thérapie par visio',
    description:
      "Avantages et limites de la thérapie en ligne, cadre éthique, outils conformes HDS, intégration avec PsyLib.",
    category: 'Pratique clinique',
  },
];

const categories = [
  'Facturation & Tarifs',
  'Gestion du cabinet',
  'Conformité & Sécurité',
  'Pratique clinique',
  'Bien-être professionnel',
];

export default function GuidesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-4xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Guides</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Ressources — Mars 2026
          </p>
          <h1 className="font-playfair text-4xl font-bold leading-tight text-[#1E1B4B] md:text-5xl">
            Guides pratiques pour psychologues libéraux
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            Tarifs, facturation TVA, conformité HDS, agenda, dossiers patients, TCC, supervision —
            tout ce qu&apos;un psychologue libéral doit savoir pour gérer son cabinet sereinement.
          </p>
        </header>

        {/* Guides by category */}
        {categories.map((category) => {
          const categoryGuides = guides.filter((g) => g.category === category);
          if (categoryGuides.length === 0) return null;
          return (
            <section key={category} className="mb-12">
              <h2 className="mb-6 border-b border-gray-200 pb-2 font-playfair text-2xl font-bold text-[#1E1B4B]">
                {category}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {categoryGuides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-[#3D52A0] hover:shadow-md"
                  >
                    <h3 className="mb-2 font-semibold text-[#1E1B4B] transition group-hover:text-[#3D52A0]">
                      {guide.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-gray-500">{guide.description}</p>
                    <span className="mt-4 inline-block text-sm font-medium text-[#3D52A0] transition group-hover:underline">
                      Lire le guide →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <section className="mt-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Agenda, dossiers patients, facturation PDF, notes structurées, conformité HDS — tout
            en un, sans carte bancaire.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer gratuitement
          </Link>
        </section>
      </main>
    </>
  );
}

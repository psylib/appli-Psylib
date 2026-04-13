import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadMagnetCTA } from '@/components/lead-magnet-cta';

export const metadata: Metadata = {
  title: 'Guide RGPD & HDS pour psychologues liberaux (PDF gratuit) | PsyLib',
  description:
    'Telechargez le guide complet RGPD et hebergement de donnees de sante (HDS) pour psychologues liberaux. Obligations legales, conformite, outils securises.',
  alternates: { canonical: 'https://psylib.eu/ressources/guide-rgpd-hds' },
  openGraph: {
    title: 'Guide RGPD & HDS pour psychologues liberaux',
    description:
      'Le guide complet pour proteger les donnees de vos patients en conformite avec la reglementation HDS et le RGPD. PDF gratuit.',
    url: 'https://psylib.eu/ressources/guide-rgpd-hds',
    type: 'article',
    locale: 'fr_FR',
    siteName: 'PsyLib',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Guide RGPD & HDS pour psychologues liberaux',
  description:
    'Le guide complet pour proteger les donnees de vos patients en conformite avec la reglementation HDS et le RGPD.',
  url: 'https://psylib.eu/ressources/guide-rgpd-hds',
  author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
  publisher: { '@type': 'Organization', name: 'PsyLib' },
  datePublished: '2026-03-27',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
      { '@type': 'ListItem', position: 2, name: 'Ressources', item: 'https://psylib.eu/ressources' },
      { '@type': 'ListItem', position: 3, name: 'Guide RGPD & HDS', item: 'https://psylib.eu/ressources/guide-rgpd-hds' },
    ],
  },
};

const CHAPTERS = [
  {
    number: '01',
    title: 'Pourquoi vos donnees patients sont des donnees de sante',
    items: [
      'Definition legale des donnees de sante (art. L.1111-8 CSP)',
      'Pourquoi les notes de seance, diagnostics et suivis sont concernes',
      'Risques encourus : sanctions CNIL jusqu\'a 20M€ ou 4% du CA',
    ],
  },
  {
    number: '02',
    title: 'L\'hebergement de donnees de sante (HDS) decrypte',
    items: [
      'Qu\'est-ce que la certification HDS (ASIP Sante / ANS)',
      'Difference entre HDS hebergeur et HDS infogéreur',
      'Liste des providers certifies HDS en France (AWS, OVH, Scaleway…)',
    ],
  },
  {
    number: '03',
    title: 'Les outils que vous ne devez plus utiliser',
    items: [
      'Google Drive, Dropbox, Notion : pourquoi c\'est illegal',
      'Les outils americains et le Cloud Act / FISA 702',
      'Tableau comparatif : outils grand public vs outils HDS',
    ],
  },
  {
    number: '04',
    title: 'RGPD : vos obligations en tant que psychologue',
    items: [
      'Registre des traitements : modele pre-rempli inclus',
      'Information patients : mentions legales obligatoires',
      'Droit d\'acces, rectification, effacement : comment repondre',
      'Consentement eclaire pour le traitement numerique',
    ],
  },
  {
    number: '05',
    title: 'Checklist de mise en conformite',
    items: [
      'Audit de vos outils actuels (15 questions)',
      'Plan d\'action en 5 etapes pour migrer vers un outil conforme',
      'Modele de registre des traitements RGPD',
      'Modele d\'information patient sur le traitement des donnees',
    ],
  },
];

export default function GuideRGPDHDSPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#3D52A0] to-[#7B9CDA] py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
            PDF Gratuit — 12 pages
          </div>
          <h1 className="font-heading text-3xl font-bold md:text-5xl leading-tight">
            Le guide complet RGPD &amp; HDS<br />pour psychologues liberaux
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">
            Tout ce que vous devez savoir pour proteger les donnees de vos patients
            et etre en conformite avec la loi. Redigé par des experts sante numerique.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-800">Accueil</Link> ›{' '}
          <Link href="/ressources" className="hover:text-gray-800">Ressources</Link> ›{' '}
          <span className="text-gray-800 font-medium">Guide RGPD &amp; HDS</span>
        </nav>
      </div>

      {/* Download CTA */}
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl">🔒</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-[#1E1B4B]">
                  Telechargez le guide RGPD &amp; HDS
                </h2>
                <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-green-100 text-green-700">
                  PDF Gratuit
                </span>
              </div>
              <p className="text-gray-600">
                12 pages de contenu actionnable : obligations legales, checklist de conformite,
                modeles de documents et comparatif outils. Entrez votre email pour le recevoir.
              </p>
            </div>
          </div>
          <LeadMagnetCTA
            slug="guide-rgpd-hds"
            title="Guide RGPD & HDS pour psychologues"
            description="Recevez le guide complet RGPD et HDS pour psychologues liberaux (PDF gratuit, 12 pages)."
          />
        </div>
      </section>

      {/* Chapters preview */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="text-2xl font-bold text-[#1E1B4B] mb-8 text-center">
          Ce que contient le guide
        </h2>
        <div className="space-y-6">
          {CHAPTERS.map((chapter) => (
            <div
              key={chapter.number}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-[#F1F0F9] flex items-center justify-center text-[#3D52A0] font-bold text-sm">
                  {chapter.number}
                </div>
                <div>
                  <h3 className="font-bold text-[#1E1B4B] mb-2">{chapter.title}</h3>
                  <ul className="space-y-1.5">
                    {chapter.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-[#0D9488] mt-0.5 shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why trust us */}
      <section className="bg-[#F1F0F9] py-14">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-[#1E1B4B] mb-6 text-center">
            Pourquoi faire confiance a ce guide ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-2xl mb-2">🏥</div>
              <h3 className="font-bold text-[#1E1B4B] text-sm mb-1">Expertise sante numerique</h3>
              <p className="text-xs text-gray-600">
                Redige par une equipe technique certifiee en hebergement de donnees de sante.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-2xl mb-2">⚖️</div>
              <h3 className="font-bold text-[#1E1B4B] text-sm mb-1">Conforme a la loi francaise</h3>
              <p className="text-xs text-gray-600">
                Base sur le Code de la sante publique, le RGPD et les referentiels ANS.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-bold text-[#1E1B4B] text-sm mb-1">Actionnable immediatement</h3>
              <p className="text-xs text-gray-600">
                Checklists, modeles de documents et plan d&apos;action concret en 5 etapes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-gradient-to-r from-[#3D52A0] to-[#7B9CDA] py-16 text-center text-white">
        <h2 className="text-2xl font-bold md:text-3xl">
          Passez a un outil conforme HDS des maintenant
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          PsyLib heberge vos donnees en France sur infrastructure certifiee HDS.
          Chiffrement AES-256, audit des acces, conforme RGPD.
        </p>
        <Link
          href="/beta"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
        >
          Commencer gratuitement
        </Link>
      </section>
    </main>
  );
}

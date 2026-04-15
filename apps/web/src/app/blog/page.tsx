import type { Metadata } from 'next';
import Link from 'next/link';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      name: 'Blog PsyLib — Ressources pour psychologues libéraux',
      description:
        'Guides pratiques pour psychologues libéraux : logiciel de gestion de cabinet, notes de séance, facturation, conformité HDS.',
      url: 'https://psylib.eu/blog',
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://psylib.eu/blog' },
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: 'Blog PsyLib — Ressources pour psychologues libéraux',
  description:
    'Guides pratiques pour psychologues libéraux : logiciel de gestion de cabinet, notes de séance, facturation, conformité HDS. Ressources gratuites par PsyLib.',
  alternates: {
    canonical: 'https://psylib.eu/blog',
  },
  openGraph: {
    title: 'Blog PsyLib — Ressources pour psychologues libéraux',
    description:
      'Guides pratiques pour psychologues libéraux : gestion de cabinet, notes cliniques, facturation, conformité HDS.',
    url: 'https://psylib.eu/blog',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'PsyLib',
  },
  robots: { index: true, follow: true },
};

const articles = [
  {
    slug: 'alternative-doctolib-psychologue',
    title: 'Alternative à Doctolib pour psychologue : le comparatif 2026',
    excerpt:
      "Doctolib est-il vraiment le meilleur choix pour un psychologue libéral ? Prix, limites et comparatif des 6 meilleures alternatives françaises en 2026.",
    category: 'Comparatif',
    date: '5 avril 2026',
    readTime: '12 min',
  },
  {
    slug: 'logiciel-gestion-cabinet-psychologue',
    title: 'Logiciel gestion cabinet psychologue : comparatif 2026',
    excerpt:
      "Quel logiciel choisir pour gérer son cabinet en libéral ? Comparatif des solutions françaises, critères HDS, agenda, facturation et notes de séance.",
    category: 'Guide pratique',
    date: '15 mars 2026',
    readTime: '8 min',
  },
  {
    slug: 'notes-seance-psychologue-logiciel',
    title: 'Notes de séance psychologue : logiciel et templates structurés',
    excerpt:
      "Comment structurer les notes cliniques avec un logiciel conforme HDS ? Templates TCC, ACT, psychodynamique et systémique — obligations légales et bonnes pratiques.",
    category: 'Pratique clinique',
    date: '15 mars 2026',
    readTime: '9 min',
  },
  {
    slug: 'facturation-psychologue-liberal',
    title: 'Facturation psychologue libéral : guide complet 2026',
    excerpt:
      "TVA exonérée, mentions obligatoires, numéro ADELI, Mon Soutien Psy — tout ce qu'il faut savoir pour facturer correctement en libéral.",
    category: 'Gestion administrative',
    date: '15 mars 2026',
    readTime: '10 min',
  },
  {
    slug: 'outcome-tracking-psychotherapie',
    title: 'Outcome Tracking en psychothérapie : PHQ-9, GAD-7 et suivi des progrès',
    excerpt:
      "Découvrez comment l'outcome tracking transforme le suivi de vos patients. PHQ-9, GAD-7, CORE-OM : mesurer objectivement les progrès pour ajuster votre stratégie thérapeutique.",
    category: 'Pratique clinique',
    date: '15 mars 2026',
    readTime: '8 min',
  },
  {
    slug: 'agenda-psychologue-en-ligne',
    title: 'Agenda psychologue en ligne : pourquoi passer au numérique en 2026',
    excerpt:
      "Agenda papier ou logiciel en ligne ? Rappels automatiques, conformité HDS, gain de temps : tout ce qu'un psychologue doit savoir avant de choisir son outil.",
    category: 'Gestion administrative',
    date: '15 mars 2026',
    readTime: '7 min',
  },
  {
    slug: 'application-psychologue-liberal',
    title: 'Application psychologue libéral : comment choisir le bon outil en 2026',
    excerpt:
      "Sécurité HDS, dossier patient, facturation, notes de séance : les 5 critères indispensables pour choisir la meilleure application psychologue libéral en France.",
    category: 'Guide pratique',
    date: '15 mars 2026',
    readTime: '8 min',
  },
];

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="mx-auto max-w-4xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
      {/* En-tête */}
      <header className="mb-12 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
          Ressources
        </p>
        <h1 className="font-playfair text-4xl font-bold text-[#1E1B4B]">
          Blog PsyLib
        </h1>
        <p className="mt-4 mx-auto max-w-xl text-lg text-gray-600">
          Guides pratiques et ressources pour les psychologues libéraux : gestion
          de cabinet, conformité HDS, facturation et pratique clinique.
        </p>
      </header>

      {/* Liste des articles */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="group rounded-2xl border border-gray-200 p-6 transition hover:border-[#3D52A0]/40 hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="rounded-full bg-[#F1F0F9] px-3 py-1 text-xs font-medium text-[#3D52A0]">
                {article.category}
              </span>
              <span className="text-xs text-gray-400">{article.date}</span>
              <span className="text-xs text-gray-400">{article.readTime} de lecture</span>
            </div>
            <h2 className="mb-3 font-playfair text-xl font-bold text-[#1E1B4B] group-hover:text-[#3D52A0] transition-colors">
              <Link href={`/blog/${article.slug}`}>{article.title}</Link>
            </h2>
            <p className="mb-4 leading-relaxed text-gray-600">{article.excerpt}</p>
            <Link
              href={`/blog/${article.slug}`}
              className="text-sm font-medium text-[#3D52A0] hover:underline"
            >
              Lire l'article
            </Link>
          </article>
        ))}
      </div>

      {/* CTA bas de page */}
      <div className="mt-16 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
        <h2 className="mb-3 font-playfair text-2xl font-bold">
          Prêt à simplifier la gestion de votre cabinet ?
        </h2>
        <p className="mb-6 text-white/80">
          Plan Free gratuit pour toujours. Sans carte bancaire.
        </p>
        <a
          href="https://psylib.eu/login"
          className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
        >
          Essayer PsyLib gratuitement
        </a>
      </div>
    </div>
    </>
  );
}

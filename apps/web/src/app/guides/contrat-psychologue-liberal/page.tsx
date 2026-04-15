import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contrat psychologue libéral : modèles, sous-location et clauses essentielles 2026 | PsyLib',
  description:
    'Quels contrats un psychologue libéral doit-il avoir ? Contrat de location de cabinet, convention de sous-location, contrat de collaboration libérale — modèles et points de vigilance.',
  keywords: ['contrat psychologue libéral', 'sous-location cabinet psychologue', 'collaboration libérale psychologue', 'contrat location cabinet'],
  alternates: { canonical: 'https://psylib.eu/guides/contrat-psychologue-liberal' },
  openGraph: {
    title: 'Contrat psychologue libéral : modèles, sous-location et clauses essentielles 2026',
    description: 'Contrats de location, collaboration libérale et sous-location pour psychologues.',
    url: 'https://psylib.eu/guides/contrat-psychologue-liberal',
    type: 'article',
    locale: 'fr_FR',
    siteName: 'PsyLib',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Contrat psychologue libéral : modèles, sous-location et clauses essentielles 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/contrat-psychologue-liberal' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qu\'est-ce qu\'un contrat de collaboration libérale pour psychologue ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Le contrat de collaboration libérale (ou remplacement) lie deux psychologues libéraux : le titulaire qui met son cabinet à disposition et le collaborateur qui exerce de façon indépendante sous sa marque. Il précise les modalités d\'utilisation du cabinet, les rétrocessions d\'honoraires éventuelles et les obligations respectives. Il doit être écrit et enregistré auprès du SIE (Service des Impôts des Entreprises).' },
        },
        {
          '@type': 'Question',
          name: 'Peut-on sous-louer son cabinet à un autre psychologue ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Oui, un psychologue propriétaire ou locataire peut sous-louer son local professionnel à un confrère. La sous-location doit être autorisée par le bail principal et faire l\'objet d\'un contrat écrit. Le montant de la sous-location ne doit pas dépasser le loyer principal. Le sous-locataire devient locataire et est responsable de la conformité de son exercice (assurance, ADELI).' },
        },
        {
          '@type': 'Question',
          name: 'Quelles clauses sont essentielles dans un contrat de location de cabinet ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Les clauses essentielles d\'un contrat de location de cabinet professionnel pour psychologue sont : durée et conditions de résiliation, montant du loyer et indexation, description précise des locaux et équipements, obligations d\'entretien, clause de non-concurrence le cas échéant, et autorisation expresse de sous-location si nécessaire.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Contrat psychologue libéral', item: 'https://psylib.eu/guides/contrat-psychologue-liberal' },
      ],
    },
  ],
};

export default function PageContratPsychologue() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Contrat psychologue libéral</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide juridique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Contrat psychologue libéral : sous-location, collaboration et clauses essentielles
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Les contrats indispensables pour exercer en libéral et sécuriser son installation.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            L&apos;installation en libéral nécessite plusieurs contrats dont la rédaction méticuleuse
            protège le praticien. Location du cabinet, collaboration avec un confrère, sous-location
            à un tiers — chaque situation a ses spécificités juridiques. Ce guide dresse un panorama
            des contrats utiles au psychologue libéral et des points de vigilance à surveiller.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">1. Le bail commercial ou professionnel</h2>
          <p className="mb-4 leading-relaxed">
            Le bail professionnel (6 ans minimum, résiliable à tout moment par le locataire avec
            préavis de 6 mois) est le cadre juridique le plus courant pour louer un local à usage
            de cabinet. Il offre flexibilité et protection. Le bail commercial (3/6/9) est plus
            contraignant mais confère un droit au renouvellement plus solide. Pour les cabinets
            partagés ou les sous-locations à l&apos;heure, un contrat spécifique est généralement utilisé.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">2. Le contrat de collaboration libérale</h2>
          <p className="mb-4 leading-relaxed">
            La collaboration libérale entre psychologues permet à un collaborateur d&apos;exercer
            dans le cabinet d&apos;un titulaire en conservant son indépendance complète. Le contrat
            doit préciser : durée, modalités de résiliation, accès aux équipements, éventuelle
            rétrocession d&apos;honoraires, accès à la clientèle et clause de non-concurrence
            post-collaboration.
          </p>
          <p className="mb-4 leading-relaxed">
            Attention : le contrat de collaboration libérale ne doit pas masquer un lien de
            subordination, qui relèverait du droit du travail. Le collaborateur doit conserver
            une totale indépendance dans l&apos;organisation de son travail.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">3. Formaliser les accords avec PsyLib</h2>
          <p className="mb-4 leading-relaxed">
            PsyLib facilite la gestion multi-praticiens. Si vous partagez un cabinet,
            chaque psychologue dispose de son propre espace étanche, avec ses propres patients,
            ses propres agendas et sa propre facturation. Les données sont strictement isolées
            selon la réglementation HDS.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Cabinet partagé ? Gérez-le avec PsyLib</h2>
          <p className="mb-6 text-white/80">Espaces étanches par praticien, données isolées, agendas indépendants. Commencez gratuitement.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Faut-il faire enregistrer un contrat de collaboration libérale ?", a: "Oui. Selon l'article 151 nonies du Code général des impôts, le contrat de collaboration libérale doit être enregistré auprès du Service des Impôts des Entreprises (SIE) dans le mois suivant sa signature. Les droits d'enregistrement sont symboliques (125 euros fixes en 2026). L'enregistrement donne date certaine au contrat." },
              { q: "Peut-on prévoir une clause de non-concurrence dans un contrat de collaboration libérale ?", a: "Oui, mais les clauses de non-concurrence doivent être limitées dans le temps (généralement 1 à 2 ans), dans l'espace (rayon géographique défini) et être proportionnées à la protection d'un intérêt légitime. Une clause excessive ou illimitée serait nulle. Il est recommandé de faire rédiger ces clauses par un avocat spécialisé professions libérales." },
              { q: "Un psychologue en micro-BNC peut-il conclure un contrat de collaboration ?", a: "Oui, le régime fiscal (micro-BNC ou déclaration contrôlée) n'a pas d'incidence sur la possibilité de conclure un contrat de collaboration libérale. Les deux praticiens conservent leur statut fiscal indépendant. Le contrat de collaboration définit les modalités d'exercice et d'utilisation des locaux, pas le régime d'imposition." },
            ].map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>Guide rédigé par l&apos;équipe PsyLib — Mars 2026.{' '}<Link href="/guides" className="text-[#3D52A0] hover:underline">Tous les guides</Link></p>
        </footer>
      </article>
    </>
  );
}

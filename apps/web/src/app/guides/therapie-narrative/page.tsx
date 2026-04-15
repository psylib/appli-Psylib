import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Thérapie narrative : principes, applications et intégration en cabinet | PsyLib',
  description:
    'La thérapie narrative (White & Epston) recentre le patient comme expert de sa propre vie. Principes de l\'externalisation, re-narration et pratiques narratives pour les psychologues libéraux.',
  keywords: ['thérapie narrative', 'Michael White thérapie narrative', 'externalisation thérapie', 'pratiques narratives psychologie'],
  alternates: { canonical: 'https://psylib.eu/guides/therapie-narrative' },
  openGraph: {
    title: 'Thérapie narrative : principes, applications et intégration en cabinet',
    description: 'Externalisation, re-narration et pratiques narratives pour les psychologues.',
    url: 'https://psylib.eu/guides/therapie-narrative',
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
      headline: 'Thérapie narrative : principes, applications et intégration en cabinet',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/therapie-narrative' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qu\'est-ce que la thérapie narrative ?',
          acceptedAnswer: { '@type': 'Answer', text: 'La thérapie narrative, développée par Michael White et David Epston dans les années 1980, part du principe que les problèmes ne sont pas inhérents aux personnes mais qu\'ils sont des constructions narratives façonnées par le contexte social et culturel. Le travail thérapeutique consiste à identifier les récits dominants problématiques et à construire des récits alternatifs plus riches et libérateurs.' },
        },
        {
          '@type': 'Question',
          name: 'Qu\'est-ce que l\'externalisation en thérapie narrative ?',
          acceptedAnswer: { '@type': 'Answer', text: 'L\'externalisation est une technique clé de la thérapie narrative qui consiste à séparer le problème de la personne. Plutôt que de dire "je suis anxieux", on dit "l\'anxiété s\'empare de moi". Cette distinction crée une distance entre la personne et le problème, permettant d\'examiner l\'influence du problème et d\'identifier les moments où la personne a résisté à cette influence.' },
        },
        {
          '@type': 'Question',
          name: 'Pour quels problèmes la thérapie narrative est-elle indiquée ?',
          acceptedAnswer: { '@type': 'Answer', text: 'La thérapie narrative est particulièrement adaptée aux problématiques liées à l\'identité et à l\'estime de soi, aux troubles alimentaires, au deuil, aux traumatismes complexes, aux problèmes relationnels et familiaux. Elle est aussi utilisée avec les enfants via des externalisations créatives (le monstre de l\'inquiétude, par exemple).' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Thérapie narrative', item: 'https://psylib.eu/guides/therapie-narrative' },
      ],
    },
  ],
};

export default function PageTherapieNarrative() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Thérapie narrative</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide clinique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Thérapie narrative : principes, applications et intégration en cabinet
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Externalisation, récits alternatifs et pratiques narratives — une approche puissante pour les psychologues libéraux.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La thérapie narrative, développée par Michael White (Australie) et David Epston
            (Nouvelle-Zélande), offre un cadre radicalement différent des approches cognitives
            ou psychanalytiques. Au lieu de chercher des dysfonctionnements à corriger, elle
            accompagne le patient dans la réécriture de son histoire de vie, en mettant en lumière
            ses compétences, ses valeurs et les récits alternatifs plus porteurs. Ce guide présente
            les fondements de cette approche et ses applications pratiques en libéral.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Fondements théoriques</h2>
          <p className="mb-4 leading-relaxed">
            La thérapie narrative s&apos;ancre dans le constructionnisme social et la pensée
            post-structuraliste (Foucault). Elle postule que les récits que nous portons sur
            nous-mêmes sont des constructions sociales — façonnées par notre famille, notre culture,
            nos expériences — et non des vérités immuables. Ces récits &quot;dominants&quot;
            peuvent être oppressifs, en ne laissant pas de place aux expériences qui les contredisent.
          </p>
          <p className="mb-4 leading-relaxed">
            Le travail thérapeutique consiste à identifier ces récits dominants problématiques,
            à les déconstruire, et à construire des &quot;récits alternatifs&quot; plus riches,
            davantage ancrés dans les valeurs et les compétences réelles de la personne.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Techniques clés</h2>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">L&apos;externalisation</h3>
          <p className="mb-4 leading-relaxed">
            &quot;Le problème est le problème, la personne n&apos;est pas le problème&quot; est
            la maxime fondamentale de la thérapie narrative. L&apos;externalisation consiste à
            nommer le problème comme une entité distincte de la personne et à explorer son influence
            sur la vie de cette dernière — tout en cherchant les exceptions (moments où la personne
            a résisté à l&apos;influence du problème).
          </p>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">Questions à résultats uniques</h3>
          <p className="mb-4 leading-relaxed">
            Le thérapeute narratif explore les &quot;résultats uniques&quot; — ces moments où le
            problème était absent ou moins influent. Ces exceptions deviennent les matériaux
            pour construire un récit alternatif plus riche et cohérent avec les valeurs du patient.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Documentez votre pratique narrative avec PsyLib</h2>
          <p className="mb-6 text-white/80">Notes de séance structurées, suivi des progrès, dossier patient HDS. Commencez gratuitement.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "La thérapie narrative est-elle validée scientifiquement ?", a: "Oui. Des méta-analyses et revues systématiques ont montré l'efficacité de la thérapie narrative pour diverses problématiques, notamment les troubles alimentaires, la dépression, l'anxiété et les traumatismes. Son niveau de preuve est considéré comme modéré à bon selon les études, comparable aux autres approches humanistes." },
              { q: "Comment se former à la thérapie narrative en France ?", a: "Plusieurs organismes proposent des formations à la thérapie narrative en France : l'IFNT (Institut Français de Thérapie Narrative), des formations courtes à Paris et Lyon, et des supervisions avec des praticiens certifiés. Des formations en ligne existent également. La formation complète comprend généralement 150 à 200 heures de pratique supervisée." },
              { q: "La thérapie narrative est-elle utilisable avec les enfants ?", a: "Oui, c'est l'une de ses forces. Avec les enfants, l'externalisation prend des formes créatives : dessiner le monstre de l'inquiétude, lui donner un nom, explorer ce qui l'affaiblit. Cette approche ludique est très efficace pour les enfants anxieux, les problèmes d'énurésie ou les difficultés comportementales." },
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

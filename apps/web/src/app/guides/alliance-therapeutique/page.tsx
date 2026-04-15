import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Alliance thérapeutique : définition, mesure et facteurs de succès | PsyLib',
  description:
    'L\'alliance thérapeutique est le prédicteur le plus robuste de l\'efficacité en psychothérapie. Comprendre ses composantes, la mesurer et la renforcer dans votre pratique libérale.',
  keywords: ['alliance thérapeutique', 'relation thérapeutique', 'alliance psychothérapeutique', 'facteurs communs thérapie'],
  alternates: { canonical: 'https://psylib.eu/guides/alliance-therapeutique' },
  openGraph: {
    title: 'Alliance thérapeutique : définition, mesure et facteurs de succès',
    description: 'Composantes, mesure et renforcement de l\'alliance thérapeutique dans la pratique libérale.',
    url: 'https://psylib.eu/guides/alliance-therapeutique',
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
      headline: 'Alliance thérapeutique : définition, mesure et facteurs de succès',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/alliance-therapeutique' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qu\'est-ce que l\'alliance thérapeutique ?',
          acceptedAnswer: { '@type': 'Answer', text: 'L\'alliance thérapeutique désigne la qualité de la relation de collaboration entre le praticien et son patient. Elle comprend trois composantes selon Bordin (1979) : l\'accord sur les objectifs de la thérapie, l\'accord sur les tâches thérapeutiques, et le lien affectif positif entre praticien et patient.' },
        },
        {
          '@type': 'Question',
          name: 'Comment mesurer l\'alliance thérapeutique ?',
          acceptedAnswer: { '@type': 'Answer', text: 'L\'alliance thérapeutique peut être mesurée à l\'aide d\'outils validés comme le WAI (Working Alliance Inventory), le SRS (Session Rating Scale) en 4 items, ou le HAQ (Helping Alliance Questionnaire). Ces outils sont administrés au patient après chaque séance ou périodiquement. PsyLib intègre ces échelles dans son module d\'outcome tracking.' },
        },
        {
          '@type': 'Question',
          name: 'L\'alliance thérapeutique prédit-elle les résultats de la thérapie ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Oui. Les méta-analyses (Horvath et al., 2011 ; Flückiger et al., 2018) montrent que l\'alliance thérapeutique est le prédicteur le plus robuste des résultats en psychothérapie, expliquant environ 30 % de la variance des résultats thérapeutiques — davantage que la technique thérapeutique elle-même.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Alliance thérapeutique', item: 'https://psylib.eu/guides/alliance-therapeutique' },
      ],
    },
  ],
};

export default function PageAllianceTherapeutique() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Alliance thérapeutique</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide clinique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Alliance thérapeutique : définition, mesure et facteurs de succès
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Le prédicteur numéro un de l&apos;efficacité en psychothérapie — comment la construire, la mesurer et la réparer.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Des décennies de recherche en psychothérapie convergent vers un constat : ce n&apos;est pas
            tant la technique thérapeutique qui prédit les résultats, mais la qualité de la relation
            entre le praticien et son patient. L&apos;alliance thérapeutique — ce lien de collaboration
            orienté vers des objectifs partagés — explique environ 30 % de la variance des résultats,
            davantage que toute approche spécifique. Ce guide examine ses composantes, ses outils
            de mesure et les stratégies pour la renforcer.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Les trois composantes de Bordin</h2>
          <p className="mb-4 leading-relaxed">
            Le modèle le plus cité dans la littérature est celui de Bordin (1979), qui définit
            l&apos;alliance de travail selon trois composantes interdépendantes :
          </p>
          <div className="space-y-3">
            {[
              { title: 'Accord sur les objectifs', desc: 'Patient et praticien s\'entendent sur les buts visés par la thérapie. Un désaccord sur les objectifs est l\'une des causes les plus fréquentes de rupture prématurée du suivi.' },
              { title: 'Accord sur les tâches', desc: 'Les deux parties comprennent et acceptent les méthodes utilisées en séance. Un patient TCC qui ne comprend pas pourquoi on lui demande un journal de pensées est moins susceptible de le remplir.' },
              { title: 'Lien affectif', desc: 'La qualité émotionnelle de la relation : le patient se sent entendu, respecté et compris. C\'est la composante la plus directement liée à la satisfaction thérapeutique.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 p-4">
                <p className="mb-1 font-semibold text-[#3D52A0]">{item.title}</p>
                <p className="text-sm text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Mesurer l&apos;alliance en pratique</h2>
          <p className="mb-4 leading-relaxed">
            L&apos;outcome tracking systématique, dont fait partie la mesure de l&apos;alliance,
            est associé à de meilleurs résultats thérapeutiques (Lambert, 2010). Le Session Rating
            Scale (SRS) en 4 items visuels analogiques est l&apos;outil le plus pratique en libéral :
            il prend moins d&apos;une minute à remplir et permet de détecter précocement les ruptures
            d&apos;alliance avant qu&apos;elles ne conduisent à un abandon.
          </p>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre le SRS et d&apos;autres outils de mesure dans son module d&apos;outcome
            tracking. Les scores sont visualisés sur un graphique évolutif, permettant au praticien
            d&apos;identifier les séances où l&apos;alliance s&apos;est fragilisée et d&apos;adapter
            son approche en conséquence.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Réparer les ruptures d&apos;alliance</h2>
          <p className="mb-4 leading-relaxed">
            Les ruptures d&apos;alliance sont inévitables et, paradoxalement, offrent une opportunité
            thérapeutique. La recherche (Safran & Muran, 2000) montre que les thérapeutes capables
            de détecter et de réparer une rupture obtiennent de meilleurs résultats que ceux dont
            les alliances restent superficiellement stables. La clé est de pouvoir nommer la rupture
            avec tact, explorer le ressenti du patient et ajuster la posture thérapeutique.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Mesurez l&apos;alliance avec vos patients</h2>
          <p className="mb-6 text-white/80">Outcome tracking intégré, SRS et PHQ-9, visualisation graphique. Commencez gratuitement.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Quelle différence entre alliance thérapeutique et relation thérapeutique ?", a: "La relation thérapeutique est un terme plus large désignant l'ensemble des dimensions relationnelles entre praticien et patient (incluant le contre-transfert, l'empathie, la chaleur). L'alliance thérapeutique en est la composante fonctionnelle et mesurable : l'accord sur les objectifs, les tâches et le lien affectif." },
              { q: "L'alliance thérapeutique est-elle différente selon les approches ?", a: "Oui. En TCC, l'alliance inclut un fort accord sur les tâches (exercices, exposition). En psychanalyse, le lien affectif et le travail sur le transfert sont centraux. Les thérapies humanistes mettent l'accent sur la congruence et l'empathie du thérapeute. Dans tous les cas, c'est le facteur commun le plus prédictif des résultats." },
              { q: "Comment construire une alliance avec un patient réticent ?", a: "Avec un patient ambivalent ou résistant, commencer par explorer les craintes vis-à-vis de la thérapie, valider ses réticences sans les contester frontalement, et adapter les objectifs de façon pragmatique à ce qui est important pour lui. L'entretien motivationnel offre un cadre structuré pour cette situation." },
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

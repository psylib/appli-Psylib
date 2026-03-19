import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Supervision psychologue libérale : guide complet 2026 | PsyLib',
  description:
    'Supervision, intervision, groupes de pairs — tout ce qu\'un psychologue libéral doit savoir pour maintenir sa santé professionnelle et sa qualité clinique. PsyLib intègre un module réseau de supervision.',
  keywords: [
    'supervision psychologue libérale',
    'groupe intervision psy',
    'supervision obligatoire psychologue',
    'supervision clinique psychologue',
    'trouver superviseur psychologue',
    'intervision psychologue libéral',
    'hygiène professionnelle psy',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/supervision-psychologue-liberale' },
  openGraph: {
    title: 'Supervision psychologue libérale : guide complet 2026',
    description:
      'Supervision individuelle, intervision, groupes de pairs — guide complet pour les psychologues libéraux. Trouver un superviseur et organiser sa pratique réflexive.',
    url: 'https://psylib.eu/guides/supervision-psychologue-liberale',
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
      headline: 'Supervision psychologue libérale : guide complet 2026',
      datePublished: '2026-03-16',
      dateModified: '2026-03-16',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'La supervision est-elle obligatoire pour un psychologue libéral en France ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Non, la supervision n'est pas légalement obligatoire pour les psychologues libéraux en France. Cependant, le Code de déontologie des psychologues recommande fortement le recours à la supervision comme condition de maintien de la qualité de la pratique et de la santé professionnelle. Certaines approches (psychanalyse, EMDR) en font une condition quasi-formelle de pratique.",
          },
        },
        {
          '@type': 'Question',
          name: "Quelle est la différence entre supervision et intervision ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "La supervision implique un superviseur plus expérimenté qui accompagne le supervisé dans sa pratique clinique. C'est une relation asymétrique avec un expert. L'intervision (ou groupe de pairs) réunit des praticiens de niveau comparable qui s'éclairent mutuellement sur leurs pratiques. Les deux dispositifs sont complémentaires et recommandés.",
          },
        },
        {
          '@type': 'Question',
          name: 'À quelle fréquence doit-on faire de la supervision ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Il n'existe pas de fréquence officielle. En pratique, les recommandations professionnelles suggèrent une supervision individuelle mensuelle en début de carrière, puis trimestrielle une fois installé. Pour l'intervision en groupe, une réunion mensuelle est souvent considérée comme un minimum efficace.",
          },
        },
        {
          '@type': 'Question',
          name: 'Comment trouver un superviseur adapté à son orientation thérapeutique ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les associations professionnelles (AETMC pour la TCC, SFPPF pour la psychanalyse, IFAPP pour l'ACT) proposent des annuaires de superviseurs. PsyLib intègre un réseau professionnel permettant de contacter des confrères spécialisés pour des supervisions ou des groupes d'intervision.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Supervision psychologue libérale',
          item: 'https://psylib.eu/guides/supervision-psychologue-liberale',
        },
      ],
    },
  ],
};

export default function PageSupervision() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Supervision psychologue libérale</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Supervision psychologue libérale : guide complet 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Supervision individuelle, intervision, groupes de pairs — comprendre, organiser et
            maintenir une pratique réflexive de qualité tout au long de sa carrière.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            L&apos;exercice en libéral expose le psychologue à un double risque : l&apos;isolement
            professionnel et la fatigue compassionnelle. Sans tiers extérieur pour prendre
            du recul sur sa pratique, le praticien peut progressivement perdre de sa qualité
            clinique, s&apos;enliser dans des dynamiques relationnelles complexes avec ses
            patients, ou développer un épuisement professionnel. La supervision et
            l&apos;intervision sont les dispositifs de protection professionnelle les plus
            efficaces contre ces risques.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Qu&apos;est-ce que la supervision clinique ?
          </h2>
          <p className="mb-4 leading-relaxed">
            La supervision clinique est un processus d&apos;accompagnement professionnel dans
            lequel un praticien expérimenté — le superviseur — aide un praticien moins expérimenté
            — le supervisé — à analyser et à améliorer sa pratique clinique. Elle peut porter
            sur des situations cliniques complexes, des impasses thérapeutiques, des réactions
            contre-transférentielles ou des questionnements éthiques.
          </p>
          <p className="mb-4 leading-relaxed">
            La supervision individuelle offre un espace confidentiel et personnalisé, particulièrement
            adapté aux situations cliniques délicates ou aux questionnements profonds sur
            l&apos;identité professionnelle. Elle représente un investissement financier (80 à
            120 euros par séance) que de nombreux praticiens déduisent de leurs charges
            professionnelles.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Les fonctions de la supervision
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Fonction formative : développer les compétences cliniques</li>
            <li>Fonction normative : maintenir les standards éthiques et déontologiques</li>
            <li>Fonction de soutien : prévenir l&apos;épuisement professionnel et la fatigue compassionnelle</li>
            <li>Fonction réflexive : développer la capacité de mentalisation clinique</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            L&apos;intervision : la supervision entre pairs
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;intervision est une forme de supervision horizontale entre praticiens de
            niveau comparable. Contrairement à la supervision individuelle, il n&apos;y a
            pas de hiérarchie de compétence : chaque participant apporte son regard, son
            expérience et ses questions. Le groupe s&apos;auto-régule selon des règles
            établies en commun.
          </p>
          <p className="mb-4 leading-relaxed">
            L&apos;intervision présente plusieurs avantages spécifiques pour le praticien
            libéral : elle rompt l&apos;isolement professionnel inhérent à l&apos;exercice
            en solo, elle offre une diversité de perspectives cliniques (notamment si le groupe
            réunit des praticiens d&apos;orientations différentes), et elle est généralement
            moins coûteuse que la supervision individuelle. Elle peut se dérouler en présentiel
            ou en visio.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Comment organiser un groupe d&apos;intervision
          </h3>
          <p className="mb-4 leading-relaxed">
            Un groupe d&apos;intervision efficace repose sur quelques principes fondamentaux :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Taille optimale : 4 à 8 participants</li>
            <li>Fréquence régulière : mensuelle ou bimensuelle</li>
            <li>Règles de confidentialité strictes : ce qui est dit dans le groupe reste dans le groupe</li>
            <li>Rotation de la présentation des cas cliniques</li>
            <li>Un cadre temporel défini à l&apos;avance</li>
            <li>La possibilité d&apos;inviter ponctuellement un superviseur externe</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Supervision et orientation thérapeutique
          </h2>
          <p className="mb-4 leading-relaxed">
            Le choix du superviseur doit tenir compte de l&apos;orientation thérapeutique
            du praticien. Un psychologue cognitiviste cherchera naturellement un superviseur
            formé en TCC ou ACT. Un praticien d&apos;orientation psychodynamique optera
            pour un analyste ou un psychothérapeute analytique. Certaines approches imposent
            même formellement une supervision : la formation EMDR conditionne la certification
            à un nombre minimal d&apos;heures de supervision.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Où trouver un superviseur en France ?
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Annuaire AFTCC (Association Francophone de Thérapie Cognitive et Comportementale)</li>
            <li>Annuaire SFPPF (Société Française de Psychothérapie Psychanalytique de l&apos;Enfant et de l&apos;Adolescent)</li>
            <li>Réseau professionnel PsyLib (confrères ayant renseigné une activité de supervision)</li>
            <li>Anciens formateurs des diplômes universitaires spécialisés</li>
            <li>Recommandations de confrères au sein de groupes d&apos;intervision existants</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Le réseau professionnel PsyLib pour la supervision
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre un module de réseau professionnel permettant aux psychologues de
            se connecter entre eux pour des adressages, des supervisions ou des groupes
            d&apos;intervision. Chaque praticien inscrit peut renseigner son orientation
            thérapeutique, sa disponibilité pour la supervision, et sa zone géographique.
          </p>
          <p className="mb-4 leading-relaxed">
            Le réseau professionnel de PsyLib permet de contacter des confrères de manière
            sécurisée, de former ou rejoindre un groupe d&apos;intervision virtuel, et
            d&apos;organiser les échanges psy-to-psy dans un environnement confidentiel,
            distinct des outils de messagerie grand public non conformes.
          </p>
          <p className="mb-4 leading-relaxed">
            La supervision est également liée à la prévention du burnout — un enjeu majeur
            pour les psychologues libéraux. Pour approfondir ce sujet, consultez notre guide
            sur la{' '}
            <Link href="/guides/burnout-psychologue-liberale" className="text-[#3D52A0] hover:underline">
              prévention du burnout du psychologue libéral
            </Link>.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Réseau professionnel, messagerie sécurisée, gestion du cabinet — tout en un,
            conforme HDS. Sans carte bancaire.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer l&apos;essai gratuit
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "La supervision est-elle obligatoire pour un psychologue libéral en France ?",
                a: "Non, elle n'est pas légalement obligatoire. Mais le Code de déontologie des psychologues la recommande fortement. Certaines approches spécialisées (EMDR, psychanalyse) en font une condition quasi-formelle de pratique.",
              },
              {
                q: "Quelle est la différence entre supervision et intervision ?",
                a: "La supervision est une relation asymétrique avec un expert plus expérimenté. L'intervision (groupe de pairs) réunit des praticiens de niveau comparable qui s'éclairent mutuellement. Les deux sont complémentaires.",
              },
              {
                q: "À quelle fréquence faire de la supervision ?",
                a: "En début de carrière : une supervision individuelle mensuelle est recommandée. Une fois installé : trimestrielle. Pour l'intervision en groupe : mensuelle est souvent considérée comme un minimum.",
              },
              {
                q: "Comment trouver un superviseur adapté à son orientation ?",
                a: "Via les annuaires des associations professionnelles (AFTCC pour la TCC, SFPPF pour la psychanalyse), les anciens formateurs de DU spécialisés, et le réseau professionnel PsyLib.",
              },
              {
                q: "PsyLib peut-il m'aider à trouver un groupe d'intervision ?",
                a: "Oui. PsyLib intègre un réseau professionnel où les psychologues peuvent renseigner leur disponibilité pour la supervision ou l'intervision, leur orientation thérapeutique et leur zone géographique. Vous pouvez contacter des confrères et former des groupes de travail via la messagerie sécurisée de la plateforme.",
              },
            ].map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Guide rédigé par l&apos;équipe PsyLib — Mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour à l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/guides" className="text-[#3D52A0] hover:underline">Tous les guides</Link>
          </p>
        </footer>
      </article>
    </>
  );
}

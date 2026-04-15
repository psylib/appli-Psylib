import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Psychologue enfant et adolescent : spécialités, tarifs et prise en charge 2026 | PsyLib',
  description:
    'Guide complet sur la psychologie de l\'enfant et de l\'adolescent : spécialités, approches thérapeutiques, tarifs, différences avec le psychiatre et comment choisir le bon praticien.',
  keywords: [
    'psychologue enfant adolescent',
    'psy enfant',
    'psychologue pédiatrique',
    'thérapie adolescent',
    'consultation psychologue enfant',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/psychologue-enfant-adolescent' },
  openGraph: {
    title: 'Psychologue enfant et adolescent : spécialités, tarifs et prise en charge 2026',
    description: 'Guide complet : spécialités, approches thérapeutiques et comment choisir le bon praticien.',
    url: 'https://psylib.eu/guides/psychologue-enfant-adolescent',
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
      headline: 'Psychologue enfant et adolescent : spécialités, tarifs et prise en charge 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/psychologue-enfant-adolescent' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'À partir de quel âge peut-on consulter un psychologue pour un enfant ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Il n\'y a pas d\'âge minimum pour consulter un psychologue pour un enfant. Des praticiens spécialisés en psychologie périnatale peuvent accompagner les bébés dès les premiers mois de vie dans le cadre de troubles de l\'attachement ou de difficultés relationnelles précoces. Pour les consultations classiques, les demandes concernent souvent des enfants à partir de 3-4 ans pour des troubles comportementaux ou du développement.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quelle est la différence entre un psychologue et un pédopsychiatre ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Le pédopsychiatre est un médecin spécialisé en psychiatrie de l\'enfant : il peut prescrire des médicaments, établir des diagnostics psychiatriques et hospitaliser si nécessaire. Le psychologue spécialisé en psychologie de l\'enfant est un non-médecin titulaire d\'un master 2 de psychologie : il réalise des bilans psychologiques et assure le suivi thérapeutique sans prescription médicamenteuse.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quel est le tarif d\'une consultation chez un psychologue pour enfant ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les tarifs des psychologues spécialisés en enfance varient entre 60 et 120 euros selon la région et l\'expérience du praticien. Les bilans neuropsychologiques (TDAH, dyslexie, HPI) sont facturés sous forme de forfait généralement entre 350 et 700 euros pour l\'ensemble de la prestation (passation, dépouillement, compte-rendu). Certaines mutuelles remboursent partiellement ces consultations.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Psychologue enfant adolescent', item: 'https://psylib.eu/guides/psychologue-enfant-adolescent' },
      ],
    },
  ],
};

export default function PagePsychologueEnfant() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Psychologue enfant adolescent</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide pratique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Psychologue enfant et adolescent : spécialités, tarifs et prise en charge
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Comment choisir le bon praticien, quelles approches pour quels besoins, et comment gérer un cabinet pédiatrique.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La psychologie de l&apos;enfant et de l&apos;adolescent est un domaine à part entière, nécessitant
            une formation spécialisée et des outils adaptés aux différentes tranches d&apos;âge. Qu&apos;il
            s&apos;agisse de troubles du développement, de difficultés scolaires, d&apos;anxiété infantile
            ou de problématiques adolescentes, les praticiens spécialisés disposent d&apos;approches
            thérapeutiques validées. Ce guide s&apos;adresse aux parents en quête d&apos;information et
            aux psychologues souhaitant développer leur pratique pédiatrique.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Motifs de consultation fréquents</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { age: 'Petite enfance (0-6 ans)', motifs: 'Troubles du sommeil, difficultés alimentaires, retards de langage, troubles de l\'attachement' },
              { age: 'Enfance (6-12 ans)', motifs: 'Anxiété scolaire, TDAH, dys (dyslexie, dyspraxie), troubles du comportement, harcèlement' },
              { age: 'Pré-adolescence (10-14 ans)', motifs: 'Troubles alimentaires débutants, dépression, difficultés identitaires, crises familiales' },
              { age: 'Adolescence (14-18 ans)', motifs: 'Dépression, addictions, troubles anxieux, tentatives de suicide, orientations sexuelles/identité' },
            ].map((item) => (
              <div key={item.age} className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 font-semibold text-[#3D52A0]">{item.age}</p>
                <p className="text-sm text-gray-700">{item.motifs}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Approches thérapeutiques pour l&apos;enfant</h2>
          <p className="mb-4 leading-relaxed">
            Les thérapies adaptées à l&apos;enfant diffèrent fondamentalement des approches adultes.
            Le jeu thérapeutique, le dessin, les médiations artistiques et les jeux de rôle sont des
            outils indispensables pour les jeunes enfants qui n&apos;ont pas encore accès à la verbalisation
            abstraite. Pour les adolescents, les TCC adaptées à l&apos;adolescence, la thérapie narrative
            et les approches systémiques (incluant les parents) montrent de bons résultats.
          </p>
          <p className="mb-4 leading-relaxed">
            Les bilans neuropsychologiques occupent une place importante dans la pratique pédiatrique.
            Réalisés avec des outils standardisés (WISC-V, NEPSY-II, WPPSI-IV), ils permettent
            d&apos;objectiver des difficultés cognitives et d&apos;orienter la prise en charge scolaire
            (RASED, MDPH, aménagements pédagogiques).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Gérer un cabinet pédiatrique avec PsyLib</h2>
          <p className="mb-4 leading-relaxed">
            Les spécificités du cabinet pédiatrique impliquent des adaptations pratiques : le patient
            légal n&apos;est pas le patient réel (l&apos;enfant), les rendez-vous sont souvent pris
            par les parents, le dossier implique plusieurs interlocuteurs (parents, école, médecin).
            PsyLib permet de gérer cette complexité avec des dossiers patients adaptés, des notes
            de séance structurées par âge et des outils de facturation incluant le bilan comme
            prestation distincte.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Optimisez votre cabinet pédiatrique</h2>
          <p className="mb-6 text-white/80">Dossiers patients, bilans, facturation et agenda en ligne. Commencez gratuitement.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Faut-il le consentement des deux parents pour consulter un psychologue avec son enfant ?", a: "En France, l'autorité parentale est généralement exercée conjointement par les deux parents. Dans la pratique, un seul parent peut amener l'enfant en consultation sans l'accord exprès de l'autre. Cependant, en cas de conflit parental avéré, le praticien doit naviguer avec prudence et peut être amené à demander une clarification sur l'accord parental." },
              { q: "À partir de quel âge un adolescent peut-il consulter sans ses parents ?", a: "Un mineur peut consulter seul un professionnel de santé (incluant un psychologue) à partir de 16 ans sans l'accord parental. En dessous de 16 ans, la règle est plus nuancée : le praticien peut recevoir le mineur seul s'il juge que c'est dans l'intérêt de l'enfant, mais la communication avec les parents reste généralement recommandée." },
              { q: "Comment choisir entre un psychologue et un orthophoniste pour un enfant en difficulté scolaire ?", a: "Ces deux professionnels sont complémentaires. L'orthophoniste traite les troubles du langage oral et écrit (dyslexie, dysorthographie, bégaiement) avec des séances remboursées sur prescription médicale. Le psychologue évalue le profil cognitif global (bilan neuropsychologique) et accompagne les aspects émotionnels et comportementaux. Un bilan psychologique peut orienter vers une rééducation orthophonique." },
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

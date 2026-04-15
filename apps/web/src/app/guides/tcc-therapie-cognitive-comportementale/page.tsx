import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadMagnetCTA } from '@/components/lead-magnet-cta';

export const metadata: Metadata = {
  title: 'TCC — Thérapie Cognitive et Comportementale : outils numériques pour les psys | PsyLib',
  description:
    'Présentation de la TCC, outils de suivi (grilles de pensées, tableaux ABCs), notes structurées et templates TCC dans PsyLib pour les psychologues libéraux en 2026.',
  keywords: [
    'TCC thérapie cognitive comportementale',
    'logiciel TCC psychologue',
    'notes TCC structurées',
    'grille de pensées TCC',
    'suivi TCC numérique',
    'outil TCC psychologue libéral',
    'template TCC séance',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/tcc-therapie-cognitive-comportementale' },
  openGraph: {
    title: 'TCC — Thérapie Cognitive et Comportementale : outils numériques pour les psys',
    description:
      'Outils numériques pour les praticiens TCC : grilles de pensées, tableaux ABC, notes structurées et templates TCC disponibles dans PsyLib.',
    url: 'https://psylib.eu/guides/tcc-therapie-cognitive-comportementale',
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
      headline: 'TCC — Thérapie Cognitive et Comportementale : outils numériques pour les psys',
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
          name: 'Quels outils numériques existent pour les psychologues TCC ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les psychologues TCC peuvent utiliser des logiciels de gestion de cabinet proposant des templates structurés (colonnes ABC, grilles de pensées automatiques, tableaux d'exposition) intégrés dans les notes de séance. PsyLib propose des templates TCC, ACT et psychodynamique directement liés aux dossiers patients.",
          },
        },
        {
          '@type': 'Question',
          name: 'Comment structurer une note de séance TCC ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Une note TCC structurée comprend typiquement : l'ordre du jour de la séance, la revue des devoirs de la séance précédente, les thèmes abordés et techniques utilisées (restructuration cognitive, exposition, activation comportementale), les nouvelles pensées alternatives identifiées, les devoirs assignés pour la prochaine séance et le niveau de détresse initial et final (échelle 0-10).",
          },
        },
        {
          '@type': 'Question',
          name: "Qu'est-ce que le modèle ABC en TCC ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Le modèle ABC (Antécédent, Behavior/Croyance, Conséquence) est un outil fondamental en TCC. A = situation déclenchante, B = pensées automatiques et croyances, C = réponses émotionnelles et comportementales. Le travail thérapeutique vise à identifier et modifier les croyances en B pour transformer les conséquences en C. PsyLib propose des tableaux ABC préconfigurés dans les templates de notes.",
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
          name: 'TCC thérapie cognitive comportementale',
          item: 'https://psylib.eu/guides/tcc-therapie-cognitive-comportementale',
        },
      ],
    },
  ],
};

export default function PageTCC() {
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
          <span className="text-gray-700">TCC — Thérapie Cognitive et Comportementale</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            TCC — Thérapie Cognitive et Comportementale : outils numériques pour les psys
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Grilles de pensées, tableaux ABC, suivi des devoirs, templates structurés — les outils
            numériques indispensables pour les psychologues pratiquant la TCC en libéral.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La Thérapie Cognitive et Comportementale (TCC) est l&apos;approche thérapeutique la
            plus étudiée scientifiquement et l&apos;une des plus pratiquées en France. Elle
            se distingue par une structure de séance précise, l&apos;utilisation d&apos;outils
            spécifiques (grilles de pensées, tableaux d&apos;exposition, registres comportementaux)
            et l&apos;importance des devoirs inter-séances. Ces caractéristiques font de la TCC
            une pratique particulièrement compatible avec les outils numériques de gestion
            clinique.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les fondements de la TCC
          </h2>
          <p className="mb-4 leading-relaxed">
            Développée dans les années 1960-1970 par Aaron Beck (thérapie cognitive) et complétée
            par les approches comportementales et les thérapies de troisième vague (ACT, MBCT,
            DBT), la TCC repose sur un principe central : nos pensées, nos émotions et nos
            comportements sont interdépendants. Modifier les schémas de pensée dysfonctionnels
            entraîne des changements durables dans les émotions et les comportements.
          </p>
          <p className="mb-4 leading-relaxed">
            La TCC présente une efficacité démontrée pour un large spectre de troubles :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Troubles anxieux (phobies, TAG, trouble panique, TOC, PTSD)</li>
            <li>Dépression unipolaire légère à modérée</li>
            <li>Troubles des conduites alimentaires</li>
            <li>Troubles du sommeil (insomnie)</li>
            <li>Addictions et comportements compulsifs</li>
            <li>Douleur chronique et trouble somatoforme</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            La structure d&apos;une séance TCC : ce que le logiciel doit refléter
          </h2>
          <p className="mb-4 leading-relaxed">
            Contrairement aux approches non directives, la TCC suit une structure de séance
            relativement standardisée que les bons outils numériques doivent pouvoir capturer.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Structure type d&apos;une séance TCC
          </h3>
          <ol className="mb-4 list-decimal list-inside space-y-2 text-gray-700">
            <li>Vérification de l&apos;humeur (évaluation 0-10 ou PHQ-9)</li>
            <li>Revue des devoirs de la séance précédente</li>
            <li>Ordre du jour co-construit avec le patient</li>
            <li>Travail sur un ou deux items de l&apos;agenda (restructuration cognitive, exposition…)</li>
            <li>Résumé de capsule et feedback</li>
            <li>Attribution des devoirs pour la prochaine séance</li>
          </ol>
          <p className="mb-4 leading-relaxed">
            Un template de note TCC structuré dans un logiciel doit permettre de capturer chacune
            de ces étapes sans contrainte de saisie excessive. La note doit être complète en
            5 à 10 minutes, pas en 30 minutes.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les outils TCC clés à digitaliser
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le tableau ABC (Antécédent — Croyance — Conséquence)
          </h3>
          <p className="mb-4 leading-relaxed">
            Le tableau ABC est l&apos;outil central de la restructuration cognitive. Il permet
            d&apos;identifier la situation déclenchante (A), les pensées automatiques et
            croyances associées (B), et les conséquences émotionnelles et comportementales (C).
            La version enrichie — le tableau ABCDE — ajoute la Dispute (D) et l&apos;Effet (E)
            de la remise en question des croyances. Un logiciel adapté doit pouvoir insérer
            ce tableau directement dans la note de séance.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La grille de pensées automatiques à 5 ou 7 colonnes
          </h3>
          <p className="mb-4 leading-relaxed">
            La grille de pensées automatiques (Beck) est utilisée en devoir inter-séances.
            Elle comprend : la date et situation, l&apos;émotion et son intensité, la pensée
            automatique et le taux de conviction, les éléments confirmant et infirmant la pensée,
            la pensée alternative et le nouveau taux de conviction. Digitalisée dans un espace
            patient, le patient peut remplir sa grille depuis son smartphone et le praticien
            la consulte avant la séance suivante.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La hiérarchie d&apos;exposition (pour les phobies et le TOC)
          </h3>
          <p className="mb-4 leading-relaxed">
            La hiérarchie d&apos;exposition liste les situations redoutées par niveau de détresse
            (SUDS : 0-100). Elle guide le programme d&apos;exposition graduée. Un outil numérique
            doit permettre de créer cette hiérarchie, de la modifier séance après séance, et de
            suivre les SUDS associés à chaque item.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Les questionnaires standardisés de suivi
          </h3>
          <p className="mb-4 leading-relaxed">
            La TCC fondée sur les preuves utilise des instruments de mesure standardisés pour
            évaluer l&apos;évolution clinique : PHQ-9 (dépression), GAD-7 (anxiété généralisée),
            Y-BOCS (TOC), PCL-5 (PTSD), ISI (insomnie). Ces scores, passés régulièrement,
            permettent d&apos;objectiver les progrès et d&apos;ajuster la stratégie thérapeutique.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les templates TCC dans PsyLib
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib propose des templates de notes de séance spécifiquement conçus pour la
            pratique TCC. Chaque template intègre les sections typiques d&apos;une séance
            TCC : vérification de l&apos;humeur, revue des devoirs, travail clinique, devoirs
            assignés. Les psychologues peuvent personnaliser ces templates selon leurs
            préférences.
          </p>
          <p className="mb-4 leading-relaxed">
            L&apos;outcome tracking intégré (PHQ-9, GAD-7, CORE-OM) permet de visualiser
            l&apos;évolution des scores dans un graphique lié au dossier du patient. Le
            praticien dispose d&apos;une vue longitudinale de la progression thérapeutique,
            indispensable pour ajuster les indications cliniques.
          </p>
          <p className="mb-4 leading-relaxed">
            Les devoirs assignés en séance peuvent être transmis directement au patient
            via l&apos;espace patient sécurisé de PsyLib. Le patient les consulte depuis son
            smartphone, les complète, et le praticien accède aux résultats avant la séance
            suivante.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Templates TCC, ACT, psychodynamique — outcome tracking PHQ-9, GAD-7 — espace patient.
            Conforme HDS. Sans carte bancaire.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Quels outils numériques existent pour les psychologues TCC ?",
                a: "Des logiciels de gestion de cabinet comme PsyLib proposent des templates de notes TCC structurés, des tableaux ABC, un suivi des devoirs inter-séances, et des questionnaires standardisés (PHQ-9, GAD-7) intégrés directement dans les dossiers patients.",
              },
              {
                q: "Comment structurer une note de séance TCC ?",
                a: "Une note TCC comprend : vérification de l'humeur (0-10), revue des devoirs, ordre du jour, techniques utilisées (restructuration, exposition, activation comportementale), pensées alternatives identifiées, devoirs assignés. PsyLib propose un template préconfigurés pour cela.",
              },
              {
                q: "Qu'est-ce que le modèle ABC en TCC ?",
                a: "A = Antécédent (situation déclenchante), B = Croyance (pensées automatiques), C = Conséquences (émotions, comportements). La version ABCDE ajoute la Dispute et l'Effet. C'est l'outil central de la restructuration cognitive.",
              },
              {
                q: "Les devoirs TCC peuvent-ils être transmis numériquement aux patients ?",
                a: "Oui. PsyLib intègre un espace patient sécurisé où les devoirs (grilles de pensées, exercices) peuvent être assignés directement depuis la note de séance. Le patient les consulte et les remplit depuis son smartphone, le praticien accède aux résultats avant la séance.",
              },
              {
                q: "Comment suivre les progrès d'un patient en TCC ?",
                a: "Via des questionnaires standardisés passés régulièrement : PHQ-9 pour la dépression, GAD-7 pour l'anxiété. PsyLib affiche l'évolution des scores dans un graphique longitudinal accessible depuis le dossier du patient.",
              },
            ].map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <LeadMagnetCTA
          slug="templates-notes-tcc"
          title="Templates notes cliniques TCC (PDF gratuit)"
          description="Recevez 6 grilles et modeles TCC : pensees automatiques, tableau ABC, analyse SECCA, restructuration cognitive."
        />

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

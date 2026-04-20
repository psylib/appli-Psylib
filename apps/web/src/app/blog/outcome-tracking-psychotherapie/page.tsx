import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Outcome Tracking en psychothérapie : PHQ-9, GAD-7 et suivi des progrès',
  description:
    'Découvrez comment l\'outcome tracking transforme le suivi de vos patients en psychothérapie. PHQ-9, GAD-7, CORE-OM : guide complet pour mesurer les progrès.',
  keywords: [
    'outcome tracking psychothérapie',
    'PHQ-9 psychologue',
    'GAD-7 anxiété',
    'CORE-OM évaluation',
    'suivi progrès thérapeutiques',
    'routine outcome monitoring',
    'mesure résultats psychothérapie',
    'questionnaire dépression psychologue',
    'suivi patient psychologue logiciel',
  ],
  alternates: {
    canonical: 'https://psylib.eu/blog/outcome-tracking-psychotherapie',
  },
  openGraph: {
    title: 'Outcome Tracking en psychothérapie : PHQ-9, GAD-7 et suivi des progrès',
    description:
      'Guide complet sur l\'outcome tracking en psychothérapie. PHQ-9, GAD-7, CORE-OM : comment mesurer objectivement les progrès de vos patients.',
    url: 'https://psylib.eu/blog/outcome-tracking-psychotherapie',
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
      headline: 'Outcome Tracking en psychothérapie : PHQ-9, GAD-7 et suivi des progrès',
      description:
        'Guide complet sur l\'outcome tracking en psychothérapie : PHQ-9, GAD-7, CORE-OM et bénéfices cliniques prouvés.',
      datePublished: '2026-03-15',
      dateModified: '2026-03-15',
      author: {
        '@type': 'Organization',
        name: 'PsyLib',
        url: 'https://psylib.eu',
      },
      publisher: {
        '@type': 'Organization',
        name: 'PsyLib',
        url: 'https://psylib.eu',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://psylib.eu/blog/outcome-tracking-psychotherapie',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Qu'est-ce que l'outcome tracking en psychothérapie ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "L'outcome tracking, ou Routine Outcome Monitoring (ROM), désigne la collecte régulière de données standardisées sur l'état clinique du patient via des questionnaires validés (PHQ-9, GAD-7, CORE-OM). Les scores sont comparés dans le temps pour visualiser l'évolution thérapeutique.",
          },
        },
        {
          '@type': 'Question',
          name: 'Quelle est la différence entre le PHQ-9 et le GAD-7 ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Le PHQ-9 mesure l\'intensité des symptômes dépressifs (9 items, score 0-27). Le GAD-7 évalue la fréquence des symptômes d\'anxiété généralisée (7 items, score 0-21). Les deux questionnaires sont complémentaires et couvrent les deux motifs les plus fréquents de consultation en psychologie libérale.',
          },
        },
        {
          '@type': 'Question',
          name: "À quelle fréquence administrer les questionnaires d'outcome tracking ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "La fréquence recommandée est toutes les séances pour le PHQ-9 et le GAD-7 (courts, environ 2 minutes), ou toutes les quatre séances pour le CORE-OM. L'administration peut se faire en salle d'attente, par lien envoyé la veille ou via une interface numérique en début de consultation.",
          },
        },
        {
          '@type': 'Question',
          name: 'PsyLib intègre-t-il les outils d\'outcome tracking ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Oui. PsyLib intègre nativement PHQ-9, GAD-7 et CORE-OM. Le patient complète son évaluation depuis son espace dédié. Le psychologue accède instantanément aux courbes d\'évolution. Les données sont hébergées en France sur infrastructure certifiée HDS.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://psylib.eu/blog' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Outcome Tracking en psychothérapie',
          item: 'https://psylib.eu/blog/outcome-tracking-psychotherapie',
        },
      ],
    },
  ],
};

export default function ArticleOutcomeTracking() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Outcome Tracking en psychothérapie</span>
        </nav>

        {/* En-tête */}
        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Pratique clinique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            L&apos;outcome tracking en psychothérapie : mesurer les progrès de vos patients
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            PHQ-9, GAD-7, CORE-OM — comment le suivi systématique des résultats transforme
            la pratique clinique et réduit le risque de détérioration.
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            En psychothérapie, l&apos;intuition clinique reste précieuse. Mais elle peut aussi
            induire en erreur. Des études menées sur plusieurs milliers de cas montrent que
            les thérapeutes surestiment le progrès de leurs patients dans près d&apos;un tiers des
            situations où la thérapie stagne ou régresse. Cette dissonance a un nom : le
            phénomène de drift thérapeutique. Pour y répondre, une approche rigoureuse s&apos;est
            imposée : l&apos;outcome tracking, ou suivi systématique des résultats.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Qu&apos;est-ce que l&apos;outcome tracking en psychothérapie ?
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;outcome tracking — également appelé Routine Outcome Monitoring (ROM) — désigne
            la collecte régulière et systématique de données standardisées sur l&apos;état clinique
            du patient au fil des séances. Le patient répond à un questionnaire validé de
            quelques minutes avant ou après la séance. Le praticien dispose alors de scores
            comparables dans le temps, visualisables sous forme de graphiques.
          </p>
          <p className="mb-4 leading-relaxed">
            Cette approche permet de détecter précocement les situations de stagnation ou de
            régression, d&apos;objectiver les progrès pour le patient lui-même, d&apos;ajuster la
            stratégie thérapeutique sur des données factuelles et de documenter les résultats
            cliniques pour les dossiers et les échanges confrères.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les outils d&apos;évaluation incontournables
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le PHQ-9 : mesurer la dépression séance après séance
          </h3>
          <p className="mb-4 leading-relaxed">
            Le Patient Health Questionnaire-9 (PHQ-9) est l&apos;outil de référence pour évaluer
            l&apos;intensité des symptômes dépressifs. Il comprend neuf items, chacun coté de 0 à 3,
            pour un score total de 0 à 27. Les seuils cliniques sont les suivants : 0-4
            (minimal), 5-9 (léger), 10-14 (modéré), 15-19 (modérément sévère), 20-27 (sévère).
            Une réduction de 5 points est considérée cliniquement significative selon les
            études de validation.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le GAD-7 : quantifier l&apos;anxiété
          </h3>
          <p className="mb-4 leading-relaxed">
            Le GAD-7 suit la même logique pour les troubles anxieux. Sept items évaluent la
            fréquence des symptômes d&apos;anxiété généralisée, avec un score de 0 à 21. Les seuils :
            0-4 (minimal), 5-9 (léger), 10-14 (modéré), 15-21 (sévère). La combinaison
            PHQ-9 + GAD-7 couvre les deux motifs les plus fréquents de consultation en
            psychologie libérale en seulement cinq minutes.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le CORE-OM : évaluer le fonctionnement global
          </h3>
          <p className="mb-4 leading-relaxed">
            Le CORE-OM (Clinical Outcomes in Routine Evaluation — Outcome Measure) évalue quatre
            domaines : le bien-être subjectif, les problèmes et symptômes, le fonctionnement
            quotidien et le risque. Particulièrement pertinent pour les suivis longue durée ou
            les tableaux cliniques complexes où la symptomatologie dépressive ou anxieuse ne
            suffit pas à rendre compte de l&apos;évolution globale du patient.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les bénéfices cliniques prouvés par la recherche
          </h2>
          <p className="mb-4 leading-relaxed">
            Une méta-analyse publiée dans le Journal of Consulting and Clinical Psychology montre
            que l&apos;utilisation d&apos;un système de feedback systématique réduit de 65 % le risque de
            détérioration chez les patients qui ne progressent pas selon les trajectoires attendues.
            Sans cet outil, les thérapeutes ne détectent ces situations qu&apos;une fois sur huit.
          </p>
          <p className="mb-4 leading-relaxed">
            Partager les résultats avec le patient renforce également l&apos;alliance thérapeutique.
            Les patients qui voient leur courbe de progrès se sentent davantage acteurs de leur
            thérapie, ce qui améliore l&apos;adhésion au suivi et réduit les abandons prématurés.
          </p>

          <div className="rounded-xl border border-[#3D52A0]/20 bg-[#F1F0F9] p-5 my-6">
            <p className="font-semibold text-[#1E1B4B] mb-2">Chiffres clés</p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#3D52A0] flex-shrink-0" />
                <span>65 % de réduction du risque de détérioration avec le ROM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#3D52A0] flex-shrink-0" />
                <span>Les thérapeutes sans ROM détectent la stagnation dans seulement 1 cas sur 8</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#3D52A0] flex-shrink-0" />
                <span>PHQ-9 + GAD-7 : 5 minutes d&apos;administration par séance</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comment intégrer l&apos;outcome tracking dans votre pratique ?
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Fréquence recommandée
          </h3>
          <p className="mb-4 leading-relaxed">
            La fréquence recommandée est toutes les séances pour le PHQ-9 et le GAD-7 — leur
            brièveté le permet sans alourdir la séance. Pour le CORE-OM, une administration
            toutes les quatre séances est généralement suffisante pour capturer les évolutions
            significatives.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Modalités d&apos;administration
          </h3>
          <p className="mb-4 leading-relaxed">
            L&apos;administration peut se faire en salle d&apos;attente sur tablette, par lien envoyé la
            veille, ou en début de consultation via une interface numérique. L&apos;envoi par lien
            la veille présente l&apos;avantage de disposer des scores avant la séance, permettant
            au praticien d&apos;adapter son approche dès l&apos;accueil du patient.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Intégrer les résultats dans la séance
          </h3>
          <p className="mb-4 leading-relaxed">
            Les scores ne doivent pas rester des données abstraites. Partager la courbe
            d&apos;évolution avec le patient en début de séance ouvre une discussion directe sur
            les fluctuations observées, renforce la transparence thérapeutique et offre un
            point d&apos;ancrage concret pour le travail de la séance.
          </p>
        </section>

        {/* Section 5 : PsyLib */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            L&apos;outcome tracking avec PsyLib
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre nativement PHQ-9, GAD-7 et CORE-OM dans son tableau de bord
            clinique. Le patient complète son évaluation depuis son espace dédié — accessible
            sur mobile ou ordinateur. Le psychologue accède instantanément aux courbes
            d&apos;évolution par questionnaire, avec les seuils cliniques affichés en repère visuel.
          </p>
          <p className="mb-4 leading-relaxed">
            Les données sont hébergées en France sur une infrastructure certifiée HDS. L&apos;accès
            est protégé par authentification forte OIDC. Les évaluations sont associées
            automatiquement au dossier patient et à l&apos;historique des séances.
          </p>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Testez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            PHQ-9, GAD-7 et CORE-OM inclus. Accès complet au plan Pro. Sans carte bancaire.
          </p>
          <a
            href="https://psylib.eu/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Essayer PsyLib gratuitement 14 jours
          </a>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Qu&apos;est-ce que l&apos;outcome tracking en psychothérapie ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                L&apos;outcome tracking, ou Routine Outcome Monitoring (ROM), désigne la collecte
                régulière de données standardisées sur l&apos;état clinique du patient via des
                questionnaires validés (PHQ-9, GAD-7, CORE-OM). Les scores sont comparés dans
                le temps pour visualiser l&apos;évolution thérapeutique objectivement.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Quelle est la différence entre le PHQ-9 et le GAD-7 ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Le PHQ-9 mesure l&apos;intensité des symptômes dépressifs (9 items, score 0-27).
                Le GAD-7 évalue la fréquence des symptômes d&apos;anxiété généralisée (7 items,
                score 0-21). Les deux questionnaires sont complémentaires et couvrent les
                motifs les plus fréquents de consultation en psychologie libérale.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                A quelle fréquence administrer les questionnaires ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                La fréquence recommandée est toutes les séances pour le PHQ-9 et le GAD-7
                (environ 2 minutes), ou toutes les quatre séances pour le CORE-OM.
                L&apos;administration peut se faire en salle d&apos;attente, par lien envoyé la veille
                ou via une interface numérique en début de consultation.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                PsyLib intègre-t-il les outils d&apos;outcome tracking ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. PsyLib intègre nativement PHQ-9, GAD-7 et CORE-OM. Le patient complète
                son évaluation depuis son espace dédié. Le psychologue accède instantanément
                aux courbes d&apos;évolution. Les données sont hébergées en France sur infrastructure
                certifiée HDS.
              </p>
            </details>
          </div>
        </section>

        {/* Conclusion */}
        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Article rédigé par l&apos;équipe PsyLib — Mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">
              Retour à l&apos;accueil
            </Link>
            {' '}|{' '}
            <Link href="/blog" className="text-[#3D52A0] hover:underline">
              Tous les articles
            </Link>
          </p>
        </footer>
      </article>
    </>
  );
}

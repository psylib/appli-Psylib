import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Questionnaire bilan psychologique : outils validés et bonnes pratiques 2026 | PsyLib',
  description:
    'Quels questionnaires utiliser pour le bilan initial en psychologie libérale ? PHQ-9, GAD-7, PCL-5, WHODAS — outils validés, passation et interprétation pour les praticiens.',
  keywords: ['questionnaire bilan psychologique', 'questionnaire patient psychologue', 'bilan psychologique libéral', 'PHQ-9 GAD-7 psychologue'],
  alternates: { canonical: 'https://psylib.eu/guides/questionnaire-bilan-patient' },
  openGraph: {
    title: 'Questionnaire bilan psychologique : outils validés et bonnes pratiques 2026',
    description: 'PHQ-9, GAD-7, PCL-5 et autres outils de bilan pour les psychologues libéraux.',
    url: 'https://psylib.eu/guides/questionnaire-bilan-patient',
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
      headline: 'Questionnaire bilan psychologique : outils validés et bonnes pratiques 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/questionnaire-bilan-patient' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quels questionnaires utiliser pour le bilan initial en consultation psychologique ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Pour un bilan initial en consultation psychologique libérale, les outils les plus utilisés sont le PHQ-9 (dépression), le GAD-7 (anxiété généralisée), le PCL-5 (PTSD) et le WHODAS 2.0 (fonctionnement global). Ces outils sont validés en version française et libres d\'utilisation clinique.' },
        },
        {
          '@type': 'Question',
          name: 'Comment intégrer les questionnaires dans le suivi thérapeutique ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Les questionnaires de suivi (outcome measures) sont idéalement administrés au début de chaque séance ou toutes les 4 à 6 séances. Ils permettent de mesurer objectivement l\'évolution symptomatique et d\'ajuster le plan thérapeutique. PsyLib intègre ces outils dans son module d\'outcome tracking avec visualisation graphique de l\'évolution.' },
        },
        {
          '@type': 'Question',
          name: 'Les questionnaires peuvent-ils remplacer l\'entretien clinique ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Non. Les questionnaires auto-administrés sont des outils d\'aide à l\'évaluation, pas des substituts à l\'entretien clinique. Ils apportent une mesure standardisée et reproductible, mais l\'interprétation clinique requiert toujours le contexte fourni par l\'entretien. Un score PHQ-9 élevé ne suffit pas à poser un diagnostic de dépression caractérisée.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Questionnaire bilan patient', item: 'https://psylib.eu/guides/questionnaire-bilan-patient' },
      ],
    },
  ],
};

export default function PageQuestionnaireBilan() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Questionnaire bilan patient</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide clinique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Questionnaire bilan psychologique : outils validés et bonnes pratiques
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            PHQ-9, GAD-7, PCL-5 : quels questionnaires choisir, comment les intégrer et les interpréter en pratique libérale.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            L&apos;utilisation systématique d&apos;outils de mesure validés est un des marqueurs de la
            pratique fondée sur les données probantes. Au-delà du bilan initial, ces questionnaires
            permettent de suivre l&apos;évolution symptomatique séance après séance et de prendre
            des décisions thérapeutiques éclairées. Ce guide passe en revue les principaux outils
            disponibles en français et leur intégration dans la pratique libérale.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Outils de référence par domaine</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F0F9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Outil</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Mesure</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Items</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['PHQ-9', 'Dépression', '9', 'Bilan + suivi'],
                  ['GAD-7', 'Anxiété généralisée', '7', 'Bilan + suivi'],
                  ['PCL-5', 'PTSD', '20', 'Bilan'],
                  ['ISI', 'Insomnie', '7', 'Bilan + suivi'],
                  ['AUDIT', 'Consommation alcool', '10', 'Bilan'],
                  ['SRS', 'Alliance thérapeutique', '4', 'Séance'],
                  ['ORS', 'Résultats globaux', '4', 'Séance'],
                ].map(([outil, mesure, items, usage]) => (
                  <tr key={outil}>
                    <td className="px-4 py-3 font-medium text-[#3D52A0]">{outil}</td>
                    <td className="px-4 py-3">{mesure}</td>
                    <td className="px-4 py-3">{items}</td>
                    <td className="px-4 py-3">{usage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Intégration dans la pratique avec PsyLib</h2>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre nativement le PHQ-9 et le GAD-7 dans son module d&apos;outcome tracking.
            Ces questionnaires peuvent être envoyés directement au patient via email avant la séance,
            ou remplis en consultation. Les scores sont automatiquement enregistrés dans le dossier
            patient et visualisés sur un graphique d&apos;évolution temporelle.
          </p>
          <p className="mb-4 leading-relaxed">
            Cette approche correspond aux recommandations de la pratique fondée sur les données
            probantes (Evidence-Based Practice) et permet de documenter objectivement les progrès
            thérapeutiques — utile notamment dans le cadre d&apos;évaluations de pratique professionnelle
            ou de présentation de cas en supervision.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Outcome tracking intégré dans PsyLib</h2>
          <p className="mb-6 text-white/80">PHQ-9, GAD-7, envoi automatique aux patients, graphiques d&apos;évolution. 14 jours gratuits.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Le PHQ-9 suffit-il pour diagnostiquer une dépression ?", a: "Non. Le PHQ-9 est un outil de dépistage et de suivi, pas un outil diagnostique. Un score ≥ 10 indique une dépression modérée et justifie une évaluation clinique approfondie. Le diagnostic de dépression caractérisée requiert un entretien clinique complet selon les critères DSM-5 ou CIM-11." },
              { q: "À quelle fréquence administrer les questionnaires de suivi ?", a: "Les pratiques varient selon les approches. En TCC, une administration toutes les 4 à 6 séances est courante. Certains praticiens pratiquant l'outcome tracking systématique (Scott Miller, Lambert) utilisent le ORS et le SRS à chaque séance. La régularité est plus importante que la fréquence — l'essentiel est de disposer d'une série temporelle exploitable." },
              { q: "Les questionnaires sont-ils utilisables avec les adolescents ?", a: "Des versions adaptées existent pour les adolescents : le PHQ-A pour la dépression chez les 11-17 ans, le SCARED pour l'anxiété. Le bilan neuropsychologique utilise des outils standardisés avec des normes par âge (WISC-V, WPPSI-IV). PsyLib vous permet de documenter quel outil a été utilisé et avec quelle norme." },
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

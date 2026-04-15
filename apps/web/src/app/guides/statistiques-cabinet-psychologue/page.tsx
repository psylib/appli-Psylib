import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Statistiques cabinet psychologue : indicateurs clés et tableau de bord 2026 | PsyLib',
  description:
    'Quels indicateurs suivre pour piloter son cabinet de psychologue ? Taux de remplissage, chiffre d\'affaires, rétention patients, no-shows — les KPIs essentiels pour les psys libéraux.',
  keywords: ['statistiques cabinet psychologue', 'indicateurs psychologue libéral', 'tableau de bord cabinet psy', 'KPI psychologue libéral'],
  alternates: { canonical: 'https://psylib.eu/guides/statistiques-cabinet-psychologue' },
  openGraph: {
    title: 'Statistiques cabinet psychologue : indicateurs clés et tableau de bord 2026',
    description: 'Taux de remplissage, CA, rétention et KPIs essentiels pour piloter votre cabinet.',
    url: 'https://psylib.eu/guides/statistiques-cabinet-psychologue',
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
      headline: 'Statistiques cabinet psychologue : indicateurs clés et tableau de bord 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/statistiques-cabinet-psychologue' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quels sont les indicateurs clés à suivre pour un cabinet de psychologue ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Les indicateurs essentiels pour piloter un cabinet de psychologue libéral sont : le chiffre d\'affaires mensuel, le taux de remplissage (% de créneaux effectivement tenus / créneaux disponibles), le taux de no-show, le nombre de nouveaux patients par mois, la durée moyenne de suivi et les recettes par type de prestation (séance individuelle, bilan, supervision).' },
        },
        {
          '@type': 'Question',
          name: 'Qu\'est-ce qu\'un bon taux de remplissage pour un cabinet de psychologue ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Un taux de remplissage optimal pour un psychologue libéral se situe entre 75 et 90 %. En dessous de 70 %, le cabinet manque de patients actifs. Au-dessus de 90 %, le praticien risque le surmenage et a peu de marge pour les nouveaux patients ou les urgences. Le taux cible dépend aussi du nombre de séances hebdomadaires visé.' },
        },
        {
          '@type': 'Question',
          name: 'Comment calculer son chiffre d\'affaires moyen mensuel ?',
          acceptedAnswer: { '@type': 'Answer', text: 'CA mensuel = nombre de séances réalisées × tarif moyen. Pour un psychologue à 25 séances/semaine × 4 semaines × 85 euros = 8 500 euros bruts. Après charges sociales (22 % en micro-BNC) et charges d\'exploitation (loyer, logiciel, formation), le revenu net se situe généralement entre 50 et 70 % du CA brut selon le régime fiscal et les charges.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Statistiques cabinet psychologue', item: 'https://psylib.eu/guides/statistiques-cabinet-psychologue' },
      ],
    },
  ],
};

export default function PageStatistiquesCabinet() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Statistiques cabinet psychologue</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide gestion — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Statistiques cabinet psychologue : indicateurs clés et tableau de bord
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Les KPIs essentiels pour piloter votre activité libérale et prendre des décisions éclairées.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Piloter son cabinet uniquement à l&apos;intuition, c&apos;est naviguer sans boussole.
            Les psychologues libéraux les plus efficaces suivent régulièrement quelques indicateurs
            clés qui leur permettent d&apos;anticiper les baisses d&apos;activité, d&apos;optimiser
            leur remplissage et de prendre des décisions rationnelles (augmenter ses tarifs, réduire
            ses créneaux, se spécialiser). Ce guide présente les KPIs essentiels et comment les
            visualiser dans PsyLib.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Les 6 KPIs essentiels</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { kpi: 'Chiffre d\'affaires mensuel', desc: 'Recettes brutes par mois. À suivre sur 12 mois pour identifier la saisonnalité (baisses en août, fêtes).' },
              { kpi: 'Taux de remplissage', desc: 'Créneaux tenus / créneaux disponibles. Cible : 75-90 %. En dessous de 70 %, action nécessaire.' },
              { kpi: 'Nouveaux patients/mois', desc: 'Indique la dynamique d\'acquisition. En stagnation depuis 3 mois = signal d\'alerte.' },
              { kpi: 'Taux de no-show', desc: 'Séances non honorées / total RDV. Un taux > 10 % justifie une révision de la politique d\'annulation.' },
              { kpi: 'Durée moyenne de suivi', desc: 'Nombre de séances moyen par patient. Varie selon les approches (TCC : 12-20, psychanalyse : pluriannuelle).' },
              { kpi: 'Revenu par heure productive', desc: 'CA brut / heures effectivement facturées. Permet de comparer différents types de prestations.' },
            ].map((item) => (
              <div key={item.kpi} className="rounded-xl border border-gray-200 p-4">
                <p className="mb-2 font-semibold text-[#3D52A0]">{item.kpi}</p>
                <p className="text-sm text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Tableau de bord PsyLib</h2>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre un tableau de bord financier et analytique accessible depuis le dashboard.
            Il affiche en temps réel : le CA du mois en cours vs le mois précédent, le nombre de
            séances réalisées, les factures en attente, le taux de remplissage hebdomadaire et
            l&apos;évolution mensuelle sur 12 mois sous forme de graphique.
          </p>
          <p className="mb-4 leading-relaxed">
            Ces données sont strictement séparées des données cliniques et ne contiennent aucune
            information identifiante sur les patients. Elles sont accessibles uniquement par le
            praticien, sur son espace sécurisé PsyLib.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Pilotez votre cabinet avec les données</h2>
          <p className="mb-6 text-white/80">Tableau de bord KPIs, CA mensuel, taux de remplissage, facturation automatique. Commencez gratuitement.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Quel est le revenu moyen d'un psychologue libéral à temps plein ?", a: "D'après les données de l'URSSAF et les enquêtes professionnelles, un psychologue libéral à temps plein (25-28 séances/semaine) génère un CA annuel brut de 70 000 à 120 000 euros selon la région et les spécialités. Après charges sociales et d'exploitation, le revenu net se situe généralement entre 35 000 et 75 000 euros par an." },
              { q: "Comment identifier les périodes creuses pour anticiper les baisses de CA ?", a: "Les périodes creuses récurrentes pour les psychologues libéraux en France sont : août (vacances), la semaine entre Noël et Jour de l'An, les semaines des vacances scolaires (variable selon la patientèle). PsyLib vous permet de visualiser votre historique de CA sur 12 mois pour identifier votre propre saisonnalité et planifier vos congés en conséquence." },
              { q: "Faut-il déclarer ses statistiques de cabinet à un ordre professionnel ?", a: "Non. En France, les psychologues ne sont pas soumis à un ordre professionnel (contrairement aux médecins ou avocats). Il n'existe aucune obligation de déclarer des statistiques d'activité à une instance professionnelle. La seule déclaration obligatoire est la déclaration des revenus aux impôts et à l'URSSAF." },
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

import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadMagnetCTA } from '@/components/lead-magnet-cta';

export const metadata: Metadata = {
  title: 'Psychologue autoentrepreneur : statut, obligations et avantages 2026 | PsyLib',
  description:
    'Le statut d\'autoentrepreneur (micro-BNC) est-il adapté aux psychologues libéraux ? Seuil de chiffre d\'affaires, cotisations URSSAF, TVA, obligations et comparatif avec la déclaration contrôlée.',
  keywords: [
    'psychologue autoentrepreneur',
    'micro BNC psychologue',
    'statut psychologue libéral',
    'autoentrepreneur psychologie',
    'psychologue BNC micro',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/psychologue-autoentrepreneur' },
  openGraph: {
    title: 'Psychologue autoentrepreneur : statut, obligations et avantages 2026',
    description: 'Tout savoir sur le micro-BNC pour les psychologues libéraux en France.',
    url: 'https://psylib.eu/guides/psychologue-autoentrepreneur',
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
      headline: 'Psychologue autoentrepreneur : statut, obligations et avantages 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/psychologue-autoentrepreneur' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Un psychologue peut-il exercer en autoentrepreneur ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, un psychologue libéral peut choisir le régime de la micro-entreprise (micro-BNC). Ce régime est accessible jusqu\'à un seuil de chiffre d\'affaires annuel de 77 700 euros HT en 2026 pour les prestations de services libérales. Au-delà, le passage à la déclaration contrôlée (régime réel) est obligatoire.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quelles sont les cotisations sociales pour un psychologue autoentrepreneur ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'En micro-BNC, les cotisations sociales URSSAF représentent 22 % du chiffre d\'affaires (taux applicable en 2026 pour les professions libérales non réglementées par une caisse spécifique). Ce taux inclut la retraite de base, la retraite complémentaire, les indemnités journalières et la formation professionnelle.',
          },
        },
        {
          '@type': 'Question',
          name: 'Un psychologue autoentrepreneur est-il soumis à la TVA ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Non. Les prestations de soins dispensées par les psychologues libéraux sont exonérées de TVA en vertu de l\'article 261-4-1° du Code général des impôts, quel que soit le régime fiscal choisi (micro-BNC ou déclaration contrôlée). Cette exonération s\'applique aux soins à la personne, ce qui inclut les consultations psychologiques.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Psychologue autoentrepreneur', item: 'https://psylib.eu/guides/psychologue-autoentrepreneur' },
      ],
    },
  ],
};

export default function PagePsychologueAutoentrepreneur() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Psychologue autoentrepreneur</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide administratif — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Psychologue autoentrepreneur : statut, obligations et avantages en 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Tout ce qu&apos;il faut savoir sur le régime micro-BNC pour exercer en psychologie libérale.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            De nombreux psychologues s&apos;installent en libéral via le régime micro-entreprise,
            séduisant par sa simplicité administrative et sa lisibilité fiscale. Ce régime, dit
            micro-BNC pour les activités non commerciales, convient particulièrement aux débutants
            ou aux praticiens à mi-temps. Ce guide compare les avantages et limites du statut
            autoentrepreneur face à la déclaration contrôlée (régime réel), et explique les
            obligations concrètes.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Micro-BNC vs déclaration contrôlée : comparatif</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F0F9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Critère</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Micro-BNC</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Déclaration contrôlée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Seuil CA', '77 700 €/an (2026)', 'Illimité'],
                  ['Cotisations sociales', '22 % du CA', 'Sur bénéfice réel'],
                  ['Abattement fiscal', '34 % forfaitaire', 'Charges réelles déductibles'],
                  ['Comptabilité', 'Registre des recettes', 'Livre de recettes + charges'],
                  ['Intérêt si charges élevées', 'Non', 'Oui (loyer, formation…)'],
                ].map(([crit, micro, reel]) => (
                  <tr key={crit}>
                    <td className="px-4 py-3 font-medium">{crit}</td>
                    <td className="px-4 py-3">{micro}</td>
                    <td className="px-4 py-3">{reel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Obligations pratiques du psychologue autoentrepreneur</h2>
          <ul className="space-y-3 text-gray-700">
            {[
              'Immatriculation URSSAF au CFE des professions libérales (en ligne sur autoentrepreneur.urssaf.fr)',
              'Déclaration du chiffre d\'affaires mensuelle ou trimestrielle auprès de l\'URSSAF',
              'Tenue d\'un registre chronologique des recettes',
              'Émission d\'une note d\'honoraires pour toute prestation > 25 €',
              'Inscription sur ADELI (numéro d\'identification obligatoire pour l\'exercice de la profession)',
              'Assurance Responsabilité Civile Professionnelle (RCP) — obligatoire',
              'Respect du RGPD pour les données patients (données de santé HDS)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 font-bold text-[#3D52A0]">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Quand passer à la déclaration contrôlée ?</h2>
          <p className="mb-4 leading-relaxed">
            Le passage au régime réel (déclaration contrôlée) s&apos;impose lorsque le chiffre
            d&apos;affaires dépasse 77 700 euros ou dès lors que les charges réelles déductibles
            dépassent 34 % du CA. Pour un psychologue avec un loyer de cabinet significatif,
            des formations onéreuses (EMDR, DBT) et un logiciel de gestion, le régime réel peut
            être plus favorable dès 50 000 à 60 000 euros de recettes annuelles.
          </p>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre un tableau de bord financier permettant de suivre en temps réel les
            recettes mensuelles et annuelles, facilitant la détection du moment optimal pour
            changer de régime fiscal.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Gérez votre comptabilité libérale avec PsyLib</h2>
          <p className="mb-6 text-white/80">Facturation, suivi des recettes, notes d&apos;honoraires conformes. 14 jours gratuits.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Peut-on cumuler le statut autoentrepreneur avec un emploi salarié ?", a: "Oui, un psychologue salarié (en CMP, hôpital, entreprise) peut également exercer en libéral via le micro-BNC. Les deux activités sont déclarées séparément. Les cotisations URSSAF sont dues sur le chiffre d'affaires libéral en plus des cotisations salariales. Il convient de vérifier la clause d'exclusivité d'un éventuel contrat de travail." },
              { q: "Comment facturer en tant que psychologue autoentrepreneur ?", a: "La note d'honoraires doit mentionner : nom et prénom, numéro ADELI, SIRET/SIREN, date de la prestation, nature de la prestation, montant, et la mention 'Exonéré de TVA - Article 261-4-1° du CGI'. PsyLib génère automatiquement ces documents conformes en un clic." },
              { q: "Le régime autoentrepreneur ouvre-t-il droit à la retraite ?", a: "Oui, les cotisations versées à l'URSSAF dans le cadre du micro-BNC ouvrent des droits à la retraite de base et complémentaire. Cependant, les droits acquis sont proportionnels aux revenus déclarés. Il est recommandé de souscrire un contrat de retraite complémentaire (PER ou Madelin) pour compenser la faiblesse des droits accumulés en début d'activité libérale." },
            ].map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <LeadMagnetCTA
          slug="kit-demarrage-cabinet"
          title="Kit de demarrage cabinet psy (PDF gratuit)"
          description="Recevez la checklist complete pour demarrer votre activite de psychologue liberal : statut, URSSAF, ADELI, logiciel HDS."
        />

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>Guide rédigé par l&apos;équipe PsyLib — Mars 2026.{' '}<Link href="/guides" className="text-[#3D52A0] hover:underline">Tous les guides</Link></p>
        </footer>
      </article>
    </>
  );
}

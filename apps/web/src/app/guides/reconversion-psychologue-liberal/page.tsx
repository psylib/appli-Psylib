import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reconversion en psychologie libérale : guide complet 2026 | PsyLib',
  description:
    'Se reconvertir en psychologue libéral après une carrière salariée : étapes, démarches, délais, aides financières et retours d\'expérience de praticiens installés.',
  keywords: ['reconversion psychologue libéral', 'installation psychologue libéral', 'devenir psychologue libéral', 'reconversion psychologie'],
  alternates: { canonical: 'https://psylib.eu/guides/reconversion-psychologue-liberal' },
  openGraph: {
    title: 'Reconversion en psychologie libérale : guide complet 2026',
    description: 'Étapes, démarches et aides pour s\'installer en psychologie libérale.',
    url: 'https://psylib.eu/guides/reconversion-psychologue-liberal',
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
      headline: 'Reconversion en psychologie libérale : guide complet 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/reconversion-psychologue-liberal' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Peut-on devenir psychologue en libéral après une reconversion ?',
          acceptedAnswer: { '@type': 'Answer', text: 'L\'exercice de la psychologie est protégé par le titre réglementé. Pour exercer légalement comme psychologue, un master 2 de psychologie reconnu par l\'État est obligatoire. Si vous avez un autre parcours, il n\'est pas possible d\'exercer la psychologie sans ce diplôme. En revanche, d\'autres professions du soin (coach, praticien en thérapies brèves) sont librement exercées mais sans le titre de psychologue.' },
        },
        {
          '@type': 'Question',
          name: 'Quelles sont les démarches pour s\'installer en libéral après une carrière salariée ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Les étapes clés sont : 1) Inscription ADELI auprès de l\'ARS (numéro obligatoire avant tout exercice), 2) Immatriculation URSSAF (choix du régime fiscal : micro-BNC ou déclaration contrôlée), 3) Souscription à une assurance RC professionnelle, 4) Choix du local de consultation, 5) Mise en place des outils administratifs et numériques (logiciel de cabinet conforme HDS).' },
        },
        {
          '@type': 'Question',
          name: 'Peut-on bénéficier d\'aides à l\'installation en libéral ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Oui. Les psychologues s\'installant dans des zones sous-dotées (zones rurales ou périurbaines) peuvent bénéficier d\'aides de l\'Assurance Maladie via les contrats d\'aide à l\'installation. L\'URSSAF propose une exonération partielle des cotisations sociales la première année via l\'ACRE (Aide à la Création ou Reprise d\'Entreprise), sous conditions de ressources.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Reconversion psychologue libéral', item: 'https://psylib.eu/guides/reconversion-psychologue-liberal' },
      ],
    },
  ],
};

export default function PageReconversion() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Reconversion psychologue libéral</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide pratique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Reconversion en psychologie libérale : guide complet 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Étapes, démarches, délais et outils pour réussir votre installation en libéral.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Chaque année, des centaines de psychologues quittent le secteur hospitalier ou associatif
            pour s&apos;installer en libéral. Si la démarche est réglementée, elle reste accessible et
            peut représenter un gain significatif en autonomie, en revenus et en épanouissement
            professionnel. Ce guide détaille les étapes concrètes pour réussir cette transition.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Étape 1 — Vérifier ses droits d&apos;exercice</h2>
          <p className="mb-4 leading-relaxed">
            Le titre de psychologue est réglementé en France par la loi du 25 juillet 1985.
            Pour l&apos;exercer, vous devez être titulaire d&apos;un master 2 de psychologie
            reconnu par le Ministère. Si vous avez obtenu votre diplôme à l&apos;étranger,
            une procédure de reconnaissance équivalente existe auprès du Ministère de l&apos;Enseignement
            supérieur.
          </p>
          <p className="mb-4 leading-relaxed">
            L&apos;inscription sur ADELI (Automatisation DEs LIstes) auprès de l&apos;ARS de votre
            région est obligatoire avant tout exercice. Elle vous attribue votre numéro ADELI,
            indispensable pour les notes d&apos;honoraires.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Étape 2 — Choisir son statut juridique et fiscal</h2>
          <p className="mb-4 leading-relaxed">
            Deux options principales s&apos;offrent à vous : le régime micro-BNC (autoentrepreneur)
            ou la déclaration contrôlée. Pour une installation progressive avec un faible volume
            d&apos;activité au départ, le micro-BNC est souvent préférable pour sa simplicité.
            Pour un plein temps avec des charges importantes (loyer, formations), la déclaration
            contrôlée peut s&apos;avérer plus avantageuse. Consultez un expert-comptable spécialisé
            professions libérales pour affiner ce choix.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Étape 3 — Mettre en place son cabinet</h2>
          <p className="mb-4 leading-relaxed">
            Les premières semaines sont décisives : local professionnel (cabinet en propre, sous-location
            ou téléconsultation exclusive), assurance RC professionnelle, mise en conformité RGPD
            et HDS pour les données patients, et mise en place d&apos;un logiciel de gestion adapté.
          </p>
          <p className="mb-4 leading-relaxed">
            PsyLib permet de démarrer en moins d&apos;une heure : agenda en ligne, dossier patient
            conforme HDS, facturation automatique et profil public pour la prise de RDV. Idéal pour
            les psychologues en phase d&apos;installation.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Démarrez votre cabinet avec PsyLib</h2>
          <p className="mb-6 text-white/80">Agenda, dossiers patients, facturation, profil public. Opérationnel en 1 heure. Commencez gratuitement.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Créer mon cabinet en ligne
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Combien de temps faut-il pour construire une patientèle en libéral ?", a: "La construction d'une patientèle prend généralement 6 à 18 mois. Les premières semaines sont souvent les plus difficiles, avec peu de patients. Le bouche-à-oreille, les médecins généralistes de proximité, les annuaires en ligne et PsyLib (profil public + prise de RDV) sont les principaux leviers d'acquisition." },
              { q: "Peut-on exercer en libéral à temps partiel au début ?", a: "Oui, c'est même souvent recommandé. Beaucoup de psychologues maintiennent un emploi salarié partiel (hôpital, CMP, entreprise) pendant leurs premières années de libéral pour sécuriser leurs revenus. PsyLib vous permet de gérer un agenda mixte et de suivre précisément la progression de votre activité libérale." },
              { q: "Quelles aides financières existent pour l'installation ?", a: "L'ACRE (Aide à la Création ou Reprise d'Entreprise) permet une réduction des cotisations sociales la première année (sous conditions). Des aides régionales existent pour l'installation dans des zones sous-dotées. Le Pôle emploi peut maintenir l'allocation chômage pendant les premiers mois d'activité libérale dans le cadre du dispositif ARE + CAPE." },
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

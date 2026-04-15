import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadMagnetCTA } from '@/components/lead-magnet-cta';

export const metadata: Metadata = {
  title: "Ouvrir un cabinet de psychologue libéral : guide étape par étape 2026 | PsyLib",
  description:
    "ADELI, URSSAF, assurance RC Pro, choix du local, outils numériques — checklist complète pour ouvrir son cabinet de psychologue libéral en France en 2026.",
  keywords: [
    'ouvrir cabinet psychologue libéral',
    'installation psychologue libéral',
    'démarrage cabinet psy',
    'ADELI psychologue',
    'URSSAF psychologue libéral',
    'installation libérale psychologue France',
    'checklist cabinet psy',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/ouvrir-cabinet-psychologue' },
  openGraph: {
    title: "Ouvrir un cabinet de psychologue libéral : guide étape par étape 2026",
    description:
      "ADELI, URSSAF, RC Pro, local, outils — la checklist complète pour s'installer en libéral sereinement.",
    url: 'https://psylib.eu/guides/ouvrir-cabinet-psychologue',
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
      headline: "Ouvrir un cabinet de psychologue libéral : guide étape par étape 2026",
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
          name: "Quelles sont les démarches obligatoires pour s'installer en libéral comme psychologue ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les démarches obligatoires sont : l'enregistrement auprès de l'ADELI (via l'ARS de votre région), la déclaration d'activité à l'URSSAF (en micro-BNC ou en déclaration contrôlée), la souscription d'une assurance responsabilité civile professionnelle, et éventuellement la création d'une structure juridique si vous exercez en société. L'adhésion à une association de gestion agréée (AGA) est recommandée pour bénéficier de l'exonération de la majoration de 25 % des bénéfices non commerciaux.",
          },
        },
        {
          '@type': 'Question',
          name: "Faut-il un local dédié pour exercer en libéral ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Non, il est possible d'exercer depuis son domicile sous certaines conditions (accord de la copropriété, déclaration en mairie si changement d'usage). Cependant, un local professionnel séparé est fortement recommandé pour des raisons de confidentialité et d'identité professionnelle. La sous-location de bureau à d'autres praticiens est une solution flexible pour commencer.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment constituer sa patientèle quand on s'installe en libéral ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les principales sources de patientèle sont : le bouche-à-oreille (le plus efficace à long terme), l'inscription sur les annuaires professionnels (Doctolib, annuaire ADELI, Psymatch), le réseau de médecins généralistes et psychiatres de votre secteur, la présence en ligne (site web, SEO local), et parfois des partenariats avec des entreprises ou des institutions. Un logiciel comme PsyLib facilite le référencement via l'annuaire de la plateforme.",
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
          name: 'Ouvrir cabinet psychologue',
          item: 'https://psylib.eu/guides/ouvrir-cabinet-psychologue',
        },
      ],
    },
  ],
};

export default function PageOuvrirCabinet() {
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
          <span className="text-gray-700">Ouvrir cabinet psychologue libéral</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Ouvrir un cabinet de psychologue libéral : guide étape par étape 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            ADELI, URSSAF, RC Pro, local, outils numériques — la checklist complète pour
            s&apos;installer en libéral sereinement dès le premier jour.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            S&apos;installer en libéral est une étape majeure dans la carrière d&apos;un
            psychologue. Elle offre une liberté professionnelle incomparable — choix des
            patients, des horaires, des approches thérapeutiques — mais implique de naviguer
            dans un ensemble de démarches administratives, juridiques et pratiques que la
            formation universitaire ne prépare pas toujours à affronter. Ce guide structure
            ces démarches en étapes claires pour que votre installation soit sereine et conforme.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Étape 1 : L&apos;enregistrement ADELI (obligatoire)
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;enregistrement au répertoire ADELI (Automatisation DEs LIstes) est la
            première démarche à effectuer. Il est obligatoire pour exercer légalement la
            profession de psychologue en France. Cet enregistrement s&apos;effectue auprès
            de l&apos;Agence Régionale de Santé (ARS) de votre lieu d&apos;exercice.
          </p>
          <p className="mb-4 leading-relaxed">
            Documents nécessaires pour l&apos;enregistrement ADELI :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Copie du diplôme de master de psychologie (ou équivalent)</li>
            <li>Pièce d&apos;identité</li>
            <li>Justificatif de domicile professionnel</li>
            <li>Formulaire de demande d&apos;enregistrement ARS (variable selon les régions)</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Le numéro ADELI obtenu doit figurer sur toutes vos factures, prescriptions et
            correspondances professionnelles. Il est également requis pour l&apos;adhésion
            au dispositif Mon Soutien Psy.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Étape 2 : La déclaration à l&apos;URSSAF
          </h2>
          <p className="mb-4 leading-relaxed">
            Tout psychologue exerçant en libéral doit déclarer son activité auprès de
            l&apos;URSSAF. Deux régimes sont possibles selon le niveau de chiffre d&apos;affaires
            prévu :
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le régime micro-BNC
          </h3>
          <p className="mb-4 leading-relaxed">
            Accessible si le chiffre d&apos;affaires annuel est inférieur à 77 700 euros
            (seuil 2026). Les cotisations sociales sont calculées sur un abattement forfaitaire
            de 34 % des recettes. La comptabilité est simplifiée : seul le livre des recettes
            est obligatoire. Ce régime est idéal pour commencer.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le régime de la déclaration contrôlée
          </h3>
          <p className="mb-4 leading-relaxed">
            Obligatoire au-delà de 77 700 euros de CA ou sur option en dessous de ce seuil.
            Il permet de déduire les charges réelles (loyer, logiciel, formation, cotisations
            mutuelle professionnelle). Un expert-comptable est recommandé dans ce régime.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Étape 3 : L&apos;assurance responsabilité civile professionnelle
          </h2>
          <p className="mb-4 leading-relaxed">
            La souscription d&apos;une assurance responsabilité civile professionnelle (RC Pro)
            est une obligation légale pour les psychologues libéraux, renforcée par le Code
            de déontologie. Elle couvre les préjudices causés aux patients dans le cadre de
            l&apos;exercice professionnel.
          </p>
          <p className="mb-4 leading-relaxed">
            Les principaux assureurs proposant des contrats adaptés aux psychologues libéraux
            en France incluent la MACSF, la MCA Médical, April et Galian. Les primes annuelles
            varient généralement entre 150 et 400 euros selon les garanties souscrites. Il est
            recommandé de comparer plusieurs offres et de vérifier que le contrat couvre
            explicitement la pratique de la psychothérapie et les consultations en visio.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Étape 4 : Le choix du local professionnel
          </h2>
          <p className="mb-4 leading-relaxed">
            Le cabinet de psychologue doit garantir la confidentialité des entretiens : insonorisation
            suffisante, absence de passage de tiers dans les couloirs, salle d&apos;attente
            séparée si plusieurs praticiens cohabitent. Les conditions matérielles du lieu
            de consultation contribuent directement au cadre thérapeutique.
          </p>
          <p className="mb-4 leading-relaxed">
            Les options les plus courantes pour les psychologues s&apos;installant :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Location d&apos;un bureau dans une maison de santé pluriprofessionnelle</li>
            <li>Sous-location à d&apos;autres praticiens (partage de cabinet)</li>
            <li>Location d&apos;un appartement dédié ou bureau en centre-ville</li>
            <li>Exercice au domicile du praticien (sous conditions légales)</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            La sous-location de cabinet est souvent la solution la plus accessible financièrement
            pour commencer. Elle permet de tester la localisation sans engagement de bail long terme,
            en partageant les charges avec d&apos;autres praticiens.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Étape 5 : Choisir ses outils numériques dès le premier jour
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;organisation numérique du cabinet est souvent négligée lors de
            l&apos;installation, au profit des démarches administratives urgentes. C&apos;est
            une erreur : les mauvaises habitudes prises au début (agenda papier, notes sur
            Word, facturation sur Excel) sont difficiles à corriger ensuite et génèrent une
            charge croissante.
          </p>
          <p className="mb-4 leading-relaxed">
            Dès le premier patient, un psychologue libéral a besoin :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>D&apos;un agenda numérique sécurisé (conforme HDS)</li>
            <li>D&apos;un outil de dossier patient (nom, contact, historique)</li>
            <li>D&apos;un outil de facturation générant des notes d&apos;honoraires conformes</li>
            <li>D&apos;un outil de notes de séance chiffré</li>
            <li>D&apos;une messagerie sécurisée pour les échanges avec les patients</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            PsyLib regroupe l&apos;ensemble de ces fonctionnalités dans un seul outil,
            certifié HDS dès le premier jour d&apos;utilisation. L&apos;onboarding est
            guidé et se réalise en moins de 10 minutes.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Checklist complète pour l&apos;installation en libéral
          </h2>
          <div className="space-y-2">
            {[
              'Enregistrement ADELI auprès de l\'ARS',
              'Déclaration d\'activité à l\'URSSAF (micro-BNC ou déclaration contrôlée)',
              'Souscription assurance RC Pro',
              'Adhésion à une Association de Gestion Agréée (AGA) — recommandé',
              'Ouverture d\'un compte bancaire professionnel dédié',
              'Choix et signature du bail ou contrat de sous-location du local',
              'Vérification de l\'insonorisation et de la confidentialité du cabinet',
              'Inscription sur les annuaires professionnels (Doctolib, annuaire ADELI…)',
              'Mise en place du logiciel de gestion conforme HDS (PsyLib)',
              'Création du dossier type de premier entretien et des formulaires de consentement RGPD',
              'Contact des médecins généralistes du secteur pour présenter votre activité',
              'Mise en place d\'une supervision régulière dès le départ',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 border-[#3D52A0]" aria-hidden="true" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            L&apos;outil complet pour démarrer sereinement : agenda, dossiers patients,
            facturation, conformité HDS. Sans carte bancaire.
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
                q: "Quelles sont les démarches obligatoires pour s'installer en libéral comme psychologue ?",
                a: "Enregistrement ADELI (ARS), déclaration URSSAF, souscription RC Pro. L'adhésion à une AGA et l'ouverture d'un compte bancaire professionnel sont fortement recommandées.",
              },
              {
                q: "Faut-il un local dédié pour exercer en libéral ?",
                a: "Non, l'exercice au domicile est possible sous conditions. Mais un local professionnel séparé est recommandé pour la confidentialité et l'identité professionnelle. La sous-location est une solution flexible pour commencer.",
              },
              {
                q: "Comment constituer sa patientèle quand on s'installe ?",
                a: "Bouche-à-oreille, annuaires professionnels, réseau de médecins généralistes, présence en ligne (SEO local), et réseau professionnel via PsyLib. La confiance prend du temps — prévoyez 6 à 18 mois pour atteindre une activité complète.",
              },
              {
                q: "Quand choisir le régime micro-BNC vs déclaration contrôlée ?",
                a: "Micro-BNC si CA prévisible < 77 700 €/an. Déclaration contrôlée si CA supérieur, ou si vous avez des charges importantes à déduire (loyer, formations, logiciel). Un expert-comptable peut vous aider à choisir.",
              },
              {
                q: "Quel logiciel utiliser dès le premier jour en libéral ?",
                a: "PsyLib regroupe tous les outils nécessaires : agenda, dossiers patients, facturation conforme, notes de séance chiffrées, conformité HDS. L'onboarding guidé se réalise en moins de 10 minutes.",
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
          slug="kit-demarrage-cabinet"
          title="Kit de demarrage cabinet psy (PDF gratuit)"
          description="Recevez la checklist complete pour ouvrir votre cabinet : ADELI, URSSAF, RC Pro, local, logiciel HDS."
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

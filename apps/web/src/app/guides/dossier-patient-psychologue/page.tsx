import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Dossier patient psychologue : obligations légales et bonnes pratiques | PsyLib',
  description:
    'Obligations légales du dossier patient en psychologie, chiffrement HDS, conformité RGPD, contenu optimal. PsyLib centralise et sécurise les dossiers patients des psychologues libéraux.',
  keywords: [
    'dossier patient psychologue',
    'fiche patient psy logiciel',
    'gestion dossiers patients',
    'dossier patient numérique psy',
    'RGPD psychologue',
    'HDS dossier patient',
    'dossier clinique psychologue',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/dossier-patient-psychologue' },
  openGraph: {
    title: 'Dossier patient psychologue : obligations légales et bonnes pratiques',
    description:
      'Obligations légales, chiffrement HDS, RGPD, contenu optimal du dossier patient. PsyLib sécurise les dossiers patients des psychologues libéraux.',
    url: 'https://psylib.eu/guides/dossier-patient-psychologue',
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
      headline: 'Dossier patient psychologue : obligations légales et bonnes pratiques',
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
          name: 'Un psychologue libéral est-il obligé de tenir un dossier patient ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Le Code de déontologie des psychologues et les recommandations de la SNP et du CNCDP recommandent fortement la tenue d'un dossier clinique pour chaque patient. Ce dossier est nécessaire pour assurer la continuité des soins, justifier ses actes en cas de plainte déontologique et répondre aux demandes d'accès du patient à ses données (droit RGPD).",
          },
        },
        {
          '@type': 'Question',
          name: 'Combien de temps conserver un dossier patient en psychologie ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "La réglementation française ne fixe pas de durée de conservation spécifique pour les dossiers de psychologue libéral hors convention. Par analogie avec les dossiers médicaux, une durée minimale de 10 ans après la dernière séance est recommandée. Pour les mineurs, la durée court jusqu'aux 28 ans du patient. PsyLib permet d'archiver les dossiers tout en maintenant leur accessibilité.",
          },
        },
        {
          '@type': 'Question',
          name: 'Un patient peut-il accéder à son dossier chez son psychologue ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Le RGPD (article 15) donne à toute personne le droit d'accéder à ses données personnelles détenues par un professionnel. Le patient peut demander une copie de son dossier. Le praticien dispose de 30 jours pour répondre. PsyLib intègre un export RGPD du dossier patient en format PDF.",
          },
        },
        {
          '@type': 'Question',
          name: "Les notes de séance d'un psychologue sont-elles des données de santé ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Les notes de séance d'un psychologue — contenu des entretiens, évaluations cliniques, hypothèses diagnostiques, historique symptomatique — sont des données de santé au sens de l'article 9 du RGPD et de l'article L.1111-8 du Code de la santé publique. Leur traitement est soumis à des obligations renforcées, notamment l'hébergement sur infrastructure certifiée HDS.",
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
          name: 'Dossier patient psychologue',
          item: 'https://psylib.eu/guides/dossier-patient-psychologue',
        },
      ],
    },
  ],
};

export default function PageDossierPatient() {
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
          <span className="text-gray-700">Dossier patient psychologue</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Dossier patient psychologue : obligations légales et bonnes pratiques
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Que doit contenir un dossier patient, quelles sont les obligations légales,
            comment assurer le chiffrement et la conformité RGPD dans un cabinet libéral.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Le dossier patient est le pivot de l&apos;activité clinique d&apos;un psychologue
            libéral. Il rassemble l&apos;ensemble des informations recueillies au cours du suivi :
            anamnèse, évaluations, notes de séance, comptes rendus, correspondances. Sa tenue
            rigoureuse est indispensable pour assurer la continuité des soins, justifier ses
            actes en cas de mise en cause déontologique, et répondre aux obligations légales.
          </p>
          <p className="mt-4 leading-relaxed">
            Dans sa version numérique, le dossier patient est soumis à des exigences légales
            renforcées : certification HDS pour l&apos;hébergeur, chiffrement des données
            sensibles, respect du RGPD et mise en place d&apos;une politique de durée de
            conservation.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Obligations légales et déontologiques
          </h2>
          <p className="mb-4 leading-relaxed">
            La tenue d&apos;un dossier patient n&apos;est pas explicitement imposée par la loi
            pour les psychologues libéraux, mais elle est fortement recommandée par les instances
            professionnelles (SNP, CNCDP) et constitue une obligation déontologique implicite
            découlant du Code de déontologie des psychologues. De plus, plusieurs dispositions
            légales rendent indirectement obligatoire la tenue d&apos;un dossier conforme.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le droit d&apos;accès du patient (RGPD)
          </h3>
          <p className="mb-4 leading-relaxed">
            En vertu de l&apos;article 15 du RGPD, tout patient a le droit d&apos;accéder à
            l&apos;ensemble des données personnelles le concernant que détient son psychologue.
            Le praticien dispose de 30 jours pour répondre à cette demande et fournir une copie
            des données. L&apos;absence de dossier structuré rend cette obligation difficile à
            honorer.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le droit à l&apos;effacement
          </h3>
          <p className="mb-4 leading-relaxed">
            Le RGPD prévoit également un droit à l&apos;effacement des données (article 17).
            Le patient peut demander la suppression de son dossier, sous réserve que cela
            ne contrevienne pas à d&apos;autres obligations légales (conservation de pièces
            comptables par exemple). Le praticien doit être en mesure de procéder à cette
            suppression de manière complète et traçable.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La durée de conservation
          </h3>
          <p className="mb-4 leading-relaxed">
            Par analogie avec les dossiers médicaux, une durée minimale de conservation de
            10 ans après la dernière consultation est recommandée pour les dossiers de
            psychologue libéral. Pour les patients mineurs, le délai court jusqu&apos;aux
            28 ans du patient (majorité + 8 ans). Ces délais doivent être documentés dans
            la politique de confidentialité du cabinet.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Contenu d&apos;un dossier patient bien structuré
          </h2>
          <p className="mb-4 leading-relaxed">
            Un dossier patient complet et bien structuré facilite le travail clinique au quotidien
            et garantit la traçabilité en cas de besoin. Voici les sections essentielles à
            prévoir :
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Informations administratives
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Nom, prénom, date de naissance</li>
            <li>Adresse, téléphone, email</li>
            <li>Médecin traitant et contacts d&apos;urgence</li>
            <li>Mode de contact et source d&apos;orientation</li>
            <li>Consentements RGPD signés et versionnés</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Anamnèse et bilan initial
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Motif de consultation et demande initiale</li>
            <li>Histoire de vie et antécédents</li>
            <li>Traitements médicamenteux en cours</li>
            <li>Objectifs thérapeutiques définis en commun</li>
            <li>Résultats des questionnaires standardisés initiaux (PHQ-9, GAD-7…)</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Historique des séances
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Date, durée et type de chaque séance</li>
            <li>Notes cliniques structurées (SOAP, DAP ou format libre)</li>
            <li>Techniques utilisées et exercices assignés</li>
            <li>Points de suivi pour la prochaine séance</li>
            <li>Évolution des scores aux questionnaires standardisés</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Documents et correspondances
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Comptes rendus de bilan et attestations</li>
            <li>Correspondances avec d&apos;autres professionnels de santé</li>
            <li>Courriers d&apos;adressage reçus et envoyés</li>
            <li>Justificatifs de paiement et historique de facturation</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Chiffrement et sécurité des données
          </h2>
          <p className="mb-4 leading-relaxed">
            Les données contenues dans les notes de séance sont des données de santé au sens
            du RGPD (article 9) et de l&apos;article L.1111-8 du Code de la santé publique.
            Leur hébergement en ligne impose une infrastructure certifiée HDS. Mais la
            certification HDS de l&apos;hébergeur ne dispense pas d&apos;un chiffrement
            complémentaire au niveau applicatif.
          </p>
          <p className="mb-4 leading-relaxed">
            Le chiffrement applicatif (par exemple en AES-256-GCM) garantit que même en cas
            d&apos;accès non autorisé à la base de données, les données cliniques restent
            illisibles. C&apos;est une mesure de défense en profondeur indispensable pour les
            données les plus sensibles : notes de séance, résumés cliniques, journal du patient.
          </p>
          <p className="mb-4 leading-relaxed">
            PsyLib chiffre tous les champs sensibles des dossiers patients en AES-256-GCM au
            niveau applicatif, en complément de l&apos;hébergement sur infrastructure certifiée
            HDS. Chaque accès à des données chiffrées est enregistré dans un journal d&apos;audit
            horodaté, garantissant la traçabilité complète des consultations.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Dossier papier vs dossier numérique : que choisir ?
          </h2>
          <p className="mb-4 leading-relaxed">
            Le dossier papier reste légal mais présente des inconvénients croissants : risque de
            perte ou de vol, impossibilité de recherche instantanée, difficulté d&apos;archivage
            sur 10 ans, non-conformité RGPD si les données ne sont pas sécurisées physiquement
            (cabinet fermé à clé, pas d&apos;accès tiers). Le dossier numérique, sur une
            plateforme certifiée HDS, offre une sécurité supérieure, une recherche instantanée,
            un accès depuis n&apos;importe quel appareil et une traçabilité automatique.
          </p>
          <p className="mb-4 leading-relaxed">
            La transition vers le numérique est facilitée par des outils comme PsyLib, qui
            propose un onboarding guidé et permet d&apos;importer des données existantes.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Dossiers patients chiffrés HDS, accès RGPD intégré, journal d&apos;audit automatique.
            Sans carte bancaire.
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
                q: "Un psychologue libéral est-il obligé de tenir un dossier patient ?",
                a: "Ce n'est pas une obligation légale explicite, mais c'est une obligation déontologique forte recommandée par les instances professionnelles. De plus, le RGPD impose indirectement sa tenue : sans dossier structuré, impossible de répondre dans les délais aux demandes d'accès et d'effacement des patients.",
              },
              {
                q: "Combien de temps conserver un dossier patient en psychologie ?",
                a: "Par analogie avec les dossiers médicaux, 10 ans après la dernière séance est recommandé. Pour les mineurs, jusqu'aux 28 ans du patient. PsyLib permet d'archiver les dossiers et de configurer des alertes de durée de conservation.",
              },
              {
                q: "Les notes de séance sont-elles des données de santé ?",
                a: "Oui. Les notes de séance d'un psychologue (contenu des entretiens, évaluations, hypothèses cliniques) sont des données de santé au sens du RGPD et du Code de la santé publique. Leur hébergement en ligne nécessite une infrastructure certifiée HDS.",
              },
              {
                q: "Un patient peut-il accéder à son dossier psychologique ?",
                a: "Oui. Le RGPD (article 15) donne ce droit. Le praticien dispose de 30 jours pour fournir une copie des données. PsyLib intègre un export RGPD du dossier patient en PDF, accessible depuis le tableau de bord en quelques clics.",
              },
              {
                q: "Comment PsyLib sécurise-t-il les dossiers patients ?",
                a: "PsyLib chiffre tous les champs sensibles (notes, résumés IA, messages) en AES-256-GCM au niveau applicatif. L'hébergement est sur infrastructure certifiée HDS en France. Chaque accès à des données sensibles est enregistré dans un journal d'audit horodaté.",
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

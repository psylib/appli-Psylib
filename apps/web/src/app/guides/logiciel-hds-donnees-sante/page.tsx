import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Logiciel HDS et données de santé : ce que les psychologues doivent savoir | PsyLib',
  description:
    'Qu\'est-ce que la certification HDS, pourquoi elle est obligatoire pour les psychologues, risques d\'un logiciel non conforme. PsyLib est hébergé sur infrastructure certifiée HDS en France.',
  keywords: [
    'logiciel HDS données de santé',
    'hébergement données patients psychologue',
    'conformité HDS RGPD psy',
    'certification HDS psychologue',
    'logiciel conforme psychologue',
    'RGPD psychologue données patients',
    'hébergeur certifié HDS',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/logiciel-hds-donnees-sante' },
  openGraph: {
    title: 'Logiciel HDS et données de santé : ce que les psychologues doivent savoir',
    description:
      'Certification HDS obligatoire, risques d\'un logiciel non conforme, sanctions CNIL — et comment PsyLib garantit la conformité HDS des données patients.',
    url: 'https://psylib.eu/guides/logiciel-hds-donnees-sante',
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
      headline: 'Logiciel HDS et données de santé : ce que les psychologues doivent savoir',
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
          name: "Qu'est-ce que la certification HDS et pourquoi est-elle obligatoire ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "La certification HDS (Hébergeur de Données de Santé) est une certification délivrée par des organismes accrédités et encadrée par l'article L.1111-8 du Code de la santé publique. Elle impose à tout hébergeur de données de santé à caractère personnel de disposer d'une certification démontrant la sécurité et la conformité de ses infrastructures. Pour les psychologues, utiliser un logiciel dont l'hébergeur est certifié HDS est une obligation légale.",
          },
        },
        {
          '@type': 'Question',
          name: "Quels sont les risques d'utiliser un logiciel non certifié HDS pour un psychologue ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les sanctions potentielles incluent : amende CNIL jusqu'à 20 millions d'euros ou 4 % du chiffre d'affaires annuel mondial, signalement à l'ordre professionnel, action en responsabilité civile en cas de violation de données. Au-delà des sanctions, une violation de données (fuite, vol, accès non autorisé) porte atteinte à la confidentialité des patients, qui est le fondement éthique de la pratique psychologique.",
          },
        },
        {
          '@type': 'Question',
          name: "Les données de psychologie sont-elles vraiment des données de santé au sens légal ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Les données consignées par un psychologue — notes de séance, évaluations cliniques, comptes rendus, hypothèses diagnostiques — sont des données relatives à la santé mentale d'une personne. Elles constituent des données de santé au sens de l'article 9 du RGPD et de l'article L.1111-8 du Code de la santé publique, soumises aux obligations renforcées de traitement et d'hébergement.",
          },
        },
        {
          '@type': 'Question',
          name: "Google Drive ou Dropbox peuvent-ils être utilisés pour stocker des données patients ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Non. Google Drive et Dropbox ne sont pas certifiés HDS en France. Leurs serveurs sont localisés hors de France, soumis au droit américain (Cloud Act). Stocker des données patients de psychologie sur ces services est illégal au regard du RGPD et de l'article L.1111-8 du CSP.",
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
          name: 'Logiciel HDS données de santé',
          item: 'https://psylib.eu/guides/logiciel-hds-donnees-sante',
        },
      ],
    },
  ],
};

export default function PageLogicielHDS() {
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
          <span className="text-gray-700">Logiciel HDS données de santé</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Logiciel HDS et données de santé : ce que les psychologues doivent savoir
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Certification HDS, obligations légales, risques d&apos;un logiciel non conforme,
            sanctions CNIL — le guide complet pour comprendre et respecter la réglementation
            sur les données patients en psychologie.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La question de la conformité des outils numériques est l&apos;une des plus importantes
            et des moins bien comprises par les psychologues libéraux. Utiliser le mauvais logiciel
            pour stocker des données patients n&apos;est pas seulement une question de bonne
            pratique professionnelle : c&apos;est une obligation légale dont le non-respect expose
            à des sanctions sévères. Ce guide explique les fondements de la réglementation HDS
            et ses implications concrètes pour le cabinet libéral.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Qu&apos;est-ce que la certification HDS ?
          </h2>
          <p className="mb-4 leading-relaxed">
            HDS signifie « Hébergeur de Données de Santé ». C&apos;est une certification
            française encadrée par l&apos;article L.1111-8 du Code de la santé publique,
            délivrée par des organismes de certification accrédités (comme Bureau Veritas ou
            BSI). Cette certification atteste que l&apos;hébergeur respecte un référentiel
            de sécurité exigeant, adapté aux spécificités des données de santé : sécurité
            physique des datacenters, chiffrement des données, contrôle des accès, plans de
            continuité d&apos;activité, audits réguliers.
          </p>
          <p className="mb-4 leading-relaxed">
            La certification HDS comporte deux niveaux :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li><strong>Niveau 1 (infrastructure)</strong> : hébergement physique (datacenters), gestion des serveurs</li>
            <li><strong>Niveau 2 (hébergeur managé)</strong> : plateforme logicielle, édition du logiciel</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Un éditeur de logiciel santé doit être certifié HDS niveau 2 et s&apos;appuyer
            sur un prestataire d&apos;infrastructure certifié niveau 1. En France, les principaux
            prestataires certifiés HDS niveau 1 sont : AWS eu-west-3 (Paris), OVHcloud HDS,
            Microsoft Azure France Central, et quelques opérateurs français spécialisés.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Pourquoi les données de psychologie sont-elles concernées ?
          </h2>
          <p className="mb-4 leading-relaxed">
            Une confusion fréquente consiste à croire que les obligations HDS ne s&apos;appliquent
            qu&apos;aux médecins, aux hôpitaux ou aux pharmaciens. Cette confusion est dangereuse.
            L&apos;article L.1111-8 du Code de la santé publique s&apos;applique à tout
            hébergement de données de santé à caractère personnel, indépendamment de la
            profession de celui qui les collecte.
          </p>
          <p className="mb-4 leading-relaxed">
            Les notes de séance d&apos;un psychologue contiennent des données relatives à la
            santé mentale d&apos;une personne identifiée. Ces données sont explicitement
            listées comme données de santé au sens de l&apos;article 9 du RGPD et de
            l&apos;article L.1111-8. Elles ne peuvent légalement être hébergées en ligne que
            sur une infrastructure certifiée HDS.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Ce qui est concerné concrètement
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Notes de séance (contenu des entretiens, thèmes abordés)</li>
            <li>Évaluations et hypothèses diagnostiques</li>
            <li>Comptes rendus de bilan neuropsychologique</li>
            <li>Résumés de suivi thérapeutique</li>
            <li>Données de suivi de l&apos;humeur et questionnaires standardisés</li>
            <li>Journal du patient (même si rédigé par le patient lui-même)</li>
            <li>Messages sécurisés praticien-patient sur des sujets cliniques</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Ce qui n&apos;est pas nécessairement concerné (à la marge) : l&apos;agenda seul
            avec des codes anonymisés, les données comptables sans lien avec l&apos;identité
            des patients.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les risques d&apos;un logiciel non certifié HDS
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Les sanctions CNIL
          </h3>
          <p className="mb-4 leading-relaxed">
            La Commission Nationale de l&apos;Informatique et des Libertés (CNIL) peut
            infliger des amendes allant jusqu&apos;à 20 millions d&apos;euros ou 4 % du
            chiffre d&apos;affaires annuel mondial en cas de violation du RGPD liée à un
            hébergement non conforme. Pour un psychologue libéral, une sanction de 10 000
            à 50 000 euros est envisageable en cas de contrôle avec manquement caractérisé.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La responsabilité civile
          </h3>
          <p className="mb-4 leading-relaxed">
            En cas de violation de données (piratage, fuite, accès non autorisé), le praticien
            ayant utilisé un logiciel non conforme engage sa responsabilité civile envers les
            patients dont les données ont été compromises. Les patients peuvent obtenir des
            dommages et intérêts devant les juridictions civiles.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La responsabilité déontologique
          </h3>
          <p className="mb-4 leading-relaxed">
            Le Code de déontologie des psychologues impose le respect de la confidentialité.
            Utiliser sciemment un logiciel non conforme pour héberger des données sensibles
            constitue un manquement déontologique pouvant entraîner des sanctions de
            l&apos;ordre professionnel.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comment vérifier si un logiciel est conforme HDS
          </h2>
          <p className="mb-4 leading-relaxed">
            Avant de souscrire à un logiciel de gestion de cabinet, posez les questions suivantes
            à l&apos;éditeur :
          </p>
          <ol className="mb-4 list-decimal list-inside space-y-2 text-gray-700">
            <li>Votre logiciel est-il hébergé par un prestataire certifié HDS niveau 1 ?</li>
            <li>Votre entreprise est-elle certifiée HDS niveau 2 comme hébergeur managé ?</li>
            <li>Les données sont-elles hébergées exclusivement en France ou dans l&apos;UE ?</li>
            <li>Disposez-vous d&apos;un DPA (Data Processing Agreement) RGPD signable ?</li>
            <li>Comment sont chiffrées les données au repos et en transit ?</li>
          </ol>
          <p className="mb-4 leading-relaxed">
            Un éditeur sérieux doit pouvoir répondre précisément à chacune de ces questions
            et vous fournir les documents de conformité correspondants.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            PsyLib : certifié HDS, hébergé en France
          </h3>
          <p className="mb-4 leading-relaxed">
            PsyLib est hébergé sur infrastructure certifiée HDS en France (AWS eu-west-3 Paris
            pour le compute et la base de données, OVHcloud HDS pour l&apos;authentification
            et les backups). Les données cliniques sont chiffrées en AES-256-GCM au niveau
            applicatif. L&apos;assistant IA ne traite jamais de données identifiantes sans
            consentement explicite du patient. Un DPA RGPD est disponible sur demande.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Hébergement certifié HDS en France, chiffrement AES-256-GCM, conformité RGPD intégrée.
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
                q: "Qu'est-ce que la certification HDS et pourquoi est-elle obligatoire ?",
                a: "HDS est une certification encadrée par l'article L.1111-8 du CSP. Elle est obligatoire pour tout hébergeur de données de santé en ligne. Pour les psychologues, utiliser un logiciel dont l'hébergeur est certifié HDS est une obligation légale.",
              },
              {
                q: "Quels risques encourt un psychologue utilisant un logiciel non certifié HDS ?",
                a: "Amende CNIL jusqu'à 20 millions d'euros, responsabilité civile envers les patients en cas de violation de données, sanctions déontologiques. Ces risques sont réels et documentés.",
              },
              {
                q: "Les données de psychologie sont-elles vraiment des données de santé ?",
                a: "Oui. Les notes de séance, évaluations, bilans et hypothèses diagnostiques d'un psychologue sont des données de santé mentale au sens du RGPD (art. 9) et du Code de la santé publique (art. L.1111-8).",
              },
              {
                q: "Google Drive ou Dropbox peuvent-ils être utilisés pour les données patients ?",
                a: "Non. Ces services ne sont pas certifiés HDS. Leurs serveurs sont soumis au droit américain (Cloud Act). Leur utilisation pour stocker des données patients est illégale.",
              },
              {
                q: "Comment PsyLib garantit-il la conformité HDS ?",
                a: "PsyLib est hébergé sur AWS eu-west-3 Paris (certifié HDS) et OVHcloud HDS. Les données sont chiffrées en AES-256-GCM au niveau applicatif. Un DPA RGPD est disponible. L'IA ne traite jamais de données identifiantes sans consentement.",
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

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Téléconsultation psychologue : cadre légal et outils conformes HDS | PsyLib',
  description:
    'Cadre légal de la téléconsultation en psychologie, outils visio conformes HDS, bonnes pratiques éthiques et intégration avec PsyLib pour une pratique sécurisée en 2026.',
  keywords: [
    'téléconsultation psychologue',
    'psychologue en ligne visio',
    'consultation psy à distance',
    'visio psychologue HDS',
    'logiciel téléconsultation psy',
    'thérapie en ligne France',
    'consultation psychologue internet',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/teleconsultation-psychologue' },
  openGraph: {
    title: 'Téléconsultation psychologue : cadre légal et outils conformes HDS',
    description:
      'Tout savoir sur la téléconsultation en psychologie : cadre légal, outils visio conformes HDS, bonnes pratiques et intégration avec PsyLib.',
    url: 'https://psylib.eu/guides/teleconsultation-psychologue',
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
      headline: 'Téléconsultation psychologue : cadre légal et outils conformes HDS',
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
          name: 'La téléconsultation est-elle légale pour un psychologue libéral ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. La téléconsultation est légale pour les psychologues libéraux en France depuis 2020. Elle ne nécessite pas d'agrément spécifique. Le praticien doit s'assurer que l'outil utilisé est conforme HDS pour les données patients et que le patient dispose d'un environnement permettant la confidentialité.",
          },
        },
        {
          '@type': 'Question',
          name: 'Peut-on utiliser Zoom pour les séances de psychologie en ligne ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Zoom standard n'est pas certifié HDS en France. Son utilisation pour des consultations de psychologie est à risque sur le plan RGPD et HDS. Il existe des alternatives conformes : Whereby Healthcare, Doctolib Visio, ou des solutions intégrées dans des logiciels HDS comme PsyLib.",
          },
        },
        {
          '@type': 'Question',
          name: "Faut-il un consentement spécifique du patient pour la téléconsultation ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Il est recommandé de recueillir un consentement explicite du patient pour la pratique en visio, distinct du consentement RGPD standard. Ce consentement doit mentionner les limites de la téléconsultation, les mesures de confidentialité prises et les conditions dans lesquelles la consultation présentielle reste nécessaire.",
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
          name: 'Téléconsultation psychologue',
          item: 'https://psylib.eu/guides/teleconsultation-psychologue',
        },
      ],
    },
  ],
};

export default function PageTeleconsultation() {
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
          <span className="text-gray-700">Téléconsultation psychologue</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Téléconsultation psychologue : cadre légal et outils conformes HDS
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Cadre légal, outils visio conformes, bonnes pratiques éthiques — tout ce
            qu&apos;un psychologue libéral doit savoir avant de proposer des consultations
            à distance.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Depuis 2020, la téléconsultation s&apos;est imposée dans la pratique de nombreux
            psychologues libéraux. Elle permet d&apos;élargir la zone de chalandise, de proposer
            des suivis aux patients à mobilité réduite ou éloignés, et d&apos;assurer la
            continuité des soins en cas d&apos;empêchement (praticien ou patient). Mais la
            consultation à distance soulève des questions légales, déontologiques et
            technologiques spécifiques auxquelles tout praticien doit répondre avant de
            s&apos;y engager.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Le cadre légal de la téléconsultation en psychologie
          </h2>
          <p className="mb-4 leading-relaxed">
            En France, la téléconsultation est légale pour les psychologues libéraux.
            Contrairement aux médecins, les psychologues ne sont pas soumis au décret de
            2018 sur la télémédecine (réservé aux professionnels de santé au sens du Code
            de la santé publique). Ils exercent donc la téléconsultation dans le cadre général
            du droit commun, sous réserve de respecter les principes déontologiques de leur
            profession.
          </p>
          <p className="mb-4 leading-relaxed">
            Les principaux textes applicables sont :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Le Code de déontologie des psychologues (principe de bienfaisance, de non-malfaisance)</li>
            <li>Le RGPD pour la protection des données du patient</li>
            <li>La loi Informatique et Libertés pour le traitement des données sensibles</li>
            <li>L&apos;article L.1111-8 du Code de la santé publique pour l&apos;hébergement des données</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Aucun agrément spécifique n&apos;est requis pour pratiquer la téléconsultation
            en psychologie. Cependant, le praticien doit s&apos;assurer que l&apos;outil
            utilisé est conforme à la réglementation sur les données de santé.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les enjeux déontologiques de la pratique à distance
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            L&apos;évaluation de l&apos;indication
          </h3>
          <p className="mb-4 leading-relaxed">
            La téléconsultation n&apos;est pas adaptée à toutes les situations cliniques.
            Les recommandations des associations professionnelles (SFP, FFPP) soulignent que
            certains profils nécessitent un cadre présentiel : troubles dissociatifs sévères,
            état de crise suicidaire active, troubles psychotiques en phase aiguë, première
            consultation avec un patient en grande souffrance. Le praticien doit évaluer
            au cas par cas l&apos;indication de la téléconsultation.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La confidentialité de l&apos;espace du patient
          </h3>
          <p className="mb-4 leading-relaxed">
            La thérapie à distance exige du patient qu&apos;il dispose d&apos;un espace
            confidentiel pour les séances. Le praticien doit aborder ce point explicitement
            lors de la première consultation à distance, vérifier que le patient est seul,
            et lui rappeler qu&apos;il lui appartient de garantir la confidentialité de son
            côté (utilisation d&apos;écouteurs, porte fermée, etc.).
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le consentement éclairé pour la visio
          </h3>
          <p className="mb-4 leading-relaxed">
            Un consentement explicite doit être recueilli avant toute première consultation
            à distance. Ce consentement doit préciser les limites de la téléconsultation
            (absence de contact visuel complet, risque technique), les mesures de sécurité
            prises par le praticien, et les conditions dans lesquelles il recommanderait
            un retour en présentiel.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Quels outils visio utiliser ? La question de la conformité HDS
          </h2>
          <p className="mb-4 leading-relaxed">
            Le choix de l&apos;outil visio est critique. Une consultation de psychologie
            génère des données de santé : le contenu échangé, l&apos;identité du patient,
            et la métadonnée de la consultation (date, durée) sont des données sensibles.
            L&apos;outil visio doit donc être hébergé sur une infrastructure conforme aux
            exigences françaises.
          </p>

          <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F0F9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Outil</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Conformité HDS</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium">Zoom (standard)</td>
                  <td className="px-4 py-3 text-red-600 font-medium">Non conforme HDS</td>
                  <td className="px-4 py-3">Serveurs US, pas de certification HDS France</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Google Meet</td>
                  <td className="px-4 py-3 text-red-600 font-medium">Non conforme HDS</td>
                  <td className="px-4 py-3">Serveurs non HDS pour données santé</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Whereby Healthcare</td>
                  <td className="px-4 py-3 text-green-700 font-medium">Conforme RGPD</td>
                  <td className="px-4 py-3">Solution santé dédiée, RGPD conforme</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Doctolib Visio</td>
                  <td className="px-4 py-3 text-green-700 font-medium">Certifié HDS</td>
                  <td className="px-4 py-3">Intégré à Doctolib, coût élevé</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#3D52A0]">PsyLib (intégré)</td>
                  <td className="px-4 py-3 text-green-700 font-medium">Certifié HDS</td>
                  <td className="px-4 py-3">Intégré au logiciel de gestion, dossier lié</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mb-4 leading-relaxed">
            La solution la plus cohérente est d&apos;utiliser un outil visio intégré directement
            dans votre logiciel de gestion de cabinet. Cela permet de lier la séance visio au
            dossier du patient, de créer la note de séance immédiatement après la consultation
            et de générer la facture en un clic, le tout dans un environnement certifié HDS.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Configurer son cabinet pour la téléconsultation avec PsyLib
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib permet de gérer les séances en présentiel et en téléconsultation depuis
            la même interface. Les séances à distance peuvent être signalées comme telles
            dans l&apos;agenda et dans les notes de séance. La facturation adapte
            automatiquement les mentions légales selon le type de séance.
          </p>
          <p className="mb-4 leading-relaxed">
            Le module de messagerie sécurisée permet d&apos;échanger avec les patients entre
            les séances — partage de documents, confirmations de rendez-vous, transmission
            d&apos;exercices — dans un environnement chiffré et certifié HDS, sans passer
            par des outils de messagerie non conformes (WhatsApp, Gmail).
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Gestion des séances présentiel et visio, messagerie HDS, dossiers patients chiffrés.
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
                q: "La téléconsultation est-elle légale pour un psychologue libéral ?",
                a: "Oui. Aucun agrément spécifique n'est requis. Le praticien doit respecter le Code de déontologie, le RGPD et utiliser des outils conformes HDS pour les données patients.",
              },
              {
                q: "Peut-on utiliser Zoom pour les séances de psychologie ?",
                a: "Zoom standard n'est pas certifié HDS en France. Son utilisation avec des données patients identifiées expose à un risque légal. Des alternatives conformes existent : Whereby Healthcare, Doctolib Visio, ou PsyLib.",
              },
              {
                q: "Faut-il un consentement spécifique pour la téléconsultation ?",
                a: "Oui. Il est recommandé de recueillir un consentement explicite pour la pratique en visio, distinct du consentement RGPD standard. Ce consentement doit mentionner les limites de la téléconsultation et les mesures de sécurité prises.",
              },
              {
                q: "Quelles situations cliniques contre-indiquent la téléconsultation ?",
                a: "Les associations professionnelles déconseillent la téléconsultation pour : les états de crise suicidaire active, les troubles dissociatifs sévères, les premiers entretiens avec des patients en grande détresse, et certains troubles psychotiques en phase aiguë.",
              },
              {
                q: "Comment facturer les téléconsultations ?",
                a: "Les téléconsultations se facturent comme les consultations en présentiel pour les psychologues libéraux. Le montant est libre sauf dans le cadre du dispositif Mon Soutien Psy. PsyLib permet de distinguer les séances présentiel et visio dans les notes de séance et les factures.",
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

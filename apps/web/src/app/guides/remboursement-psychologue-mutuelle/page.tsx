import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Remboursement psychologue par la mutuelle : guide complet 2026 | PsyLib',
  description:
    'Ce que rembourse la mutuelle pour un psychologue libéral, comment générer des attestations conformes, différence Mon Soutien Psy vs libéral. PsyLib simplifie les attestations.',
  keywords: [
    'remboursement psychologue mutuelle',
    'séance psy remboursée',
    'attestation psy mutuelle',
    'mutuelle psychologue libéral',
    'remboursement psy Sécurité sociale',
    'Mon Soutien Psy remboursement',
    'attestation séance psychologue',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/remboursement-psychologue-mutuelle' },
  openGraph: {
    title: 'Remboursement psychologue par la mutuelle : guide complet 2026',
    description:
      'Tout comprendre sur le remboursement des séances de psychologie — Sécurité sociale, mutuelles, Mon Soutien Psy — et comment générer des attestations conformes avec PsyLib.',
    url: 'https://psylib.eu/guides/remboursement-psychologue-mutuelle',
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
      headline: 'Remboursement psychologue par la mutuelle : guide complet 2026',
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
          name: 'La Sécurité sociale rembourse-t-elle les séances chez un psychologue libéral ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Hors dispositif Mon Soutien Psy, les séances chez un psychologue libéral ne sont pas remboursées par la Sécurité sociale. Seul Mon Soutien Psy permet un remboursement de 40 euros par séance (sur 8 séances maximum par an) sur prescription du médecin traitant, pour des troubles légers à modérés.',
          },
        },
        {
          '@type': 'Question',
          name: 'Ma mutuelle peut-elle rembourser les séances de psychologue ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Oui. De nombreuses mutuelles proposent des remboursements partiels ou forfaitaires pour les consultations chez un psychologue libéral, même en dehors de Mon Soutien Psy. Les montants varient selon le contrat : de 20 à 60 euros par séance, souvent limités à 3 ou 10 séances par an. Consultez votre tableau de garanties ou appelez votre mutuelle.',
          },
        },
        {
          '@type': 'Question',
          name: "Qu'est-ce qu'une attestation de séance pour la mutuelle ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "C'est un document remis au patient par le psychologue, attestant qu'une ou plusieurs séances ont bien eu lieu. Ce document mentionne les coordonnées du praticien (nom, numéro ADELI), la date des séances, le montant réglé et la signature du psychologue. PsyLib génère ces attestations automatiquement depuis le dossier du patient.",
          },
        },
        {
          '@type': 'Question',
          name: 'Quelle est la différence entre Mon Soutien Psy et une consultation libérale classique ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Mon Soutien Psy est un dispositif de remboursement conditionné à une prescription médicale et limité à 8 séances par an pour des troubles légers à modérés. Le tarif est conventionné à 50 euros. En consultation libérale classique, le praticien fixe librement ses honoraires, sans prescription requise, sans limite de séances ni de pathologie ciblée.',
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
          name: 'Remboursement psychologue mutuelle',
          item: 'https://psylib.eu/guides/remboursement-psychologue-mutuelle',
        },
      ],
    },
  ],
};

export default function PageRemboursementMutuelle() {
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
          <span className="text-gray-700">Remboursement psychologue mutuelle</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Remboursement psychologue par la mutuelle : tout comprendre en 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Sécurité sociale, mutuelles, Mon Soutien Psy, attestations — le point complet sur les
            remboursements des séances de psychologie en France.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La question du remboursement des séances de psychologue est l&apos;une des plus
            fréquemment posées par les patients. La réponse est nuancée : si la Sécurité sociale
            ne rembourse pas les consultations chez un psychologue libéral hors dispositif Mon
            Soutien Psy, de nombreuses mutuelles proposent des prises en charge partielles. Pour
            le psychologue libéral, comprendre ce système est essentiel : il lui permet de
            répondre aux questions de ses patients et de fournir les attestations nécessaires
            sans perdre de temps administratif.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Ce que rembourse la Sécurité sociale
          </h2>
          <p className="mb-4 leading-relaxed">
            La Sécurité sociale (Assurance Maladie) ne rembourse pas les consultations chez un
            psychologue libéral dans le cadre ordinaire d&apos;une pratique en secteur non
            conventionné. Les psychologues ne sont pas des professionnels de santé au sens du
            Code de la Sécurité sociale — même si leurs données cliniques sont des données de
            santé au sens du Code de la santé publique. Cette nuance est souvent source de
            confusion.
          </p>
          <p className="mb-4 leading-relaxed">
            Exception notable : le dispositif Mon Soutien Psy (ex-Mon Psy), lancé en 2022 et
            réformé en 2024, permet un remboursement partiel dans des conditions précises.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le dispositif Mon Soutien Psy
          </h3>
          <p className="mb-4 leading-relaxed">
            Mon Soutien Psy permet à tout assuré social de bénéficier de 8 séances de
            psychologie remboursées par an, sur prescription d&apos;un médecin traitant. Le
            tarif est fixé à 50 euros par séance, dont 40 euros remboursés par l&apos;Assurance
            Maladie. Le reste à charge de 10 euros peut être couvert par la mutuelle selon le
            contrat.
          </p>
          <p className="mb-4 leading-relaxed">
            Ce dispositif est destiné aux personnes présentant des troubles psychiques d&apos;intensité
            légère à modérée : anxiété, dépression légère, trouble du sommeil, deuil compliqué.
            Il ne s&apos;applique pas aux troubles psychiatriques sévères nécessitant un suivi
            spécialisé. Les psychologues qui y adhèrent sont référencés sur l&apos;annuaire
            Ameli et doivent accepter le tarif conventionné de 50 euros pour ces séances.
          </p>

          <div className="mb-4 rounded-xl border border-gray-200 p-4">
            <p className="font-semibold text-[#1E1B4B]">Résumé Mon Soutien Psy</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              <li>• Prescription médicale obligatoire</li>
              <li>• Maximum 8 séances remboursées par an</li>
              <li>• Tarif : 50 € dont 40 € remboursés par l&apos;Assurance Maladie</li>
              <li>• Reste à charge patient : 10 € (souvent couvert par mutuelle)</li>
              <li>• Profil ciblé : troubles légers à modérés</li>
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Ce que rembourse la mutuelle
          </h2>
          <p className="mb-4 leading-relaxed">
            Indépendamment du dispositif Mon Soutien Psy, de nombreuses mutuelles (complémentaires
            santé) proposent des remboursements pour les consultations chez un psychologue libéral.
            Ces remboursements ne sont pas uniformes : ils dépendent du contrat souscrit, de la
            classe de garanties, et parfois de la présence ou non d&apos;un médecin traitant
            dans le parcours de soins.
          </p>
          <p className="mb-4 leading-relaxed">
            En pratique, voici les modalités les plus courantes :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Forfait annuel : entre 100 et 300 euros/an pour les séances de psy</li>
            <li>Remboursement par séance : de 20 à 60 euros par consultation</li>
            <li>Nombre de séances prises en charge : de 3 à 20 séances selon le contrat</li>
            <li>Certains contrats exigent une ordonnance médicale même pour un psy</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Les mutuelles les plus favorables aux remboursements psy sont souvent celles
            contractées collectivement par les entreprises. Les contrats individuels ont
            généralement des plafonds plus bas. Il est conseillé aux patients de contacter
            directement leur mutuelle ou de consulter leur tableau de garanties dans leur
            espace personnel en ligne.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les attestations de séance : document clé pour le remboursement
          </h2>
          <p className="mb-4 leading-relaxed">
            Pour obtenir un remboursement de leur mutuelle, les patients doivent fournir une
            attestation de séance (ou note d&apos;honoraires) émise par leur psychologue. Ce
            document est différent d&apos;une ordonnance médicale — il s&apos;agit d&apos;une
            preuve de paiement et de réalisation de la prestation.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Contenu obligatoire d&apos;une attestation conforme
          </h3>
          <p className="mb-4 leading-relaxed">
            Pour être acceptée par les mutuelles, une attestation de séance de psychologue doit
            contenir :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Nom et prénom du psychologue</li>
            <li>Numéro ADELI (identifiant professionnel obligatoire)</li>
            <li>Adresse professionnelle du cabinet</li>
            <li>Nom et prénom du patient</li>
            <li>Date(s) de la ou des séances concernées</li>
            <li>Montant réglé et mode de paiement</li>
            <li>Mention « Consultation de psychologie »</li>
            <li>Signature du praticien</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Certaines mutuelles acceptent également une facture conforme à la réglementation
            fiscale française en lieu et place d&apos;une attestation distincte.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Comment PsyLib génère les attestations automatiquement
          </h3>
          <p className="mb-4 leading-relaxed">
            PsyLib automatise la génération des attestations de séance. Depuis le dossier
            d&apos;un patient, le praticien peut générer en un clic une attestation couvrant
            une séance ou une période donnée. Le document est pré-rempli avec toutes les
            informations requises (numéro ADELI, coordonnées, dates, montants) et peut être
            envoyé directement par email au patient au format PDF.
          </p>
          <p className="mb-4 leading-relaxed">
            Cette fonctionnalité supprime une source récurrente de friction administrative :
            fini de ressaisir les informations, de chercher un modèle Word ou de scanner des
            documents à la main. En quelques secondes, le patient dispose de son attestation
            prête à soumettre à sa mutuelle.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comparatif : Mon Soutien Psy vs consultation libérale classique
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F0F9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Critère</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Mon Soutien Psy</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Libéral classique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium">Prescription requise</td>
                  <td className="px-4 py-3">Oui (médecin traitant)</td>
                  <td className="px-4 py-3">Non</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Tarif</td>
                  <td className="px-4 py-3">50 € (conventionné)</td>
                  <td className="px-4 py-3">Libre (60-150 €)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Remboursement Sécu</td>
                  <td className="px-4 py-3">40 €/séance</td>
                  <td className="px-4 py-3">0 €</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Nombre de séances</td>
                  <td className="px-4 py-3">8 max/an</td>
                  <td className="px-4 py-3">Illimité</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Profil de patient</td>
                  <td className="px-4 py-3">Troubles légers à modérés</td>
                  <td className="px-4 py-3">Tous profils</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Remboursement mutuelle</td>
                  <td className="px-4 py-3">Possible (reste à charge)</td>
                  <td className="px-4 py-3">Possible (forfait annuel)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Attestations automatiques, facturation conforme, gestion Mon Soutien Psy. Sans carte
            bancaire.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer l&apos;essai gratuit
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "La Sécurité sociale rembourse-t-elle les séances chez un psychologue libéral ?",
                a: "Hors dispositif Mon Soutien Psy, non. Mon Soutien Psy permet un remboursement de 40 euros par séance (sur 8 séances max/an) sur prescription médicale pour des troubles légers à modérés.",
              },
              {
                q: "Ma mutuelle peut-elle rembourser les séances de psychologue ?",
                a: "Oui, de nombreuses mutuelles proposent des remboursements partiels (20 à 60 euros par séance, souvent limités à 3 à 20 séances par an). Consultez votre tableau de garanties ou appelez votre mutuelle.",
              },
              {
                q: "Quelle différence entre Mon Soutien Psy et une consultation libérale classique ?",
                a: "Mon Soutien Psy est conditionné à une prescription médicale, limité à 8 séances par an avec un tarif conventionné de 50 euros. La consultation libérale classique est libre de toute prescription, sans limite de séances, avec des honoraires fixés librement.",
              },
              {
                q: "Qu'est-ce qu'une attestation de séance pour la mutuelle ?",
                a: "C'est un document prouvant qu'une consultation a eu lieu. Il doit mentionner les coordonnées du psychologue (avec numéro ADELI), du patient, la date, le montant et la signature. PsyLib génère ces attestations automatiquement.",
              },
              {
                q: "PsyLib peut-il gérer à la fois des séances Mon Soutien Psy et des séances au tarif libre ?",
                a: "Oui. PsyLib permet de définir des tarifs différents par patient et par type de séance. Les attestations et factures sont générées avec les bons montants et les bonnes mentions légales pour chaque cas.",
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

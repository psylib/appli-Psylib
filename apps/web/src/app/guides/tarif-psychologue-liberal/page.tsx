import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadMagnetCTA } from '@/components/lead-magnet-cta';

export const metadata: Metadata = {
  title: 'Tarif psychologue libéral : grille des prix en France 2026 | PsyLib',
  description:
    'Combien coûte une séance chez un psychologue libéral en 2026 ? Tarifs moyens (80-120 €), variables selon ville et spécialité, remboursements et facturation simplifiée avec PsyLib.',
  keywords: [
    'tarif psychologue libéral',
    'prix séance psychologue 2026',
    'combien coûte un psy',
    'honoraires psychologue France',
    'tarif consultation psychologue',
    'tarif psy Paris',
    'tarif psy province',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/tarif-psychologue-liberal' },
  openGraph: {
    title: 'Tarif psychologue libéral : grille des prix en France 2026',
    description:
      'Tarifs moyens en France (80-120 €/séance), différences Paris/province, comment PsyLib automatise la facturation pour les psychologues libéraux.',
    url: 'https://psylib.eu/guides/tarif-psychologue-liberal',
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
      headline: 'Tarif psychologue libéral : grille des prix en France 2026',
      description:
        'Tarifs moyens en France, différences régionales, facturation simplifiée avec PsyLib.',
      datePublished: '2026-03-16',
      dateModified: '2026-03-16',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://psylib.eu/guides/tarif-psychologue-liberal',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Quel est le tarif moyen d\'une séance chez un psychologue libéral en France ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Le tarif moyen d\'une séance de psychologie en libéral se situe entre 60 et 120 euros pour une séance individuelle de 45 à 60 minutes. À Paris et en région parisienne, les tarifs dépassent souvent 100 euros. En province, les tarifs se situent plutôt entre 60 et 90 euros. Ces honoraires sont libres : il n\'existe pas de convention nationale pour les psychologues libéraux.',
          },
        },
        {
          '@type': 'Question',
          name: 'Les séances de psychologue libéral sont-elles remboursées par la Sécurité sociale ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Les séances chez un psychologue libéral hors dispositif Mon Psy ne sont pas remboursées par la Sécurité sociale. Seul le dispositif Mon Soutien Psy (ex-Mon Psy) permet un remboursement partiel de 8 séances par an, sur prescription médicale, pour des troubles légers à modérés. En dehors de ce dispositif, seules certaines mutuelles remboursent tout ou partie des honoraires.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment fixer son tarif quand on est psychologue libéral ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Le tarif d\'un psychologue libéral est libre. Pour le fixer, il convient de tenir compte des charges du cabinet (loyer, logiciels, assurances, cotisations URSSAF), du niveau de vie local (Paris vs province), de la spécialité (neuropsychologie, TCC avancée, EMDR), de l\'expérience du praticien et des tarifs pratiqués par les confrères dans la zone de chalandise. Un calcul de seuil de rentabilité est indispensable.',
          },
        },
        {
          '@type': 'Question',
          name: 'Un psychologue libéral peut-il pratiquer le tiers-payant ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'En dehors du dispositif Mon Soutien Psy, le tiers-payant n\'est pas applicable aux psychologues libéraux de droit commun. Dans le cadre de Mon Soutien Psy, le praticien peut pratiquer le tiers-payant intégral (Assurance Maladie + mutuelle) ou le tiers-payant partiel (Assurance Maladie seule). Les modalités sont définies lors de l\'adhésion au dispositif.',
          },
        },
        {
          '@type': 'Question',
          name: 'Comment facturer ses patients en tant que psychologue libéral ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Le psychologue libéral doit émettre une note d\'honoraires pour toute prestation dépassant 25 euros. Ce document doit mentionner les coordonnées du praticien, son numéro ADELI, le numéro SIRET ou SIREN, la date de la séance, le montant, et la mention d\'exonération de TVA (article 261-4-1° du CGI). Un logiciel comme PsyLib génère ces documents en un clic et les envoie directement au patient par email.',
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
          name: 'Tarif psychologue libéral',
          item: 'https://psylib.eu/guides/tarif-psychologue-liberal',
        },
      ],
    },
  ],
};

export default function PageTarifPsychologue() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Tarif psychologue libéral</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Tarif psychologue libéral : grille des prix en France 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Tarifs moyens, variables régionales, spécialités, et comment structurer sa facturation
            pour exercer sereinement en libéral.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Contrairement aux médecins conventionnés, les psychologues libéraux fixent librement
            leurs honoraires. Cette liberté tarifaire est encadrée par l&apos;obligation de
            transparence envers les patients et par des règles déontologiques claires. En 2026,
            les tarifs pratiqués en France varient considérablement selon la localisation
            géographique, le niveau d&apos;expérience, la spécialité clinique et le type de
            consultation (présentiel ou visio).
          </p>
          <p className="mt-4 leading-relaxed">
            Ce guide fait le point sur les tarifs en vigueur, les facteurs qui les influencent, et
            les outils disponibles pour gérer la facturation de manière conforme et efficace.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Tarifs moyens en France en 2026
          </h2>
          <p className="mb-4 leading-relaxed">
            D&apos;après les données de l&apos;Observatoire des professions de santé et les
            enquêtes menées auprès de psychologues libéraux, les tarifs moyens pour une séance
            individuelle de 45 à 60 minutes se situent en 2026 dans les fourchettes suivantes :
          </p>

          <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F0F9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Zone géographique</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Fourchette basse</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Fourchette haute</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Tarif médian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium">Paris intramuros</td>
                  <td className="px-4 py-3">80 €</td>
                  <td className="px-4 py-3">150 €</td>
                  <td className="px-4 py-3 font-medium text-[#3D52A0]">110 €</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Île-de-France (hors Paris)</td>
                  <td className="px-4 py-3">70 €</td>
                  <td className="px-4 py-3">120 €</td>
                  <td className="px-4 py-3 font-medium text-[#3D52A0]">90 €</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Grandes métropoles (Lyon, Bordeaux…)</td>
                  <td className="px-4 py-3">65 €</td>
                  <td className="px-4 py-3">110 €</td>
                  <td className="px-4 py-3 font-medium text-[#3D52A0]">80 €</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Villes moyennes et milieu rural</td>
                  <td className="px-4 py-3">55 €</td>
                  <td className="px-4 py-3">90 €</td>
                  <td className="px-4 py-3 font-medium text-[#3D52A0]">70 €</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Données indicatives — Mars 2026. Les tarifs sont fixés librement par chaque praticien.
          </p>

          <p className="mt-6 leading-relaxed">
            Ces fourchettes correspondent à une séance individuelle en consultation classique.
            Les bilans neuropsychologiques, les thérapies EMDR ou les séances de groupe obéissent
            à une tarification distincte, souvent plus élevée, justifiée par le niveau de
            formation spécialisée requis.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les facteurs qui influencent le tarif
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            1. La localisation géographique
          </h3>
          <p className="mb-4 leading-relaxed">
            L&apos;écart de tarif entre Paris et une ville rurale peut atteindre 40 à 50 %. Cet
            écart reflète avant tout les différences de coût de la vie, du loyer du cabinet et
            du pouvoir d&apos;achat local des patients. Un psychologue installé à Paris doit
            facturer davantage pour couvrir ses charges, notamment le loyer d&apos;un local
            professionnel qui peut dépasser 1 500 euros par mois dans certains arrondissements.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2. La spécialité et le niveau de formation
          </h3>
          <p className="mb-4 leading-relaxed">
            Un psychologue spécialisé en neuropsychologie (bilans cognitifs, TDA/H, bilan
            dyslexie) pratique des tarifs supérieurs aux tarifs de consultation standard, les
            bilans nécessitant 3 à 6 heures de travail incluant passation, dépouillement et
            rédaction du compte-rendu. Les praticiens certifiés EMDR, IMO, ou ICV pratiquent
            également des tarifs majorés. De même, les praticiens ayant suivi une formation
            longue de psychothérapie en plus du master de psychologie facturent généralement
            davantage que les débutants.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3. L&apos;expérience du praticien
          </h3>
          <p className="mb-4 leading-relaxed">
            Les psychologues en début de carrière pratiquent généralement des tarifs d&apos;entrée
            pour constituer leur patientèle, souvent entre 55 et 70 euros selon la région. À
            mesure que l&apos;expérience s&apos;acquiert et que le bouche-à-oreille fonctionne,
            les tarifs augmentent progressivement. Les praticiens expérimentés avec une liste
            d&apos;attente peuvent se permettre des tarifs supérieurs à 100 euros, même en
            province.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            4. Le format de la consultation (présentiel ou visio)
          </h3>
          <p className="mb-4 leading-relaxed">
            La téléconsultation permet au praticien d&apos;économiser certains frais (loyer
            à l&apos;heure, frais de transport) mais n&apos;implique pas nécessairement une
            réduction tarifaire. La majorité des psychologues alignent leurs tarifs visio sur
            leurs tarifs présentiel. Certains pratiquent un légère réduction (5 à 10 %) pour
            les séances en ligne afin de compenser l&apos;absence de déplacement pour le
            patient.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5. Le type de thérapie ou de prestation
          </h3>
          <p className="mb-4 leading-relaxed">
            Au-delà de la séance individuelle classique, d&apos;autres types de prestations
            sont facturées différemment :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Séances de couple ou famille : 90-150 €/séance</li>
            <li>Séances de groupe thérapeutique : 30-60 € par participant</li>
            <li>Bilan neuropsychologique complet : 350-700 € (forfait)</li>
            <li>Supervision clinique : 80-120 €/heure</li>
            <li>Formation professionnelle et ateliers : tarif libre (souvent 500-1 500 €/jour)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comment calculer le bon tarif pour son cabinet
          </h2>
          <p className="mb-4 leading-relaxed">
            Fixer son tarif ne doit pas relever du hasard ou de l&apos;imitation des confrères.
            Un calcul rigoureux prend en compte l&apos;ensemble des charges et la capacité de
            production du praticien.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Étape 1 : Identifier ses charges annuelles
          </h3>
          <p className="mb-4 leading-relaxed">
            Pour un psychologue libéral en micro-BNC ou en déclaration contrôlée, les charges
            courantes comprennent : le loyer du cabinet ou la sous-location de bureau, les
            cotisations URSSAF (22 % des recettes en micro-BNC ou cotisations sociales réelles),
            l&apos;assurance RC professionnelle (environ 200-400 €/an), les formations continues,
            la supervision, le logiciel de gestion, le téléphone et internet, et éventuellement
            les remboursements de formation initiale.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Étape 2 : Estimer sa capacité hebdomadaire
          </h3>
          <p className="mb-4 leading-relaxed">
            Un psychologue à temps plein reçoit généralement entre 20 et 28 patients par semaine.
            Au-delà, le risque de surmenage et de perte de qualité clinique est documenté. En
            tenant compte des vacances (5 semaines), des congés maladie et des jours fériés,
            une année pleine représente environ 46 semaines effectives, soit 920 à 1 300 séances
            annuelles.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Étape 3 : Calculer le seuil de rentabilité
          </h3>
          <p className="mb-4 leading-relaxed">
            En divisant les charges annuelles totales par le nombre de séances prévues, on obtient
            le coût de revient par séance. Le tarif de facturation doit couvrir ce coût de revient
            et dégager un bénéfice suffisant pour assurer un revenu net décent. À titre
            indicatif, un psychologue avec 10 000 euros de charges annuelles et 1 000 séances
            a un coût de revient de 10 euros par séance — ce qui laisse une très large marge
            au-delà des frais fixes. Les charges sociales, qui s&apos;appliquent sur le bénéfice,
            ne doivent pas être oubliées dans ce calcul.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Tarifs et dispositif Mon Soutien Psy
          </h2>
          <p className="mb-4 leading-relaxed">
            Le dispositif Mon Soutien Psy (anciennement Mon Psy, réformé en 2024) permet à des
            patients adressés par leur médecin traitant de bénéficier de séances remboursées par
            l&apos;Assurance Maladie. Le tarif conventionnel est fixé par convention à 50 euros
            par séance (dont 40 euros remboursés par l&apos;Assurance Maladie, et 10 euros
            à la charge du patient ou de sa mutuelle).
          </p>
          <p className="mb-4 leading-relaxed">
            L&apos;adhésion à ce dispositif est volontaire. Les praticiens qui y adhèrent
            acceptent le tarif conventionné de 50 euros pour les séances entrant dans ce cadre,
            ce qui est inférieur à leurs honoraires habituels. En contrepartie, ils accèdent
            à un flux de patients supplémentaires orientés par les médecins généralistes.
          </p>
          <p className="mb-4 leading-relaxed">
            PsyLib permet de gérer en parallèle des séances au tarif libre et des séances Mon
            Soutien Psy, avec des modèles de facturation distincts et une traçabilité complète.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comment PsyLib simplifie la facturation
          </h2>
          <p className="mb-4 leading-relaxed">
            La facturation est une obligation légale souvent chronophage pour les psychologues
            libéraux. PsyLib automatise l&apos;ensemble du processus : à l&apos;issue de chaque
            séance enregistrée dans le logiciel, une note d&apos;honoraires conforme est générée
            automatiquement avec toutes les mentions légales obligatoires (numéro ADELI, SIRET,
            mention d&apos;exonération TVA, numéro séquentiel de facture).
          </p>
          <p className="mb-4 leading-relaxed">
            Le praticien peut paramétrer son tarif par défaut, définir des tarifs spécifiques
            par patient (pour le dispositif Mon Soutien Psy par exemple), et envoyer les factures
            directement par email en un clic. Le tableau de bord affiche en temps réel les
            revenus du mois, les factures impayées et le chiffre d&apos;affaires annuel.
          </p>
          <p className="mb-4 leading-relaxed">
            Toutes les données de facturation sont stockées sur infrastructure certifiée HDS
            (Hébergeur de Données de Santé), garantissant la conformité légale même pour les
            informations administratives liées aux patients.
          </p>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Facturation automatique, notes d&apos;honoraires conformes, tableau de bord financier.
            Sans carte bancaire.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer gratuitement
          </Link>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Quel est le tarif moyen d'une séance chez un psychologue libéral en France ?",
                a: "Le tarif moyen se situe entre 60 et 120 euros selon la région. À Paris, les tarifs dépassent souvent 100 euros. En province, la fourchette est de 60 à 90 euros. Ces honoraires sont librement fixés par chaque praticien, sans convention nationale.",
              },
              {
                q: "Les séances sont-elles remboursées par la Sécurité sociale ?",
                a: "Hors dispositif Mon Soutien Psy, les séances chez un psychologue libéral ne sont pas remboursées par la Sécurité sociale. Le dispositif Mon Soutien Psy permet de bénéficier de 8 séances remboursées sur prescription médicale. Certaines mutuelles proposent des remboursements partiels ou forfaitaires.",
              },
              {
                q: "Comment fixer son tarif quand on s'installe en libéral ?",
                a: "Calculez vos charges annuelles (loyer, URSSAF, assurances, logiciel, formation), estimez votre capacité hebdomadaire (20 à 28 patients), et déterminez votre seuil de rentabilité. Tenez compte du marché local et de votre niveau d'expérience. Il est recommandé de revoir ses tarifs chaque année.",
              },
              {
                q: "Un psychologue libéral doit-il émettre une facture ?",
                a: "Oui. Pour toute prestation dépassant 25 euros, le psychologue doit émettre une note d'honoraires mentionnant son numéro ADELI, SIRET, les coordonnées du patient, la date, le montant et la mention d'exonération de TVA. PsyLib génère ces documents automatiquement en conformité avec la réglementation fiscale française.",
              },
              {
                q: "PsyLib peut-il gérer plusieurs tarifs différents par patient ?",
                a: "Oui. PsyLib permet de définir un tarif par défaut pour votre cabinet et des tarifs spécifiques par patient (Mon Soutien Psy, tarif réduit, etc.). Chaque note d'honoraires est générée avec le bon montant et les bonnes mentions légales.",
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
          slug="guide-tarifs-facturation"
          title="Guide tarifs et facturation (PDF gratuit)"
          description="Recevez le guide complet : tarifs moyens 2026, exoneration TVA Art. 261, obligations URSSAF, modele de facture."
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

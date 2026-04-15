import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Outcome Tracking Psychologue : Mesurer l\'Efficacité Thérapeutique | PsyLib',
  description:
    'Mesurez objectivement les progrès de vos patients avec PHQ-9, GAD-7 et CORE-OM intégrés dans PsyLib. Outcome tracking automatisé pour psychologues libéraux.',
  keywords: [
    'outcome tracking psychologue',
    'mesurer efficacité psychothérapie',
    'PHQ-9 psychologue logiciel',
    'GAD-7 suivi patient',
    'CORE-OM thérapeute',
    'suivi progrès thérapeutique',
    'évaluation thérapeutique standardisée',
    'questionnaires cliniques psychologue',
    'mesure résultats thérapie',
    'evidence-based therapy France',
  ],
  alternates: { canonical: 'https://psylib.eu/fonctionnalites/outcome-tracking' },
  openGraph: {
    title: 'Outcome Tracking Psychologue : PHQ-9, GAD-7, CORE-OM intégrés',
    description:
      'Mesurez objectivement les progrès de vos patients avec des outils cliniques standardisés. Graphiques d\'évolution automatiques dans PsyLib.',
    url: 'https://psylib.eu/fonctionnalites/outcome-tracking',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'PsyLib — Outcome Tracking',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description:
        'Module de suivi des résultats thérapeutiques intégré à PsyLib : PHQ-9, GAD-7, CORE-OM avec graphiques d\'évolution automatiques.',
      url: 'https://psylib.eu/fonctionnalites/outcome-tracking',
      offers: {
        '@type': 'Offer',
        price: '49',
        priceCurrency: 'EUR',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '49',
          priceCurrency: 'EUR',
          unitText: 'MONTH',
        },
      },
      featureList: [
        'PHQ-9 — Dépression (9 items)',
        'GAD-7 — Anxiété généralisée (7 items)',
        'CORE-OM — Mesure globale (34 items)',
        'Graphiques d\'évolution automatiques',
        'Rappels envois questionnaires',
        'Export PDF résultats',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Qu'est-ce que l'outcome tracking en psychothérapie ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "L'outcome tracking (suivi des résultats) consiste à mesurer régulièrement l'évolution des symptômes d'un patient à l'aide de questionnaires standardisés comme le PHQ-9 (dépression), le GAD-7 (anxiété) ou le CORE-OM. Cette approche evidence-based permet au thérapeute d'objectiver les progrès et d'ajuster le traitement en temps réel.",
          },
        },
        {
          '@type': 'Question',
          name: 'Le PHQ-9 est-il validé scientifiquement pour les psychologues français ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, le PHQ-9 (Patient Health Questionnaire-9) est validé en français et largement utilisé en pratique clinique. Il mesure la sévérité de la dépression sur 9 items avec un score de 0 à 27. Un score ≥ 10 indique une dépression modérée à sévère. PsyLib calcule et interprète automatiquement ces scores.",
          },
        },
        {
          '@type': 'Question',
          name: 'Combien de temps prend le remplissage d\'un questionnaire PHQ-9 pour le patient ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Le PHQ-9 se remplit en 2 à 3 minutes. Le GAD-7 en 2 minutes. Le CORE-OM en 5 à 10 minutes. PsyLib envoie automatiquement ces questionnaires au patient avant chaque séance via l'espace patient, vous arrivez en séance avec les résultats déjà disponibles.",
          },
        },
        {
          '@type': 'Question',
          name: "L'outcome tracking améliore-t-il vraiment les résultats thérapeutiques ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, les recherches montrent que les thérapeutes qui utilisent le feedback systématique obtiennent de meilleurs résultats, notamment avec les patients qui ne progressent pas (populations dites 'at risk'). Le modèle FIT (Feedback-Informed Treatment) de Scott Miller démontre une amélioration de 65% des résultats.",
          },
        },
        {
          '@type': 'Question',
          name: "PsyLib est-il conforme RGPD pour stocker des données de questionnaires cliniques ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, PsyLib est hébergé sur infrastructure certifiée HDS (Hébergeur de Données de Santé) et conforme RGPD. Toutes les données de questionnaires sont chiffrées AES-256, stockées en France, et les patients peuvent demander leur suppression à tout moment.",
          },
        },
        {
          '@type': 'Question',
          name: "Peut-on créer ses propres questionnaires dans PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "PsyLib inclut PHQ-9, GAD-7 et CORE-OM en version standard. La possibilité de créer des questionnaires personnalisés est prévue dans les prochaines versions. Contactez-nous si vous avez des besoins spécifiques à votre orientation thérapeutique.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Fonctionnalités',
          item: 'https://psylib.eu/fonctionnalites',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Outcome Tracking',
          item: 'https://psylib.eu/fonctionnalites/outcome-tracking',
        },
      ],
    },
  ],
};

export default function OutcomeTrackingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-[#1E1B4B]/50" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-[#3D52A0]">
            Accueil
          </Link>{' '}
          /{' '}
          <Link href="/fonctionnalites" className="hover:text-[#3D52A0]">
            Fonctionnalités
          </Link>{' '}
          / <span className="text-[#3D52A0]">Outcome Tracking</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <span className="mb-4 inline-block rounded-full bg-[#3D52A0]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#3D52A0]">
            Suivi des résultats
          </span>
          <h1 className="mb-6 font-playfair text-4xl font-bold leading-tight text-[#1E1B4B] md:text-5xl">
            Outcome Tracking pour Psychologues : Mesurer les Progrès de Vos Patients
          </h1>
          <p className="text-xl leading-relaxed text-[#1E1B4B]/70">
            PHQ-9, GAD-7, CORE-OM intégrés dans PsyLib. Évaluez objectivement l&apos;évolution de
            vos patients et visualisez leurs progrès en un coup d&apos;œil.
          </p>
        </header>

        {/* Intro box */}
        <div className="mb-12 rounded-2xl bg-[#F1F0F9] p-8">
          <p className="text-base leading-relaxed text-[#1E1B4B]/80">
            <strong>L&apos;outcome tracking change radicalement la pratique clinique.</strong> Au lieu
            d&apos;évaluer les progrès de façon intuitive, vous disposez de mesures objectives,
            comparables dans le temps, basées sur des outils validés scientifiquement. PsyLib
            automatise l&apos;envoi des questionnaires, le calcul des scores, et génère des graphiques
            d&apos;évolution que vous pouvez partager avec votre patient.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les questionnaires standardisés inclus dans PsyLib
          </h2>
          <p className="mb-6 leading-relaxed text-[#1E1B4B]/70">
            PsyLib intègre les trois outils d&apos;évaluation les plus utilisés en psychologie clinique
            française, tous disponibles en version française validée.
          </p>

          <div className="mb-6 overflow-hidden rounded-xl border border-[#3D52A0]/10">
            <table className="w-full text-sm">
              <thead className="bg-[#3D52A0] text-white">
                <tr>
                  <th className="p-4 text-left">Questionnaire</th>
                  <th className="p-4 text-left">Mesure</th>
                  <th className="p-4 text-left">Items</th>
                  <th className="p-4 text-left">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#3D52A0]/10 bg-white">
                  <td className="p-4 font-semibold text-[#3D52A0]">PHQ-9</td>
                  <td className="p-4">Dépression</td>
                  <td className="p-4">9 items</td>
                  <td className="p-4">2-3 min</td>
                </tr>
                <tr className="border-t border-[#3D52A0]/10 bg-[#F1F0F9]">
                  <td className="p-4 font-semibold text-[#3D52A0]">GAD-7</td>
                  <td className="p-4">Anxiété généralisée</td>
                  <td className="p-4">7 items</td>
                  <td className="p-4">2 min</td>
                </tr>
                <tr className="border-t border-[#3D52A0]/10 bg-white">
                  <td className="p-4 font-semibold text-[#3D52A0]">CORE-OM</td>
                  <td className="p-4">Bien-être global</td>
                  <td className="p-4">34 items</td>
                  <td className="p-4">5-10 min</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="leading-relaxed text-[#1E1B4B]/70">
            Le patient reçoit automatiquement le questionnaire par email ou via son espace patient
            avant chaque séance. Vous arrivez en consultation avec les résultats déjà disponibles,
            prêts à être discutés.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Graphiques d&apos;évolution automatiques
          </h2>
          <p className="mb-4 leading-relaxed text-[#1E1B4B]/70">
            Pour chaque patient, PsyLib génère automatiquement des graphiques de progression sur la
            durée du suivi. En quelques secondes, vous visualisez :
          </p>
          <ul className="mb-6 space-y-3">
            {[
              'L\'évolution du score PHQ-9 séance par séance',
              'Les pics d\'anxiété (GAD-7) corrélés aux événements de vie',
              'La trajectoire globale de bien-être (CORE-OM)',
              'Les alertes automatiques si un score se détériore',
              'L\'export PDF pour le dossier patient ou les rapports',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 text-[#3D52A0]">✓</span>
                <span className="text-[#1E1B4B]/80">{item}</span>
              </li>
            ))}
          </ul>
          <p className="leading-relaxed text-[#1E1B4B]/70">
            Ces graphiques peuvent être partagés avec le patient pour renforcer son engagement
            thérapeutique — voir concrètement ses progrès est souvent un puissant levier de
            motivation.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Pourquoi l&apos;outcome tracking améliore vos résultats cliniques
          </h2>
          <p className="mb-4 leading-relaxed text-[#1E1B4B]/70">
            Les recherches en psychothérapie basée sur les preuves sont claires : les praticiens
            qui utilisent un feedback systématique obtiennent de meilleurs résultats, particulièrement
            avec les patients qui ne progressent pas à l&apos;attendu.
          </p>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Détection précoce des stagnations',
                desc: "Identifiez les patients 'at risk' avant qu'ils abandonnent le suivi.",
              },
              {
                title: 'Ajustement du traitement',
                desc: "Modifiez votre approche en vous appuyant sur des données objectives.",
              },
              {
                title: 'Communication avec le patient',
                desc: 'Visualiser ensemble les progrès renforce l\'alliance thérapeutique.',
              },
              {
                title: 'Documentation pour les tiers',
                desc: "Justifiez la durée du suivi auprès des médecins référents ou assurances.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl bg-[#F1F0F9] p-5">
                <h3 className="mb-2 font-semibold text-[#3D52A0]">{card.title}</h3>
                <p className="text-sm leading-relaxed text-[#1E1B4B]/70">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comment fonctionne l&apos;outcome tracking dans PsyLib
          </h2>
          <ol className="space-y-4">
            {[
              {
                step: '1',
                title: 'Configuration initiale',
                desc: 'Choisissez les questionnaires pour chaque patient (PHQ-9, GAD-7 ou CORE-OM) selon sa problématique.',
              },
              {
                step: '2',
                title: 'Envoi automatique',
                desc: 'PsyLib envoie automatiquement le questionnaire avant chaque séance (délai et fréquence configurables).',
              },
              {
                step: '3',
                title: 'Remplissage patient',
                desc: "Le patient remplit le questionnaire depuis son espace sécurisé ou par email, en 2 à 10 minutes.",
              },
              {
                step: '4',
                title: 'Résultats en séance',
                desc: "Vous accédez aux scores et graphiques d'évolution directement depuis la fiche patient.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3D52A0] text-sm font-bold text-white">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-[#1E1B4B]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#1E1B4B]/70">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes sur l&apos;outcome tracking
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Qu'est-ce que l'outcome tracking en psychothérapie ?",
                a: "L'outcome tracking consiste à mesurer régulièrement l'évolution des symptômes avec des questionnaires standardisés (PHQ-9, GAD-7, CORE-OM). Cette approche evidence-based permet d'objectiver les progrès et d'ajuster le traitement en temps réel.",
              },
              {
                q: 'Le PHQ-9 est-il validé en français ?',
                a: "Oui, le PHQ-9 est validé en français et utilisé dans toute la francophonie. PsyLib utilise la version française officielle, avec interprétation automatique des scores (0-27) : 0-4 absent, 5-9 léger, 10-14 modéré, 15-19 modérément sévère, 20-27 sévère.",
              },
              {
                q: "Combien de temps prend un questionnaire pour le patient ?",
                a: "PHQ-9 : 2-3 minutes. GAD-7 : 2 minutes. CORE-OM : 5-10 minutes. PsyLib envoie les questionnaires en amont de la séance pour que vous arriviez avec les résultats déjà disponibles.",
              },
              {
                q: "PsyLib est-il conforme HDS pour ces données cliniques ?",
                a: "Oui, PsyLib est hébergé sur infrastructure certifiée HDS. Toutes les données de questionnaires sont chiffrées AES-256, stockées en France. Conformité RGPD complète avec droit à l'effacement.",
              },
              {
                q: "Peut-on désactiver l'outcome tracking pour certains patients ?",
                a: "Oui, l'outcome tracking est entièrement configurable par patient. Vous choisissez quels questionnaires activer, à quelle fréquence, et vous pouvez le désactiver à tout moment.",
              },
              {
                q: "Les résultats sont-ils visibles par le patient ?",
                a: "Oui, si vous l'autorisez. Les patients peuvent voir leurs propres graphiques d'évolution dans leur espace patient, ce qui renforce leur engagement et leur sentiment de progrès.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-[#3D52A0]/10 bg-white p-5 open:bg-[#F1F0F9]"
              >
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-[#1E1B4B]/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-[#3D52A0] p-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Mesurez les progrès de vos patients dès aujourd&apos;hui
          </h2>
          <p className="mb-6 text-white/80">
            PHQ-9, GAD-7, CORE-OM inclus dans tous les plans. Gratuit pour toujours.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-white/90"
          >
            Essayer PsyLib 14j gratuit
          </Link>
        </section>

        {/* Nav retour */}
        <div className="mt-10 flex items-center justify-between border-t border-[#3D52A0]/10 pt-8 text-sm">
          <Link href="/" className="text-[#3D52A0] hover:underline">
            ← Accueil
          </Link>
          <Link href="/fonctionnalites/notes-cliniques" className="text-[#3D52A0] hover:underline">
            Templates Notes Cliniques →
          </Link>
        </div>
      </article>
    </>
  );
}

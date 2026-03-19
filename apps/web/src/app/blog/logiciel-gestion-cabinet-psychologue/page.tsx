import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Logiciel gestion cabinet psychologue : comparatif 2026',
  description:
    'Quel logiciel de gestion de cabinet choisir en tant que psychologue libéral ? Comparatif des solutions françaises, critères HDS, agenda, facturation et notes de séance.',
  keywords: [
    'logiciel gestion cabinet psychologue',
    'logiciel psychologue libéral',
    'logiciel cabinet psy France',
    'logiciel agenda psychologue',
    'gestion cabinet psychologie',
    'logiciel HDS psychologue',
    'comparatif logiciel psy',
    'Docorga alternative',
    'Scriboupsy alternative',
  ],
  alternates: {
    canonical: 'https://psylib.eu/blog/logiciel-gestion-cabinet-psychologue',
  },
  openGraph: {
    title: 'Logiciel gestion cabinet psychologue : comparatif 2026',
    description:
      'Comparatif des logiciels de gestion de cabinet pour psychologues libéraux en France. Conformité HDS, notes de séance, facturation, agenda.',
    url: 'https://psylib.eu/blog/logiciel-gestion-cabinet-psychologue',
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
      headline: 'Logiciel gestion cabinet psychologue : comparatif 2026',
      description:
        'Comparatif des logiciels de gestion de cabinet pour psychologues libéraux en France.',
      datePublished: '2026-03-15',
      dateModified: '2026-03-15',
      author: {
        '@type': 'Organization',
        name: 'PsyLib',
        url: 'https://psylib.eu',
      },
      publisher: {
        '@type': 'Organization',
        name: 'PsyLib',
        url: 'https://psylib.eu',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://psylib.eu/blog/logiciel-gestion-cabinet-psychologue',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Un logiciel de gestion de cabinet pour psychologue doit-il être certifié HDS ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Les données de patients en psychologie sont des données de santé au sens de l'article L.1111-8 du Code de la santé publique. Leur hébergement en ligne est obligatoirement soumis à la certification HDS (Hébergeur de Données de Santé). Utiliser un logiciel dont l'hébergement n'est pas certifié HDS expose le praticien à des sanctions de la CNIL pouvant atteindre 20 millions d'euros.",
          },
        },
        {
          '@type': 'Question',
          name: "Quelle est la différence entre Doctolib et un logiciel de gestion de cabinet ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Doctolib est principalement un outil de prise de rendez-vous en ligne et de visibilité. Un logiciel de gestion de cabinet couvre l'ensemble de l'activité clinique et administrative : dossiers patients, notes de séance structurées, facturation, suivi des progrès thérapeutiques et réseau professionnel. Les deux outils sont complémentaires et non substituables.",
          },
        },
        {
          '@type': 'Question',
          name: 'Quel est le coût moyen d\'un logiciel de gestion pour psychologue ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les logiciels spécialisés pour psychologues se situent entre 25 et 200 euros par mois selon les fonctionnalités incluses. Les solutions d'entrée de gamme couvrent l'agenda et la facturation de base. Les solutions complètes intègrent également les notes cliniques structurées, le suivi thérapeutique (PHQ-9, GAD-7), le réseau professionnel et l'assistant IA.",
          },
        },
        {
          '@type': 'Question',
          name: "Existe-t-il un essai gratuit pour tester PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. PsyLib propose 14 jours d'essai gratuit sur le plan Pro, sans carte bancaire requise. Toutes les fonctionnalités sont disponibles pendant la période d'essai.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://psylib.eu/blog' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Logiciel gestion cabinet psychologue',
          item: 'https://psylib.eu/blog/logiciel-gestion-cabinet-psychologue',
        },
      ],
    },
  ],
};

export default function ArticleLogicielGestionCabinet() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Logiciel gestion cabinet psychologue</span>
        </nav>

        {/* En-tête */}
        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Logiciel gestion cabinet psychologue : comparatif 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Agenda, dossiers patients, facturation, conformité HDS — tour d'horizon des critères
            essentiels pour choisir le bon outil en libéral.
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Exercer en libéral, c'est assumer deux rôles simultanément : celui de praticien et
            celui de chef d'entreprise. Entre la tenue des dossiers patients, la rédaction des
            notes de séance, la facturation et la gestion de l'agenda, le temps administratif
            peut rapidement empiéter sur le temps clinique. Un logiciel de gestion de cabinet
            adapté réduit cette charge — à condition de choisir une solution réellement
            pensée pour les psychologues, et non un agenda médical générique.
          </p>
          <p className="mt-4 leading-relaxed">
            En France, le marché compte une dizaine de solutions spécialisées. Leurs
            fonctionnalités, leurs tarifs et leur niveau de conformité aux exigences légales
            (HDS, RGPD) varient considérablement. Ce guide présente les critères de sélection
            indispensables, les points de différenciation clés, et les questions à poser avant
            de s'engager.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Pourquoi un logiciel généraliste ne suffit pas
          </h2>
          <p className="mb-4 leading-relaxed">
            Les outils généralistes de gestion de cabinet — conçus pour l'ensemble des
            professions de santé — ne répondent pas aux besoins spécifiques des psychologues.
            La pratique psychologique implique des notes cliniques longues et structurées,
            un suivi longitudinal des progrès thérapeutiques, des outils d'évaluation
            standardisés (PHQ-9, GAD-7, CORE-OM) et, souvent, une dimension de réseau
            professionnel pour les adressages.
          </p>
          <p className="mb-4 leading-relaxed">
            Un logiciel de gestion de cabinet psychologue doit intégrer nativement ces
            dimensions. Il doit également respecter une contrainte légale non négociable : la
            certification HDS.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La certification HDS : une obligation légale
          </h3>
          <p className="mb-4 leading-relaxed">
            Les données consignées dans les notes de séance d'un psychologue — contenu des
            entretiens, évaluations, hypothèses diagnostiques — sont des données de santé au
            sens de l'article L.1111-8 du Code de la santé publique. Toute solution qui
            stocke ces informations en ligne doit impérativement être hébergée sur une
            infrastructure certifiée HDS (Hébergeur de Données de Santé).
          </p>
          <p className="mb-4 leading-relaxed">
            Utiliser un logiciel non certifié HDS expose le praticien à des sanctions CNIL
            pouvant atteindre 20 millions d'euros ou 4 % du chiffre d'affaires annuel mondial.
            Ce point doit être le premier critère de vérification lors de toute évaluation
            d'outil.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les 6 fonctionnalités essentielles d'un logiciel pour psychologue
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            1. Gestion des dossiers patients
          </h3>
          <p className="mb-4 leading-relaxed">
            Le dossier patient numérique centralise les informations administratives,
            l'historique des séances, les pièces justificatives et les notes cliniques.
            Une bonne solution permet de filtrer, rechercher et archiver les dossiers en
            quelques secondes, avec un chiffrement des données sensibles au niveau applicatif.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2. Notes de séance structurées par orientation
          </h3>
          <p className="mb-4 leading-relaxed">
            La rédaction des notes de séance est le coeur de l'activité clinique quotidienne.
            Un logiciel bien conçu propose des modèles adaptés à chaque orientation
            thérapeutique — TCC, psychodynamique, ACT, systémique — avec des champs
            structurés pour les objectifs de séance, les techniques utilisées, les devoirs
            inter-séances et les points de suivi. Ces modèles réduisent le temps de rédaction
            sans sacrifier la rigueur clinique.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3. Agenda et gestion des rendez-vous
          </h3>
          <p className="mb-4 leading-relaxed">
            L'agenda intégré permet de visualiser les créneaux disponibles, d'enregistrer
            les rendez-vous et d'envoyer des rappels automatiques aux patients. Les solutions
            les plus complètes permettent également de définir des durées de séance par défaut
            et de gérer les annulations avec des délais de prévenance configurables.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            4. Facturation et génération de documents PDF
          </h3>
          <p className="mb-4 leading-relaxed">
            La facturation est une obligation légale pour toute prestation supérieure à 25
            euros. Un logiciel de gestion de cabinet doit générer automatiquement des notes
            d'honoraires conformes aux exigences fiscales françaises — avec le numéro ADELI,
            la mention d'exonération de TVA et le numéro SIRET — et les envoyer directement
            aux patients par email.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5. Suivi des progrès thérapeutiques (outcome tracking)
          </h3>
          <p className="mb-4 leading-relaxed">
            L'outcome tracking — ou mesure des résultats cliniques — consiste à administrer
            régulièrement des questionnaires standardisés (PHQ-9 pour la dépression, GAD-7
            pour l'anxiété, CORE-OM pour le bien-être général) et à visualiser l'évolution
            des scores sous forme de graphiques. Cette approche, recommandée dans le cadre
            du dispositif Mon Soutien Psy, permet d'ajuster la stratégie thérapeutique sur
            des données objectives et de documenter les progrès du patient.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            6. Réseau professionnel et adressages
          </h3>
          <p className="mb-4 leading-relaxed">
            Les adressages entre praticiens — vers un psychiatre, un neuropsychologue ou
            un autre spécialiste — font partie du quotidien clinique. Un logiciel qui
            intègre un réseau professionnel psy-to-psy facilite ces adressages avec des
            courriers sécurisés, une traçabilité complète et la possibilité de contacter
            directement les confrères au sein de la plateforme.
          </p>
        </section>

        {/* Section 3 : Comparatif */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comparatif des principales solutions françaises
          </h2>
          <p className="mb-6 leading-relaxed">
            Le marché français propose plusieurs logiciels dédiés aux psychologues. Voici
            les principales solutions disponibles en 2026, avec leurs caractéristiques
            distinctives.
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F0F9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Logiciel</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Prix indicatif</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Points forts</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Limites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium">Docorga</td>
                  <td className="px-4 py-3">Sur devis</td>
                  <td className="px-4 py-3">Large base utilisateurs (1 500+ psy), dossier patient</td>
                  <td className="px-4 py-3">Pas d'outcome tracking, pas de réseau pro</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Scriboupsy</td>
                  <td className="px-4 py-3">27 €/mois</td>
                  <td className="px-4 py-3">Dédié psychothérapeutes, prix accessible</td>
                  <td className="px-4 py-3">Fonctionnalités limitées, pas d'IA</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Mon Cabinet Libéral</td>
                  <td className="px-4 py-3">Dès 24 €/mois</td>
                  <td className="px-4 py-3">Agenda, facturation, dossiers</td>
                  <td className="px-4 py-3">Généraliste, pas de templates notes par orientation</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">MaGestionPsy</td>
                  <td className="px-4 py-3">Non public</td>
                  <td className="px-4 py-3">Conçu par des psy en libéral</td>
                  <td className="px-4 py-3">Pas d'outcome tracking, interface datée</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#3D52A0]">PsyLib</td>
                  <td className="px-4 py-3 text-[#3D52A0] font-medium">Dès 49 €/mois</td>
                  <td className="px-4 py-3">PHQ-9/GAD-7, templates TCC/ACT/psychodynamique, réseau pro, assistant IA, HDS</td>
                  <td className="px-4 py-3">Solution plus récente — base utilisateurs en croissance</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Données indicatives — mars 2026. Vérifier les tarifs actualisés sur les sites des éditeurs.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les critères différenciants à ne pas négliger
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            L'assistant IA clinique
          </h3>
          <p className="mb-4 leading-relaxed">
            Les logiciels de dernière génération intègrent un assistant IA capable de
            générer un résumé structuré de séance à partir des notes brutes du praticien,
            de suggérer des exercices thérapeutiques personnalisés ou d'aider à la rédaction
            de contenus professionnels. Il est essentiel que ces fonctionnalités respectent
            la confidentialité : les données cliniques ne doivent jamais être transmises à
            des modèles d'IA tiers sans consentement explicite du patient.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            L'espace patient et le portail inter-séances
          </h3>
          <p className="mb-4 leading-relaxed">
            Un portail patient permet au praticien d'assigner des exercices thérapeutiques
            entre les séances, de suivre le suivi de l'humeur quotidienne et d'échanger
            des messages sécurisés. Cette continuité inter-séances améliore l'engagement
            thérapeutique et réduit les abandons de suivi.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La qualité du support et de l'onboarding
          </h3>
          <p className="mb-4 leading-relaxed">
            La prise en main d'un nouveau logiciel représente un investissement en temps.
            Un onboarding guidé en moins de 10 minutes, une documentation claire et un
            support réactif en français sont des critères décisifs pour éviter les
            abandons prématurés et tirer pleinement parti de l'outil.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            PsyLib : une solution pensée pour les psychologues libéraux
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib est un logiciel de gestion de cabinet conçu spécifiquement pour les
            psychologues libéraux en France. Il regroupe dans une interface unique les
            fonctionnalités qui font défaut aux solutions généralistes : notes de séance
            avec modèles par orientation thérapeutique (TCC, psychodynamique, ACT,
            systémique), outcome tracking intégré (PHQ-9, GAD-7, CORE-OM), réseau
            professionnel pour les adressages psy-to-psy, facturation PDF conforme et
            assistant IA clinique.
          </p>
          <p className="mb-4 leading-relaxed">
            L'ensemble de la plateforme est hébergé sur infrastructure certifiée HDS en
            France. Les données cliniques sont chiffrées en AES-256-GCM au niveau
            applicatif. L'assistant IA ne traite jamais les données identifiantes des
            patients sans consentement explicite.
          </p>
          <p className="mb-4 leading-relaxed">
            Les formules disponibles démarrent à 49 euros par mois pour le plan Starter
            (20 patients, 40 séances mensuelles, 10 résumés IA), et s'étendent jusqu'à
            149 euros par mois pour le plan Scale (patients et séances illimités, IA
            illimitée, gestion multi-praticiens). Un essai gratuit de 14 jours sur le
            plan Pro est disponible sans carte bancaire.
          </p>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Testez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Accès complet au plan Pro. Sans carte bancaire. Vos données sont exportables
            à tout moment.
          </p>
          <a
            href="https://psylib.eu/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Essayer PsyLib gratuitement 14 jours
          </a>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Un logiciel de gestion de cabinet pour psychologue doit-il être certifié HDS ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. Les données de patients en psychologie sont des données de santé au sens
                de l'article L.1111-8 du Code de la santé publique. Leur hébergement en ligne
                est obligatoirement soumis à la certification HDS. Un logiciel dont
                l'hébergement n'est pas certifié expose le praticien à des sanctions CNIL
                pouvant atteindre 20 millions d'euros.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Quelle est la différence entre Doctolib et un logiciel de gestion de cabinet ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Doctolib est principalement un outil de prise de rendez-vous en ligne et de
                visibilité. Un logiciel de gestion de cabinet couvre l'ensemble de l'activité
                clinique et administrative : dossiers patients, notes de séance, facturation,
                suivi thérapeutique et réseau professionnel. Les deux outils sont complémentaires.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Quel est le coût moyen d'un logiciel de gestion pour psychologue ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Les solutions spécialisées se situent entre 25 et 200 euros par mois selon les
                fonctionnalités incluses. Les solutions d'entrée de gamme couvrent l'agenda et
                la facturation de base. Les solutions complètes intègrent également les notes
                cliniques structurées, l'outcome tracking (PHQ-9, GAD-7) et l'assistant IA.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Peut-on tester PsyLib sans engagement ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. PsyLib propose 14 jours d'essai gratuit sur le plan Pro, sans carte
                bancaire requise. Toutes les fonctionnalités sont accessibles pendant la
                période d'essai et les données restent exportables à tout moment.
              </p>
            </details>
          </div>
        </section>

        {/* Conclusion */}
        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Article rédigé par l'équipe PsyLib — Mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">
              Retour à l'accueil
            </Link>
            {' '}|{' '}
            <Link href="/blog" className="text-[#3D52A0] hover:underline">
              Tous les articles
            </Link>
          </p>
        </footer>
      </article>
    </>
  );
}

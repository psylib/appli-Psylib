import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Application psychologue libéral : comment choisir le bon outil en 2026',
  description:
    "Sécurité HDS, dossier patient, facturation, notes de séance : découvrez les 5 critères pour choisir la meilleure application psychologue libéral en France.",
  keywords: [
    'application psychologue libéral',
    'application cabinet psy',
    'logiciel psychologue libéral France',
    'application gestion cabinet psychologue',
    'outil numérique psychologue',
    'application HDS psychologue',
    'logiciel notes de séance psy',
    'application facturation psychologue',
    'meilleur logiciel psy libéral 2026',
  ],
  alternates: {
    canonical: 'https://psylib.eu/blog/application-psychologue-liberal',
  },
  openGraph: {
    title: 'Application psychologue libéral : comment choisir le bon outil en 2026',
    description:
      "5 critères pour choisir la meilleure application psychologue libéral : sécurité HDS, dossier patient, facturation, notes de séance, outcome tracking.",
    url: 'https://psylib.eu/blog/application-psychologue-liberal',
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
      headline: 'Application psychologue libéral : comment choisir le bon outil en 2026',
      description:
        "Guide complet pour choisir une application psychologue libéral conforme HDS avec les 5 fonctionnalités indispensables.",
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
        '@id': 'https://psylib.eu/blog/application-psychologue-liberal',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Pourquoi les outils généralistes ne conviennent pas aux psychologues libéraux ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les données traitées par un psychologue libéral sont des données de santé soumises à des obligations légales strictes (HDS, RGPD). Les outils généralistes ne garantissent pas cette conformité. De plus, la pratique psychologique nécessite des fonctionnalités spécifiques absentes des outils généralistes : notes structurées par orientation thérapeutique, outcome tracking, réseau professionnel.",
          },
        },
        {
          '@type': 'Question',
          name: "Quel budget prévoir pour une application psychologue libéral ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les solutions sérieuses se situent entre 30 et 60 euros par mois. Rapporté au nombre de séances, cela représente moins de 2 euros par séance pour une infrastructure conforme HDS. Les offres gratuites comportent souvent des compromis sur la sécurité ou les fonctionnalités.",
          },
        },
        {
          '@type': 'Question',
          name: "La certification HDS est-elle obligatoire pour une application psychologue ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. L'article L.1111-8 du Code de la santé publique impose que toute donnée de santé soit hébergée chez un prestataire certifié HDS. Un psychologue libéral qui stocke des informations sur ses patients dans une application non certifiée s'expose à des sanctions CNIL pouvant atteindre 20 millions d'euros.",
          },
        },
        {
          '@type': 'Question',
          name: "PsyLib propose-t-il un essai gratuit ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. PsyLib propose 14 jours d'essai gratuit sur le plan Pro, sans carte bancaire requise. Toutes les fonctionnalités sont disponibles pendant la période d'essai : dossier patient, agenda, facturation PDF, notes avec templates, outcome tracking.",
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
          name: 'Application psychologue libéral',
          item: 'https://psylib.eu/blog/application-psychologue-liberal',
        },
      ],
    },
  ],
};

export default function ArticleApplicationPsychologue() {
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
          <span className="text-gray-700">Application psychologue libéral</span>
        </nav>

        {/* En-tête */}
        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Application psychologue libéral : comment choisir le bon outil en 2026 ?
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            5 fonctionnalités indispensables et les critères de sécurité non négociables pour
            équiper votre cabinet en conformité avec la loi.
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La transformation numérique des cabinets libéraux a produit une offre pléthorique
            d'outils de gestion. Le psychologue libéral qui cherche à s'équiper se retrouve
            face à des solutions souvent incompatibles, parfois inadaptées à ses obligations
            légales. Ce guide présente les cinq fonctionnalités indispensables et les critères
            de sécurité non négociables.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Pourquoi les outils généralistes ne conviennent pas
          </h2>
          <p className="mb-4 leading-relaxed">
            Les données traitées — coordonnées des patients, motifs de consultation, contenus
            des séances, évaluations cliniques — sont des données de santé au sens juridique.
            Leur traitement obéit à des règles strictes : Code de la santé publique, RGPD,
            recommandations CNIL. Un tableur, une application de notes ou un agenda grand
            public ne garantit pas cette conformité.
          </p>
          <p className="mb-4 leading-relaxed">
            Au-delà de la conformité, la pratique psychologique implique des besoins
            fonctionnels spécifiques absents des outils généralistes : notes structurées
            par orientation thérapeutique, suivi longitudinal des résultats, outils
            d'évaluation standardisés, réseau professionnel pour les adressages entre
            confrères.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les 5 fonctionnalités indispensables
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            1. La gestion sécurisée du dossier patient
          </h3>
          <p className="mb-4 leading-relaxed">
            Le dossier patient numérique doit centraliser toutes les informations : identité,
            antécédents, historique des séances, documents. L'accès doit être protégé par
            authentification forte et les données chiffrées au repos comme en transit.
            Une bonne application permet de filtrer, rechercher et archiver les dossiers
            en quelques secondes, avec chiffrement applicatif des champs sensibles.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2. L'agenda avec prise de rendez-vous en ligne
          </h3>
          <p className="mb-4 leading-relaxed">
            L'agenda intégré doit permettre la gestion du planning et offrir une interface
            de réservation en ligne. Les rappels automatiques par e-mail réduisent les
            no-shows de 30 à 50 %. Un agenda intégré à la plateforme évite les frictions
            de saisie entre outils séparés.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3. La facturation et le suivi comptable
          </h3>
          <p className="mb-4 leading-relaxed">
            La génération automatique de factures conformes — mentions obligatoires,
            numérotation séquentielle, TVA exonérée, numéro ADELI — est un gain de temps
            significatif. L'envoi direct au patient et le suivi des paiements (brouillon,
            envoyée, payée) sont essentiels pour la gestion financière du cabinet.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            4. Les notes de séance et templates cliniques
          </h3>
          <p className="mb-4 leading-relaxed">
            Une application adaptée propose des modèles structurés par orientation
            thérapeutique (TCC, psychodynamique, ACT, systémique). Ces templates réduisent
            le temps de rédaction sans sacrifier la rigueur clinique. Le stockage des notes
            doit être séparé des informations administratives avec des règles d'accès
            renforcées et chiffrement AES-256-GCM au niveau applicatif.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5. L'outcome tracking et le suivi des progrès
          </h3>
          <p className="mb-4 leading-relaxed">
            L'administration numérique de questionnaires validés (PHQ-9, GAD-7, CORE-OM)
            à intervalles réguliers permet de visualiser l'évolution du patient sous forme
            de graphiques. C'est la fonctionnalité qui transforme une impression clinique
            en donnée objective, et qui réduit de 65 % le risque de détérioration non
            détectée selon les méta-analyses.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            La sécurité des données : priorité absolue
          </h2>
          <p className="mb-4 leading-relaxed">
            L'article L.1111-8 du Code de la santé publique impose que toute donnée de santé
            soit hébergée chez un prestataire certifié HDS. Vérifiez que l'éditeur mentionne
            explicitement son hébergement HDS, que les serveurs sont en France ou dans l'UE,
            et que le contrat de sous-traitance RGPD est disponible sur demande.
          </p>

          <div className="rounded-xl border border-[#3D52A0]/20 bg-[#F1F0F9] p-5 my-6">
            <p className="font-semibold text-[#1E1B4B] mb-3">Checklist sécurité à vérifier</p>
            <ul className="space-y-2 text-gray-700">
              {[
                "Certification HDS explicitement mentionnée sur le site de l'éditeur",
                "Serveurs en France ou dans l'UE",
                "Contrat de sous-traitance RGPD disponible",
                "Chiffrement des données au repos et en transit",
                "Authentification forte (MFA) disponible",
                "Politique de conservation et d'effacement des données",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#3D52A0] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Quel budget prévoir ?
          </h2>
          <p className="mb-4 leading-relaxed">
            Les solutions sérieuses se situent entre 30 et 60 euros par mois. Rapporté au
            nombre de séances d'un cabinet en activité normale (80 à 100 séances par mois),
            cela représente moins de 2 euros par séance pour une infrastructure conforme.
          </p>
          <p className="mb-4 leading-relaxed">
            Les offres gratuites comportent souvent des compromis sur la sécurité des données,
            les fonctionnalités cliniques ou la conformité légale. Le coût d'une mise en
            conformité après incident CNIL dépasse largement celui d'un abonnement à une
            solution adaptée.
          </p>
        </section>

        {/* Section 5 : PsyLib */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            PsyLib : l'application conçue pour les psychologues libéraux
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre les cinq fonctionnalités : dossier patient sécurisé, agenda avec
            réservation en ligne, facturation PDF conforme, notes avec templates par
            orientation clinique (TCC, psychodynamique, ACT, systémique), outcome tracking
            (PHQ-9, GAD-7, CORE-OM).
          </p>
          <p className="mb-4 leading-relaxed">
            Hébergement France certifié HDS. Authentification OIDC sécurisée. Chiffrement
            AES-256-GCM des données sensibles au niveau applicatif. Essai gratuit 14 jours
            sans carte bancaire.
          </p>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Testez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Accès complet au plan Pro. Infrastructure HDS. Sans carte bancaire.
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
                Pourquoi les outils généralistes ne conviennent pas aux psychologues libéraux ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Les données traitées par un psychologue libéral sont des données de santé
                soumises à des obligations légales strictes (HDS, RGPD). Les outils généralistes
                ne garantissent pas cette conformité et manquent des fonctionnalités spécifiques
                : notes structurées par orientation, outcome tracking, réseau professionnel.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Quel budget prévoir pour une application psychologue libéral ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Les solutions sérieuses se situent entre 30 et 60 euros par mois, soit moins
                de 2 euros par séance pour une infrastructure conforme HDS. Les offres gratuites
                comportent souvent des compromis sur la sécurité ou les fonctionnalités.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                La certification HDS est-elle obligatoire ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. L'article L.1111-8 du Code de la santé publique impose que toute donnée
                de santé soit hébergée chez un prestataire certifié HDS. Un psychologue qui
                utilise une application non certifiée s'expose à des sanctions CNIL pouvant
                atteindre 20 millions d'euros.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                PsyLib propose-t-il un essai gratuit ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. PsyLib propose 14 jours d'essai gratuit sur le plan Pro, sans carte
                bancaire requise. Toutes les fonctionnalités sont disponibles : dossier patient,
                agenda, facturation PDF, notes avec templates, outcome tracking.
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

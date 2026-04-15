import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Agenda psychologue logiciel : choisir le meilleur outil en 2026 | PsyLib',
  description:
    'Rappels SMS, synchro Google Calendar, gestion des annulations, confidentialité HDS — critères pour choisir le meilleur agenda pour psychologue libéral. Comparatif et fonctionnalités PsyLib.',
  keywords: [
    'agenda psychologue logiciel',
    'calendrier psy en ligne',
    'gestion rendez-vous psychologue',
    'logiciel agenda cabinet psy',
    'rappel SMS psychologue',
    'agenda psychologue en ligne',
    'prise de rendez-vous psychologue',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/agenda-psychologue-logiciel' },
  openGraph: {
    title: 'Agenda psychologue logiciel : choisir le meilleur outil en 2026',
    description:
      'Rappels SMS, synchro Google, gestion des annulations, conformité HDS — tout ce qu\'il faut savoir pour choisir et configurer son agenda de cabinet psy.',
    url: 'https://psylib.eu/guides/agenda-psychologue-logiciel',
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
      headline: 'Agenda psychologue logiciel : choisir le meilleur outil en 2026',
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
          name: "Un agenda de psychologue doit-il être conforme HDS ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Si l'agenda contient des noms de patients associés à des créneaux de rendez-vous, il traite des données de santé indirectes. L'hébergeur doit être certifié HDS. Utiliser Google Calendar pour ses rendez-vous patients expose le praticien à un risque légal significatif.",
          },
        },
        {
          '@type': 'Question',
          name: "Quels sont les avantages des rappels SMS automatiques pour un cabinet de psy ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les rappels SMS envoyés 24 à 48 heures avant un rendez-vous réduisent les no-shows (absences non signalées) de 30 à 50 % selon les études. Pour un psychologue avec un taux de no-show de 10 %, cela peut représenter 3 à 5 séances récupérées par mois.",
          },
        },
        {
          '@type': 'Question',
          name: "Puis-je utiliser Google Calendar pour gérer mes rendez-vous patients ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Google Calendar n'est pas certifié HDS et ses serveurs sont localisés hors de France. Son utilisation pour des données patients expose le praticien au risque de non-conformité RGPD et HDS. Il est recommandé d'utiliser un agenda intégré dans un logiciel certifié HDS comme PsyLib, ou a minima d'utiliser des codes anonymisés sans données identifiantes.",
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
          name: 'Agenda psychologue logiciel',
          item: 'https://psylib.eu/guides/agenda-psychologue-logiciel',
        },
      ],
    },
  ],
};

export default function PageAgendaPsychologue() {
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
          <span className="text-gray-700">Agenda psychologue logiciel</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Agenda psychologue : choisir le bon logiciel en 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Rappels automatiques, gestion des annulations, confidentialité HDS — le guide complet
            pour choisir et configurer l&apos;agenda de votre cabinet.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La gestion de l&apos;agenda est l&apos;une des tâches les plus chronophages pour un
            psychologue libéral : confirmations de rendez-vous, gestion des annulations de
            dernière minute, relances en cas de no-show, gestion des créneaux libérés. Un agenda
            numérique adapté à la pratique psychologique peut réduire cette charge de plusieurs
            heures par semaine — à condition de répondre à des critères précis de fonctionnalité
            et de conformité légale.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Pourquoi l&apos;agenda est au cœur de votre activité
          </h2>
          <p className="mb-4 leading-relaxed">
            Un psychologue libéral à temps plein gère entre 20 et 28 rendez-vous par semaine.
            Sur une année, cela représente environ 1 000 à 1 300 séances, soit autant
            d&apos;interactions de planning à gérer. Sans outil numérique adapté, la gestion
            manuelle de cet agenda (agenda papier, feuille de calcul, SMS manuels) génère
            des erreurs, des doubles réservations et des no-shows non détectés.
          </p>
          <p className="mb-4 leading-relaxed">
            Le no-show — l&apos;absence d&apos;un patient sans prévenir — est l&apos;une des
            principales pertes financières pour un cabinet libéral. Avec un tarif moyen de
            80 euros et un taux de no-show de 10 %, un praticien à plein temps perd environ
            100 séances par an, soit 8 000 euros de revenus non encaissés. Les rappels
            automatiques réduisent ce taux de 30 à 50 %.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les 6 critères essentiels pour choisir son agenda
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            1. La conformité HDS et RGPD
          </h3>
          <p className="mb-4 leading-relaxed">
            C&apos;est le critère non négociable. Un agenda de psychologue qui associe des noms
            de patients à des créneaux horaires traite des données à caractère personnel sensibles.
            L&apos;hébergeur doit être certifié HDS (Hébergeur de Données de Santé). Utiliser
            Google Calendar, Calendly ou un outil non conforme expose le praticien à des
            sanctions CNIL.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2. Les rappels automatiques par email et SMS
          </h3>
          <p className="mb-4 leading-relaxed">
            Les rappels envoyés 24 à 48 heures avant la séance réduisent significativement les
            no-shows. Un bon logiciel permet de configurer le délai de rappel, le message
            envoyé et le canal (email, SMS ou les deux). Certains outils permettent également
            un rappel de confirmation par clic (le patient confirme sa présence en un clic
            depuis son email ou SMS).
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3. La gestion des annulations et des créneaux libérés
          </h3>
          <p className="mb-4 leading-relaxed">
            Quand un patient annule, le créneau se libère. Un agenda intelligent peut notifier
            le praticien instantanément et, optionnellement, proposer le créneau à d&apos;autres
            patients sur liste d&apos;attente. La configuration de délais de prévenance
            (ex. : annulation sans frais si prévenez 48h à l&apos;avance) est également un
            point à vérifier.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            4. La vue hebdomadaire et mensuelle
          </h3>
          <p className="mb-4 leading-relaxed">
            L&apos;interface doit permettre de visualiser rapidement les créneaux disponibles
            et occupés sur la semaine et sur le mois. La possibilité de définir des plages
            horaires récurrentes (ex. : mardi 9h-12h et 14h-19h) évite de ressaisir les
            disponibilités chaque semaine.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5. L&apos;intégration avec les autres modules du logiciel
          </h3>
          <p className="mb-4 leading-relaxed">
            Un agenda qui fonctionne en silo oblige à ressaisir les informations dans plusieurs
            outils. L&apos;idéal est un agenda intégré directement dans le logiciel de gestion
            du cabinet, lié au dossier patient. En un clic depuis l&apos;agenda, le praticien
            accède au dossier du patient, peut créer une note de séance, et générer la facture
            correspondante.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            6. L&apos;accès mobile et la synchronisation
          </h3>
          <p className="mb-4 leading-relaxed">
            Un agenda accessible depuis smartphone est indispensable pour les praticiens qui
            exercent dans plusieurs lieux. La synchronisation avec Google Calendar (en sens
            unique, des données anonymisées vers Google) peut être envisagée, mais les données
            identifiantes des patients ne doivent jamais quitter l&apos;hébergement HDS.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Google Calendar : pratique mais non conforme pour les données patients
          </h2>
          <p className="mb-4 leading-relaxed">
            Beaucoup de psychologues libéraux utilisent Google Calendar pour gérer leurs
            rendez-vous, faute de connaître les alternatives. C&apos;est compréhensible :
            Google Calendar est gratuit, intuitif et disponible sur tous les appareils.
            Mais son utilisation avec des données identifiantes patients pose un problème
            légal sérieux.
          </p>
          <p className="mb-4 leading-relaxed">
            Google LLC n&apos;est pas certifié HDS en France. Ses serveurs sont localisés aux
            États-Unis, soumis au Cloud Act américain qui autorise les autorités américaines
            à accéder aux données. Stocker le nom d&apos;un patient associé à un créneau de
            consultation dans Google Calendar constitue un transfert de données de santé vers
            un pays tiers non conforme au RGPD.
          </p>
          <p className="mb-4 leading-relaxed">
            La solution de contournement pratiquée par certains praticiens — n&apos;utiliser
            que les initiales ou un code dans Google Calendar — est acceptable si le lien entre
            le code et l&apos;identité du patient n&apos;est stocké que dans un outil conforme
            HDS. Mais cette approche manuelle est source d&apos;erreurs et n&apos;est pas
            recommandée pour un cabinet en développement.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            L&apos;agenda intégré de PsyLib
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre un agenda directement dans la plateforme, lié aux dossiers patients
            et au module de facturation. Le calendrier affiche en un coup d&apos;œil les séances
            planifiées, les créneaux disponibles et les rendez-vous à confirmer. Depuis chaque
            rendez-vous, le praticien peut accéder au dossier du patient, ouvrir une note de
            séance ou générer la facture.
          </p>
          <p className="mb-4 leading-relaxed">
            Les rappels automatiques sont configurables : délai, message, canal (email).
            En cas d&apos;annulation, le créneau est libéré et le praticien est notifié
            instantanément. La plateforme étant intégralement hébergée sur infrastructure
            certifiée HDS, toutes les données de l&apos;agenda sont conformes aux exigences
            légales.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Agenda intégré, rappels automatiques, dossiers patients, facturation — tout en un,
            conforme HDS. Sans carte bancaire.
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
                q: "Un agenda de psychologue doit-il être conforme HDS ?",
                a: "Oui. Si l'agenda contient des noms de patients associés à des créneaux, il traite des données de santé. L'hébergeur doit être certifié HDS. Google Calendar ou Calendly ne sont pas conformes pour cet usage.",
              },
              {
                q: "Quels sont les avantages des rappels SMS automatiques ?",
                a: "Les rappels envoyés 24 à 48 heures avant le rendez-vous réduisent les no-shows de 30 à 50 %. Pour un cabinet à plein temps avec 10 % de no-shows, cela peut représenter 3 à 5 séances récupérées par mois, soit entre 240 et 400 euros mensuels.",
              },
              {
                q: "Puis-je utiliser Google Calendar pour mes rendez-vous patients ?",
                a: "Pas avec des données identifiantes. Google Calendar n'est pas certifié HDS. Son utilisation avec noms de patients expose à un risque RGPD. L'utilisation de codes anonymisés (sans lien identifiant dans Google Calendar) est une alternative acceptable mais peu pratique.",
              },
              {
                q: "L'agenda de PsyLib est-il intégré aux dossiers patients ?",
                a: "Oui. L'agenda PsyLib est directement connecté aux dossiers patients. En un clic depuis un créneau de l'agenda, vous accédez au dossier complet du patient, vous pouvez créer une note de séance et générer la facture correspondante.",
              },
              {
                q: "Comment gérer les annulations de dernière minute dans un agenda psy ?",
                a: "Un bon logiciel notifie instantanément le praticien en cas d'annulation et libère automatiquement le créneau. PsyLib envoie une notification en temps réel lors de chaque annulation, permettant de proposer le créneau à un autre patient si nécessaire.",
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

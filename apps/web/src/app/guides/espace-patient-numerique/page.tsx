import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Espace patient numérique pour psychologue : portail sécurisé inter-séances | PsyLib',
  description:
    'Suivi de l\'humeur, exercices, journal, messagerie sécurisée — ce que peut faire le patient entre les séances. Sécurité HDS et PsyLib espace patient intégré pour psychologues libéraux.',
  keywords: [
    'espace patient psychologue en ligne',
    'portail patient psy',
    'application patient psychologue',
    'suivi humeur psychologue',
    'exercices thérapeutiques patient',
    'messagerie sécurisée psy patient',
    'espace patient numérique HDS',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/espace-patient-numerique' },
  openGraph: {
    title: 'Espace patient numérique pour psychologue : portail sécurisé inter-séances',
    description:
      'Suivi de l\'humeur, exercices thérapeutiques, journal, messagerie HDS — l\'espace patient numérique de PsyLib pour renforcer l\'engagement thérapeutique inter-séances.',
    url: 'https://psylib.eu/guides/espace-patient-numerique',
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
      headline: 'Espace patient numérique pour psychologue : portail sécurisé inter-séances',
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
          name: "Un espace patient numérique améliore-t-il les résultats thérapeutiques ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. La littérature scientifique montre que la continuité thérapeutique inter-séances — via des exercices, le suivi de l'humeur et la journalisation — améliore significativement les résultats des thérapies cognitivo-comportementales et humanistes. Les patients qui s'engagent activement entre les séances présentent généralement des progrès plus rapides.",
          },
        },
        {
          '@type': 'Question',
          name: "L'espace patient de PsyLib est-il conforme HDS ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. L'ensemble de la plateforme PsyLib, incluant l'espace patient, est hébergé sur infrastructure certifiée HDS en France. Les données du patient (humeur, journal, messages) sont chiffrées en AES-256-GCM au niveau applicatif. La messagerie entre le praticien et le patient est sécurisée et ne transite jamais par des serveurs non conformes.",
          },
        },
        {
          '@type': 'Question',
          name: "Le psychologue peut-il voir le journal privé du patient ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Non, si le patient marque ses entrées comme privées. PsyLib permet au patient de désigner certaines entrées de journal comme non visibles par le praticien. Cette option renforce la confiance et l'authenticité de l'expression du patient dans son journal.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment inviter un patient à utiliser l'espace patient PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Depuis le dossier du patient dans PsyLib, le praticien envoie une invitation par email en un clic. Le patient crée son compte sécurisé, accède à son espace personnel et peut commencer à utiliser les fonctionnalités immédiatement.",
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
          name: 'Espace patient numérique',
          item: 'https://psylib.eu/guides/espace-patient-numerique',
        },
      ],
    },
  ],
};

export default function PageEspacePatient() {
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
          <span className="text-gray-700">Espace patient numérique</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Espace patient numérique : le portail sécurisé pour les psychologues libéraux
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Suivi de l&apos;humeur, exercices thérapeutiques, journal, messagerie sécurisée —
            ce que peut faire un patient entre les séances et comment cela améliore les
            résultats thérapeutiques.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La thérapie ne se passe pas uniquement pendant la séance. Ce qui se joue entre
            les consultations — les exercices réalisés, les émotions traversées, les prises de
            conscience notées dans un journal — est souvent aussi déterminant que le travail
            en présence du thérapeute. Un espace patient numérique sécurisé permet de soutenir
            cette continuité thérapeutique inter-séances, en donnant au patient des outils
            adaptés et en permettant au praticien d&apos;accéder aux données pertinentes avant
            la séance suivante.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Pourquoi un espace patient inter-séances ?
          </h2>
          <p className="mb-4 leading-relaxed">
            Les thérapies comportementales, en particulier, reposent fortement sur la pratique
            inter-séances : devoirs à réaliser, exercices d&apos;exposition, grilles de pensées
            à compléter. Sans outil structuré, les patients reviennent souvent sans avoir
            réalisé leurs exercices — non par manque de motivation, mais par manque de rappels,
            de structure et d&apos;accessibilité.
          </p>
          <p className="mb-4 leading-relaxed">
            Un espace patient numérique bien conçu augmente le taux de complétion des devoirs
            inter-séances, réduit le taux d&apos;abandon des suivis et améliore
            l&apos;engagement thérapeutique. La littérature scientifique sur les thérapies
            augmentées par la technologie (blended therapy) montre des résultats équivalents
            ou supérieurs aux thérapies classiques pour certains troubles (anxiété, dépression
            légère, insomnie).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Fonctionnalités d&apos;un espace patient complet
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            1. Le suivi de l&apos;humeur quotidien
          </h3>
          <p className="mb-4 leading-relaxed">
            Le suivi de l&apos;humeur est l&apos;une des fonctionnalités les plus utiles et
            les plus simples à utiliser pour le patient. Chaque soir (ou matin), il note
            son niveau d&apos;humeur sur une échelle de 1 à 10, avec une note optionnelle.
            Sur plusieurs semaines, ce journal de l&apos;humeur révèle des patterns importants :
            jours difficiles récurrents, impact des événements de vie, corrélation avec les
            exercices réalisés. Le praticien consulte ce graphique avant la séance suivante
            et peut l&apos;utiliser comme point de départ de la consultation.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2. Les exercices thérapeutiques assignés
          </h3>
          <p className="mb-4 leading-relaxed">
            Depuis le dossier patient, le praticien peut assigner des exercices directement
            au patient : respiration abdominale, grille de pensées, exposition graduée,
            activation comportementale, relaxation progressive, etc. Le patient reçoit
            une notification, consulte les instructions depuis son espace, réalise
            l&apos;exercice et peut laisser un feedback. Le praticien accède à l&apos;état
            de complétion de chaque exercice avant la séance suivante.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3. Le journal personnel
          </h3>
          <p className="mb-4 leading-relaxed">
            Un journal structuré permet au patient d&apos;exprimer librement ses pensées,
            émotions et observations entre les séances. Contrairement à un carnet papier,
            le journal numérique est toujours disponible (smartphone), chiffré et peut être
            partagé sélectivement avec le thérapeute. Certaines entrées peuvent être
            marquées comme privées — visibles uniquement par le patient.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            4. La messagerie sécurisée
          </h3>
          <p className="mb-4 leading-relaxed">
            La messagerie entre le praticien et le patient doit impérativement être sécurisée
            et conforme HDS. Utiliser WhatsApp ou Gmail pour échanger avec un patient sur des
            sujets cliniques est une violation du RGPD. Une messagerie intégrée dans un espace
            patient certifié HDS permet des échanges sécurisés, chiffrés, avec une traçabilité
            complète. Des règles de disponibilité peuvent être définies (pas de réponse le
            week-end, délai de réponse de 48h maximum).
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5. Les questionnaires standardisés
          </h3>
          <p className="mb-4 leading-relaxed">
            Le praticien peut envoyer des questionnaires standardisés directement dans
            l&apos;espace patient : PHQ-9 avant chaque séance, GAD-7 toutes les 4 séances.
            Le patient les remplit depuis son smartphone, et les scores sont automatiquement
            intégrés dans le dossier et dans les graphiques de suivi.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Sécurité et confidentialité de l&apos;espace patient
          </h2>
          <p className="mb-4 leading-relaxed">
            Les données générées par le patient dans son espace personnel sont des données de
            santé au sens du RGPD. Elles doivent être hébergées sur infrastructure certifiée
            HDS, chiffrées au repos et en transit, et accessibles uniquement au patient et
            à son thérapeute désigné.
          </p>
          <p className="mb-4 leading-relaxed">
            PsyLib assure ces garanties : l&apos;ensemble des données (humeur, journal,
            exercices, messages) est chiffré en AES-256-GCM au niveau applicatif, hébergé
            sur infrastructure certifiée HDS en France. Le patient accède à son espace via
            un identifiant unique sécurisé. Le praticien ne peut accéder qu&apos;aux données
            de ses propres patients — l&apos;isolation multi-tenant est garantie au niveau
            applicatif et base de données.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Espace patient complet (humeur, exercices, journal, messagerie), certifié HDS.
            Sans carte bancaire.
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
                q: "Un espace patient numérique améliore-t-il les résultats thérapeutiques ?",
                a: "Oui. La continuité inter-séances (exercices, suivi de l'humeur, journalisation) améliore les résultats des thérapies TCC et humanistes. Les patients actifs entre les séances progressent généralement plus vite.",
              },
              {
                q: "L'espace patient de PsyLib est-il conforme HDS ?",
                a: "Oui. Toute la plateforme PsyLib est hébergée sur infrastructure certifiée HDS en France. Les données du patient sont chiffrées en AES-256-GCM. La messagerie psy-patient est sécurisée et conforme.",
              },
              {
                q: "Le psychologue peut-il voir le journal privé du patient ?",
                a: "Non. Le patient peut marquer des entrées comme privées, visibles uniquement par lui. Seules les entrées partagées sont visibles par le praticien.",
              },
              {
                q: "Comment inviter un patient à utiliser l'espace patient PsyLib ?",
                a: "Depuis le dossier patient, envoyez une invitation par email en un clic. Le patient crée son compte sécurisé et accède immédiatement à son espace.",
              },
              {
                q: "Peut-on utiliser l'espace patient pour les questionnaires standardisés ?",
                a: "Oui. PsyLib permet d'envoyer directement PHQ-9, GAD-7 et CORE-OM dans l'espace patient. Le patient les remplit depuis son smartphone et les scores sont automatiquement intégrés dans le dossier.",
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

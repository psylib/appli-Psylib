import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadMagnetCTA } from '@/components/lead-magnet-cta';

export const metadata: Metadata = {
  title: 'Notes de séance structurées : formats SOAP, DAP et modèles pour psys | PsyLib',
  description:
    'Importance des notes structurées, formats SOAP, DAP, narratif — modèles pratiques pour psychologues libéraux. PsyLib propose des templates par orientation thérapeutique.',
  keywords: [
    'notes séance psychologue structurées',
    'modèle note clinique psy',
    'rédiger compte-rendu séance',
    'format SOAP psychologue',
    'format DAP psy',
    'template notes psychologue',
    'notes cliniques psychologue libéral',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/notes-seance-structurees' },
  openGraph: {
    title: 'Notes de séance structurées : formats SOAP, DAP et modèles pour psys',
    description:
      'Formats SOAP, DAP, narratif — modèles pratiques et templates par orientation thérapeutique pour réduire le temps de rédaction des notes cliniques.',
    url: 'https://psylib.eu/guides/notes-seance-structurees',
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
      headline: 'Notes de séance structurées : formats SOAP, DAP et modèles pour psys',
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
          name: "Quelle est la différence entre le format SOAP et le format DAP pour les notes de séance ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "SOAP (Subjectif, Objectif, Analyse, Plan) est un format médical adapté à la psychologie. DAP (Données, Analyse, Plan) est une simplification plus adaptée aux séances de psychothérapie. SOAP documente plus finement la symptomatologie, DAP se concentre davantage sur le processus thérapeutique. Les deux formats sont valides selon les préférences du praticien.",
          },
        },
        {
          '@type': 'Question',
          name: "Combien de temps faut-il pour rédiger une note de séance ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Avec un template adapté, une note de séance structurée se rédige en 5 à 10 minutes. Sans structure, les praticiens passent souvent 15 à 30 minutes par note, soit jusqu'à 10 heures par semaine pour un cabinet plein. Les templates PsyLib permettent de diviser ce temps par deux à trois.",
          },
        },
        {
          '@type': 'Question',
          name: "Les notes de séance sont-elles accessibles par le patient ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "En vertu du RGPD, le patient peut demander l'accès à ses données personnelles, qui incluent les notes de séance. En pratique, le praticien peut distinguer les notes cliniques (destinées au professionnel) des comptes rendus partagés (destinés au patient ou à d'autres professionnels). PsyLib permet de gérer ce niveau de confidentialité dans chaque note.",
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
          name: 'Notes de séance structurées',
          item: 'https://psylib.eu/guides/notes-seance-structurees',
        },
      ],
    },
  ],
};

export default function PageNotesSeance() {
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
          <span className="text-gray-700">Notes de séance structurées</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Notes de séance structurées : formats SOAP, DAP et modèles pratiques
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Pourquoi structurer ses notes cliniques, quels formats choisir selon son
            orientation, et comment les templates PsyLib réduisent le temps de rédaction
            sans sacrifier la qualité.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La rédaction des notes de séance est l&apos;une des activités les plus chronophages
            du quotidien d&apos;un psychologue libéral. Un praticien qui reçoit 25 patients par
            semaine peut passer entre 5 et 10 heures par semaine à rédiger des notes — soit
            20 à 40 % de son temps de travail administratif. Pourtant, des notes bien structurées
            sont indispensables à la continuité des soins, à la protection juridique du praticien
            et à la qualité de la supervision.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Pourquoi structurer ses notes cliniques ?
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            1. La continuité des soins
          </h3>
          <p className="mb-4 leading-relaxed">
            Des notes structurées permettent de reprendre rapidement le fil d&apos;un suivi
            après une interruption (vacances, maladie), de partager des informations pertinentes
            avec un confrère en cas de remplacement, et de retrouver en quelques secondes le
            contexte d&apos;une séance vécue plusieurs mois auparavant. Sans notes structurées,
            le praticien dépend de sa seule mémoire — une ressource faillible sur des suivis
            longs.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2. La protection déontologique et juridique
          </h3>
          <p className="mb-4 leading-relaxed">
            En cas de plainte déontologique ou de procédure judiciaire, les notes de séance
            constituent la principale preuve de la qualité et de la conformité des soins
            prodigués. Des notes structurées, datées et conservées sur une plateforme
            certifiée HDS offrent une protection significativement plus forte qu&apos;un
            carnet manuscrit ou des fichiers Word non sécurisés.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3. La qualité de la supervision
          </h3>
          <p className="mb-4 leading-relaxed">
            Les notes structurées facilitent considérablement la préparation des séances de
            supervision. Au lieu de reconstituer de mémoire la dynamique d&apos;un suivi,
            le praticien peut appuyer sa présentation sur un récit factuel et organisé. La
            supervision gagne en profondeur quand les éléments cliniques sont clairement
            documentés.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les principaux formats de notes de séance
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le format SOAP
          </h3>
          <p className="mb-4 leading-relaxed">
            SOAP est l&apos;acronyme de : Subjectif — Objectif — Analyse — Plan.
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li><strong>S (Subjectif)</strong> : ce que le patient rapporte (plaintes, vécu, changements notés)</li>
            <li><strong>O (Objectif)</strong> : observations cliniques du praticien (humeur apparente, comportement en séance, scores aux questionnaires)</li>
            <li><strong>A (Analyse)</strong> : interprétation clinique, hypothèses, liens avec le cadre théorique</li>
            <li><strong>P (Plan)</strong> : prochaines étapes, devoirs, ajustements thérapeutiques</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Le format SOAP est particulièrement adapté aux praticiens travaillant dans des
            contextes multi-disciplinaires (hôpital, CMPP) où la note doit être lisible par
            d&apos;autres professionnels de santé.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le format DAP
          </h3>
          <p className="mb-4 leading-relaxed">
            DAP : Données — Analyse — Plan. C&apos;est une version simplifiée de SOAP, mieux
            adaptée à la psychothérapie individuelle en cabinet libéral.
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li><strong>D (Données)</strong> : faits cliniques de la séance, verbatim importants, score d&apos;humeur</li>
            <li><strong>A (Analyse)</strong> : interprétation, hypothèses, connexions avec les séances précédentes</li>
            <li><strong>P (Plan)</strong> : interventions prévues, devoirs assignés, points de vigilance</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le format narratif structuré
          </h3>
          <p className="mb-4 leading-relaxed">
            Certains praticiens, notamment d&apos;orientation psychodynamique ou humaniste,
            préfèrent un format narratif avec des sections libres mais ordonnées : présentation
            du patient en début de séance, thèmes abordés, mouvements transférentiels et
            contre-transférentiels notés, hypothèses dynamiques, orientation pour la suite.
            Ce format offre plus de liberté mais demande une discipline rédactionnelle plus
            rigoureuse pour rester concis.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le format TCC structuré
          </h3>
          <p className="mb-4 leading-relaxed">
            Spécifique à la pratique TCC, ce format suit la structure de séance TCC :
            humeur initiale, revue des devoirs, agenda, travail clinique (avec technique
            utilisée), nouvelles perspectives dégagées, devoirs, niveau de distress final.
            C&apos;est le format le plus prescriptif, mais aussi celui qui se rédige le plus
            rapidement avec un bon template.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les templates PsyLib par orientation thérapeutique
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib propose des templates de notes préconfigurés pour les principales orientations
            thérapeutiques pratiquées en France : TCC/ACT, psychodynamique, systémique, humaniste,
            et bilan neuropsychologique. Chaque template intègre les sections spécifiques à
            l&apos;approche, avec des champs structurés et des listes déroulantes pour les
            techniques utilisées.
          </p>
          <p className="mb-4 leading-relaxed">
            L&apos;autosave automatique (toutes les 30 secondes) garantit qu&apos;aucune note
            ne soit perdue en cas de coupure réseau ou de fermeture accidentelle du navigateur.
            La rédaction en ligne peut être complétée par l&apos;assistant IA de PsyLib, qui
            génère un résumé structuré à partir de notes brutes — en un clic, de manière opt-in.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Templates SOAP, DAP, TCC, ACT, psychodynamique — autosave, assistant IA, conformité HDS.
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
                q: "Quelle est la différence entre SOAP et DAP pour les notes de séance ?",
                a: "SOAP (Subjectif, Objectif, Analyse, Plan) est plus détaillé et adapté aux contextes multi-disciplinaires. DAP (Données, Analyse, Plan) est plus concis et adapté à la psychothérapie individuelle en cabinet libéral. Les deux sont valides.",
              },
              {
                q: "Combien de temps faut-il pour rédiger une note de séance structurée ?",
                a: "Avec un bon template, 5 à 10 minutes. Sans structure, 15 à 30 minutes. Pour 25 patients par semaine, c'est entre 2h30 et 12h30 par semaine. Les templates PsyLib divisent ce temps par deux à trois.",
              },
              {
                q: "Les notes de séance sont-elles accessibles par le patient ?",
                a: "Le RGPD donne accès aux données personnelles. En pratique, le praticien peut distinguer les notes cliniques internes des comptes rendus partagés. PsyLib permet de gérer ce niveau de confidentialité dans chaque note.",
              },
              {
                q: "PsyLib propose-t-il des templates pour différentes orientations thérapeutiques ?",
                a: "Oui. PsyLib propose des templates pour la TCC/ACT, la psychodynamique, la systémique, l'humaniste et le bilan neuropsychologique. Chaque template peut être personnalisé par le praticien.",
              },
              {
                q: "Comment l'IA de PsyLib aide-t-elle pour les notes de séance ?",
                a: "L'assistant IA de PsyLib génère un résumé structuré à partir de notes brutes. Il s'active uniquement sur demande explicite du praticien (opt-in). Les notes ne quittent jamais le serveur sans consentement, et les données identifiantes ne sont jamais transmises à des LLM tiers.",
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
          slug="templates-notes-tcc"
          title="Templates notes cliniques TCC (PDF gratuit)"
          description="Recevez 6 templates de notes cliniques prets a l'emploi : SOAP, pensees automatiques, tableau ABC, analyse SECCA."
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

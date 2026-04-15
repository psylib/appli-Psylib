import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Thérapie EMDR : guide complet pour psychologues et patients 2026 | PsyLib',
  description:
    'L\'EMDR (Eye Movement Desensitization and Reprocessing) est une thérapie validée scientifiquement pour les traumatismes. Guide complet : protocole, indications, formation et prise en charge.',
  keywords: [
    'EMDR thérapie',
    'thérapie EMDR psychologue',
    'EMDR trauma',
    'EMDR psychothérapie',
    'formation EMDR France',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/therapie-emdr-psychologue' },
  openGraph: {
    title: 'Thérapie EMDR : guide complet pour psychologues et patients 2026',
    description: 'Protocole, indications cliniques, formation et intégration de l\'EMDR dans la pratique libérale.',
    url: 'https://psylib.eu/guides/therapie-emdr-psychologue',
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
      headline: 'Thérapie EMDR : guide complet pour psychologues et patients 2026',
      description: 'Protocole, indications, formation et intégration dans la pratique libérale.',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/therapie-emdr-psychologue' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qu\'est-ce que la thérapie EMDR ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'L\'EMDR (Eye Movement Desensitization and Reprocessing) est une thérapie psychologique développée en 1987 par Francine Shapiro. Elle utilise des stimulations bilatérales (mouvements oculaires, tapotements) pour aider le cerveau à retraiter des souvenirs traumatiques bloqués. L\'EMDR est reconnue par l\'OMS et la Haute Autorité de Santé pour le traitement du PTSD.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quelles formations sont nécessaires pour pratiquer l\'EMDR ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'En France, la formation EMDR reconnue est dispensée par EMDR France (association affiliée à EMDR Europe). Elle comprend deux parties pratiques de 4 jours chacune, entrecoupées d\'une période de pratique supervisée. La formation est réservée aux psychologues, médecins et autres professionnels de santé mentale diplômés.',
          },
        },
        {
          '@type': 'Question',
          name: 'L\'EMDR est-il remboursé par la Sécurité sociale ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Non, l\'EMDR pratiqué en libéral n\'est pas remboursé par la Sécurité sociale hors dispositif Mon Soutien Psy. Certaines mutuelles remboursent partiellement les séances de psychologie incluant l\'EMDR. Le tarif d\'une séance EMDR est généralement supérieur à une consultation classique (80-150 euros selon le praticien et la région).',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Thérapie EMDR', item: 'https://psylib.eu/guides/therapie-emdr-psychologue' },
      ],
    },
  ],
};

export default function PageEMDR() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Thérapie EMDR</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide clinique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Thérapie EMDR : guide complet pour psychologues et patients
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Protocole, indications cliniques, formation agréée et intégration dans la pratique libérale.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            L&apos;EMDR (Eye Movement Desensitization and Reprocessing) est aujourd&apos;hui l&apos;une des
            thérapies les mieux documentées pour le traitement des traumatismes psychiques. Reconnue par
            l&apos;OMS depuis 2013 et recommandée par la Haute Autorité de Santé (HAS) pour le syndrome
            de stress post-traumatique (PTSD), elle s&apos;est progressivement imposée dans la pratique
            libérale des psychologues cliniciens. Ce guide fait le point sur le protocole, les indications,
            la formation et les aspects pratiques de l&apos;intégration de l&apos;EMDR au cabinet.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Qu&apos;est-ce que l&apos;EMDR ?</h2>
          <p className="mb-4 leading-relaxed">
            Développée en 1987 par la psychologue américaine Francine Shapiro, l&apos;EMDR repose sur
            l&apos;hypothèse que certains souvenirs traumatiques restent « bloqués » dans le réseau
            neurologique, sans avoir été correctement intégrés par le cerveau. Ces souvenirs, lorsqu&apos;ils
            sont activés par des stimuli du quotidien, déclenchent des réponses émotionnelles, cognitives
            et somatiques disproportionnées.
          </p>
          <p className="mb-4 leading-relaxed">
            Les stimulations bilatérales alternées (mouvements oculaires guidés par le praticien, tapotements
            sur les mains ou les genoux, sons alternés dans les oreilles) semblent faciliter le retraitement
            adaptatif de ces souvenirs, en les intégrant dans la mémoire épisodique ordinaire de manière
            à réduire leur charge émotionnelle.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Indications cliniques</h2>
          <p className="mb-4 leading-relaxed">
            L&apos;EMDR est indiqué en première intention pour le PTSD (état de stress post-traumatique),
            qu&apos;il soit consécutif à un événement unique (accident, agression, catastrophe naturelle) ou
            à des traumatismes répétés (violences conjugales, maltraitance infantile). Ses indications
            ont depuis été élargies à de nombreuses autres pathologies :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Phobies spécifiques et troubles anxieux</li>
            <li>Dépression liée à des événements de vie traumatiques</li>
            <li>Troubles de l&apos;attachement et traumatismes développementaux</li>
            <li>Douleurs chroniques et fibromyalgie</li>
            <li>Addictions (en complément d&apos;un suivi spécialisé)</li>
            <li>Deuil compliqué</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Formation EMDR en France</h2>
          <p className="mb-4 leading-relaxed">
            En France, la formation EMDR de référence est dispensée par EMDR France (Institut EMDR France),
            affilié à EMDR Europe et EMDR International Association (EMDRIA). Le parcours comprend deux
            modules de formation pratique de 4 jours chacun, avec une période de pratique supervisée
            entre les deux. La formation est conditionnée à un diplôme de niveau master en psychologie,
            médecine ou profession de santé mentale réglementée.
          </p>
          <p className="mb-4 leading-relaxed">
            Le coût de la formation complète est d&apos;environ 2 000 à 2 500 euros. Elle est déductible
            fiscalement et peut être prise en charge via le Fonds d&apos;Assurance Formation (FAF) ou
            le Compte Personnel de Formation (CPF) selon le statut du praticien.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Intégrer l&apos;EMDR dans sa pratique libérale</h2>
          <p className="mb-4 leading-relaxed">
            L&apos;EMDR se pratique généralement en complément d&apos;un suivi thérapeutique global.
            Les séances sont souvent plus longues qu&apos;une consultation classique (75 à 90 minutes
            pour les phases de retraitement actif), ce qui justifie une tarification adaptée. Il est
            recommandé de disposer d&apos;un espace de consultation stable et confidentiel, sans
            interruption possible.
          </p>
          <p className="mb-4 leading-relaxed">
            La documentation des séances EMDR dans le dossier patient suit les mêmes exigences déontologiques
            que toute autre prise en charge. PsyLib permet de structurer les notes de séance EMDR, de
            suivre l&apos;évolution des scores SUD (Subjective Units of Distress) et VoC (Validity of
            Cognition), et de gérer la facturation des séances allongées.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Gérez votre cabinet EMDR avec PsyLib</h2>
          <p className="mb-6 text-white/80">Notes structurées, suivi des protocoles, facturation des séances longues. Commencez gratuitement.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Qu'est-ce que la thérapie EMDR ?", a: "L'EMDR est une thérapie psychologique utilisant des stimulations bilatérales alternées pour aider le cerveau à retraiter des souvenirs traumatiques bloqués. Reconnue par l'OMS et la HAS, elle est particulièrement indiquée pour le PTSD et les traumatismes psychiques." },
              { q: "Combien de séances EMDR sont nécessaires ?", a: "Le nombre de séances varie selon la nature et la complexité du traumatisme. Un traumatisme unique peut nécessiter 3 à 6 séances. Les traumatismes développementaux ou répétés peuvent requérir un travail plus long. Le praticien évalue l'évolution au fil des séances." },
              { q: "L'EMDR est-il compatible avec d'autres thérapies ?", a: "Oui, l'EMDR s'intègre généralement bien dans un suivi thérapeutique global. Il peut être combiné avec la TCC, la psychothérapie d'orientation psychodynamique ou le travail corporel. Le praticien adapte le protocole à la situation clinique du patient." },
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
            <Link href="/guides" className="text-[#3D52A0] hover:underline">Tous les guides</Link>
          </p>
        </footer>
      </article>
    </>
  );
}

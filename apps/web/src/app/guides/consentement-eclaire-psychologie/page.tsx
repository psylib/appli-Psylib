import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Consentement éclairé en psychologie : obligations et mise en pratique 2026 | PsyLib',
  description:
    'Le consentement éclairé en psychologie clinique : obligations légales, contenu de l\'information, consentement des mineurs et traçabilité numérique conforme RGPD.',
  keywords: ['consentement éclairé psychologie', 'consentement patient psychologue', 'information patient psy', 'RGPD consentement psychologie'],
  alternates: { canonical: 'https://psylib.eu/guides/consentement-eclaire-psychologie' },
  openGraph: {
    title: 'Consentement éclairé en psychologie : obligations et mise en pratique 2026',
    description: 'Obligations légales, contenu de l\'information et traçabilité numérique.',
    url: 'https://psylib.eu/guides/consentement-eclaire-psychologie',
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
      headline: 'Consentement éclairé en psychologie : obligations et mise en pratique 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/consentement-eclaire-psychologie' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Un psychologue est-il tenu d\'obtenir le consentement éclairé de ses patients ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Oui. Le Code de déontologie des psychologues (principe 2 — liberté et consentement) exige que le psychologue s\'assure du consentement libre et éclairé des personnes qu\'il accompagne avant toute intervention. Ce consentement doit porter sur la nature, les objectifs, les méthodes et les limites de l\'accompagnement proposé.' },
        },
        {
          '@type': 'Question',
          name: 'Le consentement éclairé doit-il être écrit ?',
          acceptedAnswer: { '@type': 'Answer', text: 'La loi n\'impose pas systématiquement la forme écrite pour les consultations psychologiques ordinaires. Cependant, l\'écrit est fortement recommandé pour sa valeur probatoire. Pour certaines interventions spécifiques (utilisation de données à des fins de recherche, recours à l\'IA pour analyser des données cliniques, enregistrement de séances), le consentement écrit est impératif.' },
        },
        {
          '@type': 'Question',
          name: 'Comment gérer le consentement RGPD pour les données psychologiques ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Les données psychologiques sont des données de santé soumises au RGPD. Le praticien doit informer le patient du traitement de ses données (finalité, durée de conservation, droits), obtenir son consentement explicite pour tout traitement non nécessaire aux soins (envoi de questionnaires en ligne, utilisation de plateformes tierces), et documenter ce consentement. PsyLib intègre la gestion des consentements RGPD dans le dossier patient.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Consentement éclairé psychologie', item: 'https://psylib.eu/guides/consentement-eclaire-psychologie' },
      ],
    },
  ],
};

export default function PageConsentementEclaire() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Consentement éclairé psychologie</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide juridique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Consentement éclairé en psychologie : obligations et mise en pratique
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Obligations légales, contenu de l&apos;information, consentement des mineurs et traçabilité RGPD.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Le consentement éclairé est un principe fondamental de l&apos;éthique médicale et
            psychologique. Il garantit l&apos;autonomie du patient dans la relation thérapeutique
            et protège le praticien en cas de litige. En 2026, avec la numérisation croissante
            des pratiques (téléconsultation, outils d&apos;outcome tracking, IA clinique), les
            obligations de consentement se sont étendues à de nouveaux domaines. Ce guide fait
            le point sur les bonnes pratiques.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Contenu du consentement éclairé</h2>
          <p className="mb-4 leading-relaxed">
            Le consentement est &quot;éclairé&quot; lorsque le patient a reçu une information
            suffisante pour prendre sa décision librement. Cette information porte sur :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>La nature de l&apos;accompagnement proposé et les approches utilisées</li>
            <li>Les objectifs visés et les limites de la thérapie</li>
            <li>La durée prévisible et la fréquence des séances</li>
            <li>Le cadre de confidentialité et ses exceptions</li>
            <li>Les modalités de facturation et de remboursement</li>
            <li>Le droit du patient à interrompre le suivi à tout moment</li>
            <li>Le traitement des données personnelles (RGPD)</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Consentement et mineurs</h2>
          <p className="mb-4 leading-relaxed">
            Pour les patients mineurs, le consentement est donné par les titulaires de l&apos;autorité
            parentale. Cependant, l&apos;accord de l&apos;enfant doit être recherché dès lors qu&apos;il
            est capable de discernement. Le mineur a le droit de s&apos;opposer à ce que les
            informations médicales le concernant soient communiquées à ses parents s&apos;il juge
            que cette communication est préjudiciable (article L.1111-5 du Code de la santé publique).
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Gérez les consentements RGPD avec PsyLib</h2>
          <p className="mb-6 text-white/80">Consentements versionnés, stockage HDS, droit à l&apos;effacement. 14 jours gratuits.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Le consentement peut-il être retiré par le patient ?", a: "Oui, le consentement est révocable à tout moment sans justification. Le patient peut arrêter son suivi et demander la suppression de ses données personnelles (droit à l'effacement — article 17 du RGPD). Le praticien doit conserver les données minimales requises par les obligations légales (5 ans pour les données de santé selon l'HAS), puis procéder à la destruction sécurisée des autres données." },
              { q: "Faut-il un consentement spécifique pour la téléconsultation ?", a: "Il n'existe pas d'obligation légale explicite d'un consentement écrit supplémentaire pour la téléconsultation par rapport à la consultation présentielle. Cependant, il est recommandé d'informer le patient des spécificités de la téléconsultation (confidentialité de son environnement, risques techniques, limites dans les situations de crise) et de documenter cette information." },
              { q: "Le consentement à l'utilisation d'outils IA doit-il être explicite ?", a: "Oui. L'utilisation d'outils d'intelligence artificielle pour analyser, résumer ou traiter des données cliniques identifiantes constitue un traitement de données de santé à des fins non directement thérapeutiques. Elle requiert un consentement explicite du patient, distinct du consentement général au traitement des données. PsyLib gère ce consentement de façon granulaire par fonctionnalité." },
            ].map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>Guide rédigé par l&apos;équipe PsyLib — Mars 2026.{' '}<Link href="/guides" className="text-[#3D52A0] hover:underline">Tous les guides</Link></p>
        </footer>
      </article>
    </>
  );
}

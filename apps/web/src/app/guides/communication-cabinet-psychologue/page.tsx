import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Communication pour cabinet psychologue libéral : guide éthique 2026 | PsyLib',
  description:
    'Comment communiquer sur son cabinet de psychologue en respectant les règles déontologiques ? Site web, réseaux sociaux, Google Business Profile et règles de la publicité pour les psys.',
  keywords: ['communication psychologue libéral', 'site web psychologue', 'publicité psychologue', 'marketing psychologue cabinet'],
  alternates: { canonical: 'https://psylib.eu/guides/communication-cabinet-psychologue' },
  openGraph: {
    title: 'Communication pour cabinet psychologue libéral : guide éthique 2026',
    description: 'Site web, réseaux sociaux et règles déontologiques pour communiquer sur son cabinet.',
    url: 'https://psylib.eu/guides/communication-cabinet-psychologue',
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
      headline: 'Communication pour cabinet psychologue libéral : guide éthique 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/communication-cabinet-psychologue' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Un psychologue peut-il faire de la publicité pour son cabinet ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Le Code de déontologie des psychologues encadre la communication professionnelle. Si la publicité commerciale classique est déconseillée, l\'information professionnelle — site web présentant les compétences, spécialités et modalités de prise en charge — est tout à fait autorisée, à condition qu\'elle soit sobre, vérifiable et non comparative.' },
        },
        {
          '@type': 'Question',
          name: 'Un psychologue peut-il utiliser les réseaux sociaux ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Oui, avec discernement. LinkedIn pour le réseau professionnel, un compte Instagram ou Facebook sobre pour présenter ses approches thérapeutiques — ces usages sont acceptés. La règle principale : ne jamais utiliser l\'image ou les témoignages de patients (même anonymisés sans leur accord exprès), ne pas promettre de résultats garantis, et maintenir une frontière claire entre la vie professionnelle et personnelle.' },
        },
        {
          '@type': 'Question',
          name: 'Un site web pour un cabinet de psychologue est-il obligatoire ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Non, un site web n\'est pas obligatoire. Cependant, en 2026, 73 % des patients cherchent un professionnel de santé en ligne avant de prendre rendez-vous. Un profil PsyLib ou un site web simple augmente considérablement la visibilité du cabinet, notamment pour les nouveaux patients qui ne passent plus par le bouche-à-oreille traditionnel.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Communication cabinet psychologue', item: 'https://psylib.eu/guides/communication-cabinet-psychologue' },
      ],
    },
  ],
};

export default function PageCommunicationCabinet() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Communication cabinet psychologue</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide pratique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Communication pour cabinet psychologue libéral : guide éthique 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Site web, réseaux sociaux, Google Business Profile — comment communiquer en restant dans les règles déontologiques.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La communication est un sujet délicat pour les psychologues libéraux, tiraillés entre
            la nécessité de se faire connaître et les exigences déontologiques de discrétion et
            de sobriété. Pourtant, dans un marché de plus en plus concurrentiel et avec des patients
            qui recherchent massivement un psy en ligne, l&apos;invisibilité numérique peut freiner
            le développement d&apos;un cabinet. Ce guide trace la ligne entre ce qui est autorisé,
            recommandé et à éviter.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Ce que dit la déontologie</h2>
          <p className="mb-4 leading-relaxed">
            Le Code de déontologie des psychologues (2012) n&apos;interdit pas la communication
            professionnelle, mais l&apos;encadre. Les principes directeurs sont :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>L&apos;information doit être sobre, véridique et non comparative</li>
            <li>Aucune promesse de résultat garanti</li>
            <li>Pas d&apos;utilisation de témoignages patients sans consentement explicite</li>
            <li>Pas de démarchage actif à domicile ou en milieu de soin</li>
            <li>Les titres et diplômes mentionnés doivent être réels et vérifiables</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Les outils de communication recommandés</h2>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">1. Profil public PsyLib</h3>
          <p className="mb-4 leading-relaxed">
            Un profil PsyLib vous donne une présence en ligne immédiate, avec vos spécialités,
            vos approches thérapeutiques, vos tarifs et votre disponibilité. La prise de rendez-vous
            en ligne intégrée convertit les visiteurs en patients sans friction.
          </p>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">2. Google Business Profile</h3>
          <p className="mb-4 leading-relaxed">
            La création d&apos;une fiche Google Business Profile pour votre cabinet est gratuite
            et améliore considérablement votre visibilité dans les recherches locales. Un psychologue
            avec une fiche Google complète reçoit 3 à 5 fois plus de demandes de contact qu&apos;un
            praticien non référencé.
          </p>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">3. Site web professionnel</h3>
          <p className="mb-4 leading-relaxed">
            Un site web sobre, avec une page de présentation, vos spécialités, vos tarifs et
            un formulaire de contact ou un lien PsyLib, est le minimum recommandé. Évitez les
            designs trop commerciaux ou les formulations marketing agressives.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Profil public PsyLib — visible en 5 minutes</h2>
          <p className="mb-6 text-white/80">Profil, prise de RDV en ligne, agenda. Visibilité immédiate sur Google. Commencez gratuitement.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Créer mon profil public
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Un psychologue peut-il faire des vidéos YouTube ou TikTok ?", a: "Oui, à condition de respecter la déontologie. Les vidéos de sensibilisation, d'explication des approches thérapeutiques ou de psychoéducation sont bien acceptées. Ce qui est interdit : se présenter comme meilleur que ses confrères, promettre des résultats, ou utiliser des mises en scène de patients. Le registre scientifique et pédagogique est privilégié." },
              { q: "Comment répondre aux avis Google pour un psychologue ?", a: "La réponse aux avis Google doit être très sobre pour les praticiens de santé : jamais confirmer ou infirmer que l'auteur est un patient, ne jamais divulguer d'informations sur une consultation, remercier simplement pour le retour. En cas d'avis diffamatoire, il est possible de le signaler à Google ou de consulter un avocat spécialisé." },
              { q: "Peut-on afficher ses tarifs sur son site web ?", a: "Oui et c'est même recommandé. La transparence tarifaire est une obligation déontologique pour les praticiens libéraux. Afficher ses tarifs sur son site web ou sur PsyLib permet aux patients de se projeter sans mauvaise surprise et réduit les rendez-vous non confirmés." },
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

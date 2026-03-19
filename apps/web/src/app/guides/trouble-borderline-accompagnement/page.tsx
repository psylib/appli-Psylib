import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trouble de la personnalité borderline : accompagnement psychologique 2026 | PsyLib',
  description:
    'Comprendre et accompagner le trouble de la personnalité borderline (TPB). Thérapies validées (DBT, TFP), signes cliniques, rôle du psychologue libéral et outils de suivi.',
  keywords: [
    'trouble borderline',
    'personnalité borderline accompagnement',
    'DBT borderline',
    'psychologue borderline',
    'trouble personnalité émotionnellement labile',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/trouble-borderline-accompagnement' },
  openGraph: {
    title: 'Trouble de la personnalité borderline : accompagnement psychologique 2026',
    description: 'Thérapies validées, signes cliniques et rôle du psychologue libéral.',
    url: 'https://psylib.eu/guides/trouble-borderline-accompagnement',
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
      headline: 'Trouble de la personnalité borderline : accompagnement psychologique 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/trouble-borderline-accompagnement' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qu\'est-ce que le trouble de la personnalité borderline ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Le trouble de la personnalité borderline (TPB), aussi appelé trouble de la personnalité émotionnellement labile, est caractérisé par une instabilité émotionnelle intense, des relations interpersonnelles tumultueuses, une image de soi fluctuante et une impulsivité marquée. Il touche environ 1 à 2 % de la population générale et 10 à 20 % des consultants en psychiatrie.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quelle est la thérapie la plus efficace pour le trouble borderline ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'La Thérapie Comportementale Dialectique (DBT), développée par Marsha Linehan, est la thérapie la mieux validée pour le TPB. Elle combine des techniques cognitivo-comportementales avec des éléments de pleine conscience et d\'acceptation. La Thérapie Focalisée sur les Transferts (TFP) montre également des résultats significatifs.',
          },
        },
        {
          '@type': 'Question',
          name: 'Un psychologue libéral peut-il prendre en charge un patient borderline ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, sous certaines conditions. Le praticien doit être formé aux thérapies validées pour le TPB (DBT, TFP, CAT). Une coordination avec un psychiatre est souvent nécessaire pour la gestion des comorbidités et l\'éventuelle prescription médicamenteuse. PsyLib facilite cette coordination via la messagerie sécurisée et le réseau professionnel.',
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Trouble borderline', item: 'https://psylib.eu/guides/trouble-borderline-accompagnement' },
      ],
    },
  ],
};

export default function PageBorderline() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Trouble borderline</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide clinique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Trouble de la personnalité borderline : accompagnement psychologique
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Thérapies validées, signes cliniques, rôle du psychologue libéral et outils de suivi patient.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Le trouble de la personnalité borderline (TPB) est l&apos;un des diagnostics les plus complexes
            à accompagner en pratique libérale. Marqué par une instabilité émotionnelle intense, des
            relations interpersonnelles tempétueuses et un sentiment chronique de vide intérieur, ce trouble
            touche environ 1 à 2 % de la population. Ce guide propose un éclairage clinique sur les
            thérapies validées, la posture du praticien et les outils de suivi disponibles dans PsyLib.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Signes cliniques et diagnostic différentiel</h2>
          <p className="mb-4 leading-relaxed">
            Selon les critères du DSM-5, le diagnostic de TPB repose sur la présence d&apos;au moins
            5 des 9 critères suivants : peur intense de l&apos;abandon, relations instables et intenses,
            perturbation de l&apos;identité, impulsivité dans au moins deux domaines potentiellement
            dommageables, comportements suicidaires ou parasuicidaires récurrents, instabilité affective,
            sentiment chronique de vide, colère intense et inappropriée, idéation paranoïde transitoire.
          </p>
          <p className="mb-4 leading-relaxed">
            Le diagnostic différentiel inclut le trouble bipolaire (notamment les épisodes mixtes et
            l&apos;hypomanie), les troubles dissociatifs, le trouble de la personnalité narcissique
            et le PTSD complexe. La comorbidité avec d&apos;autres troubles est très fréquente
            (dépression, anxiété, addictions, troubles alimentaires).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Thérapies validées pour le TPB</h2>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">1. Thérapie Comportementale Dialectique (DBT)</h3>
          <p className="mb-4 leading-relaxed">
            Développée par Marsha Linehan dans les années 1990, la DBT est la thérapie ayant le niveau de
            preuve le plus élevé pour le TPB. Elle combine thérapie individuelle, groupes de compétences
            (mindfulness, régulation émotionnelle, tolérance à la détresse, efficacité interpersonnelle)
            et coaching téléphonique en cas de crise. La formation DBT est exigeante mais des modules
            d&apos;initiation sont accessibles en France.
          </p>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">2. Thérapie Focalisée sur les Transferts (TFP)</h3>
          <p className="mb-4 leading-relaxed">
            Issue de la psychanalyse contemporaine, la TFP de Kernberg travaille les relations
            d&apos;objet pathologiques via l&apos;analyse du transfert et du contre-transfert. Elle est
            particulièrement adaptée aux praticiens d&apos;orientation psychodynamique ayant reçu
            une formation spécifique.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Rôle du psychologue libéral</h2>
          <p className="mb-4 leading-relaxed">
            La prise en charge en libéral d&apos;un patient présentant un TPB nécessite une coordination
            pluridisciplinaire. Le psychologue travaille généralement en lien avec un psychiatre
            référent pour les aspects médicamenteux et les hospitalisations éventuelles. La supervision
            régulière est indispensable pour préserver la qualité de l&apos;alliance thérapeutique et
            prévenir le contre-transfert négatif.
          </p>
          <p className="mb-4 leading-relaxed">
            PsyLib intègre un module de réseau professionnel permettant de partager des informations
            cliniques sécurisées avec des confrères ou de solliciter une supervision. Les notes de séance
            sont stockées sur infrastructure certifiée HDS pour garantir la confidentialité des données.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Suivez vos patients complexes avec PsyLib</h2>
          <p className="mb-6 text-white/80">Notes structurées, réseau de supervision, outcome tracking PHQ-9. 14 jours gratuits.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Quelle est la durée d'un accompagnement borderline en libéral ?", a: "Le TPB est un trouble chronique nécessitant un accompagnement long terme. Les études sur la DBT montrent des améliorations significatives dès 6 à 12 mois. Un accompagnement de 2 à 5 ans est souvent nécessaire pour une stabilisation durable. Des périodes de suivi moins intensif alternent avec des phases de travail thérapeutique actif." },
              { q: "Comment gérer les crises en dehors des séances ?", a: "La mise en place d'un plan de crise dès le début du suivi est essentielle. Ce plan inclut les contacts d'urgence, les stratégies de tolérance à la détresse et les conditions de joignabilité du praticien. La DBT intègre un protocole de coaching téléphonique pour les situations de crise entre les séances." },
              { q: "Le trouble borderline peut-il guérir ?", a: "Le pronostic du TPB a été considérablement révisé à la hausse ces dernières années. Les études longitudinales montrent que 50 à 70 % des patients voient leurs symptômes s'améliorer significativement sur 10 ans. La thérapie validée, surtout la DBT, améliore considérablement la qualité de vie et réduit les comportements auto-dommageables." },
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

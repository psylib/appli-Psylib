import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Secret professionnel du psychologue : obligations, exceptions et RGPD 2026 | PsyLib',
  description:
    'Le secret professionnel du psychologue est une obligation déontologique et légale. Étendue, exceptions légales (maltraitance, signalement), partage d\'informations et conformité RGPD.',
  keywords: ['secret professionnel psychologue', 'confidentialité psychologue', 'déontologie psychologue', 'secret partagé psychologie'],
  alternates: { canonical: 'https://psylib.eu/guides/secret-professionnel-psychologue' },
  openGraph: {
    title: 'Secret professionnel du psychologue : obligations, exceptions et RGPD 2026',
    description: 'Étendue, exceptions légales, partage d\'informations et conformité RGPD pour les psychologues.',
    url: 'https://psylib.eu/guides/secret-professionnel-psychologue',
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
      headline: 'Secret professionnel du psychologue : obligations, exceptions et RGPD 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/secret-professionnel-psychologue' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Le psychologue est-il soumis au secret professionnel ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Oui. Le psychologue est soumis à une obligation de discrétion et de confidentialité vis-à-vis des informations recueillies dans le cadre de son exercice professionnel. Cette obligation est inscrite dans le Code de déontologie des psychologues (2012) et dans le Code pénal (article 226-13). La violation du secret professionnel est punie de 1 an d\'emprisonnement et 15 000 € d\'amende.' },
        },
        {
          '@type': 'Question',
          name: 'Quelles sont les exceptions au secret professionnel du psychologue ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Les principales exceptions légales au secret professionnel sont : le signalement de maltraitance sur mineur ou personne vulnérable (article 434-3 du Code pénal), le témoignage en justice sur injonction du juge, et le partage d\'informations dans le cadre du secret partagé entre professionnels de santé (article L.1110-4 du CSP) avec le consentement du patient.' },
        },
        {
          '@type': 'Question',
          name: 'Comment le RGPD s\'applique-t-il aux données de consultation psychologique ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Les données psychologiques sont des données de santé au sens du RGPD, bénéficiant d\'une protection renforcée. Elles ne peuvent être collectées qu\'avec le consentement explicite du patient, stockées sur infrastructure HDS certifiée, et ne peuvent être transmises à des tiers sans base légale. PsyLib stocke toutes les données sur infrastructure AWS certifiée HDS (Hébergeur de Données de Santé).' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Secret professionnel psychologue', item: 'https://psylib.eu/guides/secret-professionnel-psychologue' },
      ],
    },
  ],
};

export default function PageSecretProfessionnel() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Secret professionnel psychologue</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide juridique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Secret professionnel du psychologue : obligations, exceptions et RGPD
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Tout ce que le psychologue libéral doit savoir sur la confidentialité, les signalements et la conformité numérique.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Le secret professionnel est la pierre angulaire de la confiance thérapeutique. Sans garantie
            de confidentialité, aucun patient ne pourrait se livrer librement en consultation. Pour le
            psychologue libéral, cette obligation est à la fois déontologique (Code de déontologie des
            psychologues, 2012), légale (Code pénal) et réglementaire (RGPD, HDS). Ce guide fait le
            point sur l&apos;étendue du secret, ses exceptions et les obligations numériques en 2026.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Étendue du secret professionnel</h2>
          <p className="mb-4 leading-relaxed">
            Le secret couvre l&apos;intégralité des informations confiées par le patient : contenu des
            séances, informations personnelles, diagnostics, traitements, situation familiale et
            professionnelle. Il s&apos;étend aussi à l&apos;identité même du patient — le praticien
            ne peut pas confirmer ou infirmer qu&apos;une personne est son patient.
          </p>
          <p className="mb-4 leading-relaxed">
            Le secret s&apos;applique y compris à l&apos;égard des proches (famille, conjoint), des
            employeurs, des compagnies d&apos;assurance et des autorités administratives — sauf
            exceptions légales explicites.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Les exceptions légales</h2>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">Signalement de maltraitance</h3>
          <p className="mb-4 leading-relaxed">
            L&apos;article 434-3 du Code pénal impose à tout citoyen (et plus particulièrement aux
            professionnels en contact avec des mineurs) de signaler les faits de maltraitance ou
            de privations portés à leur connaissance. Ce signalement s&apos;effectue auprès du Procureur
            de la République ou de la cellule de recueil des informations préoccupantes (CRIP).
            Il lève le secret professionnel sur les faits signalés.
          </p>
          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">Secret partagé entre professionnels</h3>
          <p className="mb-4 leading-relaxed">
            L&apos;article L.1110-4 du Code de la santé publique permet le partage d&apos;informations
            médicales entre professionnels de santé prenant en charge le même patient, dans la stricte
            mesure nécessaire à la coordination des soins et avec le consentement du patient.
            Ce secret partagé s&apos;applique dans le cadre d&apos;une coordination psy-médecin généraliste
            ou psy-psychiatre.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Obligations numériques en 2026</h2>
          <p className="mb-4 leading-relaxed">
            Le RGPD et la réglementation HDS imposent que les données de santé des patients soient
            stockées sur infrastructure certifiée. L&apos;utilisation de Google Drive, Dropbox ou
            d&apos;un simple email pour stocker ou transmettre des notes de séance est légalement
            non conforme. PsyLib stocke toutes les données sur AWS eu-west-3 (Paris) certifié
            Hébergeur de Données de Santé, et chiffre les notes de séance avec AES-256-GCM.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Stockez vos données patients en conformité HDS</h2>
          <p className="mb-6 text-white/80">Chiffrement AES-256, infrastructure certifiée HDS, audit logs. 14 jours gratuits.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Un psychologue peut-il parler d'un patient en supervision ?", a: "Oui, sous conditions. La supervision clinique est considérée comme une nécessité déontologique. Les informations partagées doivent être limitées aux données cliniquement pertinentes et le praticien peut, dans certains cas, anonymiser les éléments permettant d'identifier le patient. La supervision doit être réalisée avec un professionnel soumis lui-même au secret professionnel." },
              { q: "Un parent peut-il accéder aux informations d'un suivi de son enfant adolescent ?", a: "La situation est complexe. L'enfant mineur est représenté légalement par ses parents, qui peuvent en principe demander l'accès aux informations médicales. Cependant, le mineur capable de discernement peut s'opposer à cette communication. Le praticien doit naviguer entre la protection de l'enfant, son autonomie et les droits parentaux, en tenant compte de l'âge et de la maturité du mineur." },
              { q: "Peut-on utiliser des outils IA pour analyser les notes de séance ?", a: "Oui, mais sous conditions strictes. L'utilisation d'outils IA tiers (ChatGPT, etc.) avec des données identifiantes de patients est incompatible avec le RGPD et la réglementation HDS. PsyLib utilise l'IA uniquement pour les données anonymisées ou avec consentement explicite du patient, sur des serveurs HDS certifiés. Le praticien reste seul responsable des décisions cliniques." },
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

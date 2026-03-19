import type { Metadata } from 'next';
import Link from 'next/link';

export interface CityConfig {
  name: string;
  slug: string;
  department?: string;
  population?: string;
  psyCount?: string;
  intro: string;
  faq: Array<{ q: string; a: string }>;
}

export function generateCityMetadata(city: CityConfig): Metadata {
  return {
    title: `Psychologues à ${city.name} — Trouver votre psy | PsyLib`,
    description: `Trouvez un psychologue à ${city.name} disponible rapidement. ${city.psyCount ?? 'Nombreux praticiens'} en libéral, prise de RDV en ligne 24h/24. Conforme HDS.`,
    keywords: [
      `psychologue ${city.name}`,
      `psy ${city.name}`,
      `trouver psychologue ${city.name}`,
      `consultation psychologue ${city.name}`,
      `psychologue libéral ${city.name}`,
    ],
    alternates: { canonical: `https://psylib.eu/psychologue-${city.slug}` },
    openGraph: {
      title: `Psychologues à ${city.name} — Trouver votre psy | PsyLib`,
      description: `Trouvez un psychologue à ${city.name} disponible rapidement. Prise de RDV en ligne 24h/24.`,
      url: `https://psylib.eu/psychologue-${city.slug}`,
      type: 'website',
      locale: 'fr_FR',
      siteName: 'PsyLib',
    },
    robots: { index: true, follow: true },
  };
}

export function CityPage({ city }: { city: CityConfig }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MedicalBusiness',
        name: `Psychologues à ${city.name} — PsyLib`,
        description: `Trouvez un psychologue libéral à ${city.name} via PsyLib. Prise de RDV en ligne, conforme HDS.`,
        url: `https://psylib.eu/psychologue-${city.slug}`,
        areaServed: { '@type': 'City', name: city.name },
        medicalSpecialty: 'Psychologie clinique',
      },
      {
        '@type': 'FAQPage',
        mainEntity: city.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
          {
            '@type': 'ListItem',
            position: 2,
            name: `Psychologues à ${city.name}`,
            item: `https://psylib.eu/psychologue-${city.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Psychologues à {city.name}</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Annuaire local — {city.name}
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Trouver un psychologue à {city.name}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Prenez rendez-vous avec un psychologue libéral à {city.name}, disponible rapidement,
            en présentiel ou en visio.
          </p>
        </header>

        {/* Intro */}
        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">{city.intro}</p>
        </section>

        {/* CTA principal */}
        <section className="mb-10 text-center">
          <Link
            href={`/trouver-mon-psy?ville=${encodeURIComponent(city.name)}`}
            className="inline-block rounded-lg bg-[#3D52A0] px-8 py-4 text-lg font-semibold text-white transition hover:bg-[#2E3F7A]"
          >
            Trouver un psy à {city.name}
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            Prise de RDV en ligne 24h/24 — Conforme HDS
          </p>
        </section>

        {/* Comment ça marche */}
        <section className="mb-10">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comment trouver le bon psychologue à {city.name} ?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Recherchez',
                desc: `Filtrez les psychologues à ${city.name} par spécialité, disponibilité et tarif.`,
              },
              {
                step: '2',
                title: 'Choisissez',
                desc: 'Consultez les profils détaillés, les approches thérapeutiques et les avis.',
              },
              {
                step: '3',
                title: 'Prenez RDV',
                desc: 'Réservez directement en ligne, 24h/24, sans attendre.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-gray-200 p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#3D52A0] text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold text-[#1E1B4B]">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Spécialités disponibles */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Spécialités disponibles à {city.name}
          </h2>
          <p className="mb-4 leading-relaxed text-gray-700">
            Les psychologues libéraux à {city.name} proposent une grande variété d&apos;approches
            thérapeutiques. Vous trouverez sur PsyLib des praticiens spécialisés en :
          </p>
          <ul className="grid gap-2 text-gray-700 sm:grid-cols-2">
            {[
              'Thérapies cognitivo-comportementales (TCC)',
              'EMDR (traumatismes)',
              'Psychanalyse et psychodynamique',
              'Thérapies systémiques et de couple',
              'Neuropsychologie et bilans cognitifs',
              'Psychologie de l\'enfant et de l\'adolescent',
              'Gestion du stress et burnout',
              'Thérapies ACT et pleine conscience',
            ].map((spec) => (
              <li key={spec} className="flex items-start gap-2">
                <span className="mt-1 text-[#3D52A0]">✓</span>
                <span>{spec}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes — Psychologue à {city.name}
          </h2>
          <div className="space-y-4">
            {city.faq.map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Vous êtes psychologue à {city.name} ?
          </h2>
          <p className="mb-6 text-white/80">
            Rejoignez PsyLib pour gérer votre cabinet et être visible en ligne. 14 jours d&apos;essai gratuit.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Créer mon profil gratuitement
          </Link>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour à l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/trouver-mon-psy" className="text-[#3D52A0] hover:underline">Trouver mon psy</Link>
            {' '}|{' '}
            <Link href="/guides" className="text-[#3D52A0] hover:underline">Guides psychologues</Link>
          </p>
        </footer>
      </div>
    </>
  );
}

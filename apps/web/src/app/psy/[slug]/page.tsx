import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PublicProfileClient } from './public-profile-client';
import type { PublicPsyProfile } from '@/lib/api/public-booking';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

async function getProfile(slug: string): Promise<PublicPsyProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/psy/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<PublicPsyProfile>;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) return { title: 'Psychologue | PsyLib' };

  const description = profile.bio
    ? profile.bio.slice(0, 160)
    : `Prenez rendez-vous avec ${profile.name}, psychologue${profile.city ? ` à ${profile.city}` : ''}.`;

  return {
    title: `${profile.name}${profile.specialization ? ` — ${profile.specialization}` : ''} | PsyLib`,
    description,
    alternates: { canonical: `https://psylib.eu/psy/${slug}` },
    openGraph: {
      type: 'profile',
      title: profile.name,
      description,
      url: `https://psylib.eu/psy/${slug}`,
      siteName: 'PsyLib',
    },
  };
}

export default async function PsyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfile(slug);
  if (!profile) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.specialization ?? 'Psychologue',
    ...(profile.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: profile.address,
        addressLocality: profile.city ?? '',
        addressCountry: 'FR',
      },
    }),
    ...(profile.phone && { telephone: profile.phone }),
    ...(profile.city && { areaServed: profile.city }),
    ...(profile.specialties.length > 0 && { knowsAbout: profile.specialties }),
    url: `https://psylib.eu/psy/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicProfileClient profile={profile} />
    </>
  );
}

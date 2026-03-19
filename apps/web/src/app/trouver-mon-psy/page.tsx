import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';
import { FindPsyContent } from '@/components/public/find-psy-content';

export const metadata: Metadata = {
  title: 'Trouver un psychologue — PsyLib',
  description:
    'Trouvez un psychologue libéral qui vous correspond : approche thérapeutique, spécialité, ville. Service gratuit et confidentiel.',
  keywords: [
    'trouver psychologue',
    'psychologue libéral',
    'TCC',
    'thérapie cognitivo-comportementale',
    'consultation psychologue',
  ],
};

export default function FindPsyPage() {
  return (
    <>
      <LandingNav />
      <main className="min-h-screen bg-warm-white pt-16">
        <FindPsyContent />
      </main>
      <LandingFooter />
    </>
  );
}

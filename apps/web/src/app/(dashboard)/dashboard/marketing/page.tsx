import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const MarketingGated = dynamic(
  () => import('@/components/marketing/marketing-gated').then(m => m.MarketingGated),
  { ssr: false },
);

export const metadata = {
  title: 'Marketing IA — PsyLib',
  description: 'Générez du contenu marketing professionnel avec l\'IA',
};

export default async function MarketingPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return <MarketingGated />;
}

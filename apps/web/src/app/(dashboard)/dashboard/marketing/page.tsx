import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import MarketingGatedClient from '@/components/marketing/marketing-gated-client';

export const metadata = {
  title: 'Marketing IA — PsyLib',
  description: 'Générez du contenu marketing professionnel avec l\'IA',
};

export default async function MarketingPage() {
  const session = await auth();
  if (!session) redirect('/login');
  return <MarketingGatedClient />;
}

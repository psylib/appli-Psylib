import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { AiAssistantContent } from '@/components/ai/ai-assistant-content';

export const metadata = {
  title: 'Assistant IA — PsyLib',
  description: 'Générez des contenus et exercices avec l\'IA',
};

export default async function AiAssistantPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <AiAssistantContent />;
}

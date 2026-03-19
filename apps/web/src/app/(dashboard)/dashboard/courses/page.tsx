import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { CoursesGated } from '@/components/courses/courses-gated';

export const metadata = {
  title: 'Formations — PsyLib',
  description: 'Créez et gérez vos formations en ligne',
};

export default async function CoursesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <CoursesGated />;
}

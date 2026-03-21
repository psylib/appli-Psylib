import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const CoursesGated = dynamic(
  () => import('@/components/courses/courses-gated').then(mod => ({ default: mod.CoursesGated })),
  { loading: () => <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin h-8 w-8 border-2 border-[#3D52A0] border-t-transparent rounded-full" /></div> }
);

export const metadata = {
  title: 'Formations — PsyLib',
  description: 'Créez et gérez vos formations en ligne',
};

export default async function CoursesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <CoursesGated />;
}

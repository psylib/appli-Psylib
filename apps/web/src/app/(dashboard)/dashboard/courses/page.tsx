import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const CoursesGated = dynamic(
  () => import('@/components/courses/courses-gated').then(mod => ({ default: mod.CoursesGated })),
  { loading: () => <div className="p-6 space-y-4"><div className="h-8 w-48 rounded-lg bg-muted animate-pulse" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}</div></div> }
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

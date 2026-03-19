import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { CourseDetailContent } from '@/components/courses/course-detail-content';

export const metadata = {
  title: 'Formation — PsyLib',
};

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;

  return <CourseDetailContent courseId={id} />;
}

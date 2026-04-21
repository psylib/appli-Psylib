import { NewSessionContent } from '@/components/sessions/new-session';

export const metadata = { title: 'Nouvelle séance' };

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const { patientId } = await searchParams;
  return <NewSessionContent preselectedPatientId={patientId} />;
}

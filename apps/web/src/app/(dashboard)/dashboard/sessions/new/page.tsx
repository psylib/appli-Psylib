import { NewSessionContent } from '@/components/sessions/new-session';

export const metadata = { title: 'Nouvelle séance' };

export default function NewSessionPage({
  searchParams,
}: {
  searchParams?: { patientId?: string };
}) {
  return <NewSessionContent preselectedPatientId={searchParams?.patientId} />;
}

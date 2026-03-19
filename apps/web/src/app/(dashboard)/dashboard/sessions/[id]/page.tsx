import { SessionDetailContent } from '@/components/sessions/session-detail';

export const metadata = { title: 'Séance' };

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  return <SessionDetailContent sessionId={params.id} />;
}

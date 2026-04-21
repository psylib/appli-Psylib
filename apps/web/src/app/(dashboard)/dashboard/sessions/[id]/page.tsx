import { SessionDetailContent } from '@/components/sessions/session-detail';

export const metadata = { title: 'Séance' };

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SessionDetailContent sessionId={id} />;
}

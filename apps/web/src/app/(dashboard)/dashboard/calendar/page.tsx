import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { CalendarContent } from '@/components/calendar/calendar-content';

export const metadata = {
  title: 'Calendrier — PsyLib',
  description: 'Gérez vos rendez-vous et planifiez vos séances',
};

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return <CalendarContent />;
}

import { useAppointments } from './useAppointments';

export interface DayAppointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  patient: { id: string; name: string };
  type?: string;
  modality?: 'in_person' | 'online';
}

export function useAppointmentsByDate(date: Date): ReturnType<typeof useAppointments> & { appointments: DayAppointment[] } {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

  const query = useAppointments(from, to);

  const appointments: DayAppointment[] = ((query.data ?? []) as DayAppointment[])
    .filter((a) => a.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return { ...query, appointments };
}

import { useAppointments } from './useAppointments';
import type { UseQueryResult } from '@tanstack/react-query';

export interface DayAppointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  patient: { id: string; name: string };
  type?: string;
  modality?: 'in_person' | 'online';
}

export function useAppointmentsByDate(date: Date): UseQueryResult<unknown> & { appointments: DayAppointment[] } {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

  const query = useAppointments(from, to);

  const appointments: DayAppointment[] = (query.data ?? [])
    .filter((a) => a.status !== 'cancelled' && a.patient)
    .map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt,
      duration: a.duration,
      status: a.status,
      patient: a.patient!,
      type: a.type,
    }))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return { ...query, appointments };
}

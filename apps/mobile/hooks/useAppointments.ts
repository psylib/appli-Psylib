/**
 * Appointments CRUD hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

interface Appointment {
  id: string;
  psychologistId: string;
  patientId: string;
  sessionId?: string | null;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  reminderSentAt?: string | null;
  patient?: { id: string; name: string; email?: string };
  type?: string;
  createdAt: string;
}

interface CreateAppointmentDto {
  patientId: string;
  scheduledAt: string;
  duration: number;
  type?: string;
}

const APPOINTMENTS_KEY = 'appointments';

export function useAppointments(from: string, to: string) {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: [APPOINTMENTS_KEY, from, to],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<Appointment[]>(
        `/appointments?from=${from}&to=${to}`,
        token ?? undefined,
      );
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateAppointment() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentDto) => {
      const token = await getValidToken();
      return apiClient.post<Appointment>('/appointments', data, token ?? undefined);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
  });
}

export function useUpdateAppointment() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Appointment>) => {
      const token = await getValidToken();
      return apiClient.patch<Appointment>(`/appointments/${id}`, data, token ?? undefined);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
  });
}

export function useConfirmAppointment() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getValidToken();
      return apiClient.patch<Appointment>(
        `/appointments/${id}`,
        { status: 'confirmed' },
        token ?? undefined,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
  });
}

export function useDeclineAppointment() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getValidToken();
      return apiClient.patch<Appointment>(
        `/appointments/${id}`,
        { status: 'cancelled' },
        token ?? undefined,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [APPOINTMENTS_KEY] });
    },
  });
}

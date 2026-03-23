import { apiClient } from './client';

export interface PendingAppointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  source: string;
  reason: string | null;
  patient: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}

export const appointmentsApi = {
  getPending: (token: string) =>
    apiClient.get<PendingAppointment[]>('/appointments/pending', token),

  confirm: (id: string, token: string) =>
    apiClient.put<{ id: string; status: string }>(`/appointments/${id}/confirm`, {}, token),

  decline: (id: string, token: string) =>
    apiClient.put<{ id: string; status: string }>(`/appointments/${id}/decline`, {}, token),

  cancel: (id: string, token: string) =>
    apiClient.delete<{ id: string; status: string }>(`/appointments/${id}`, token),

  update: (id: string, data: { scheduledAt?: string; duration?: number; status?: string }, token: string) =>
    apiClient.put<{ id: string; status: string }>(`/appointments/${id}`, data, token),
};

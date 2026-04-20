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

export interface CreateAppointmentData {
  patientId: string;
  scheduledAt: string;
  duration: number;
  isOnline?: boolean;
  paymentMode?: 'none' | 'prepayment' | 'post_session';
  paymentAmount?: number;
}

export interface CreateGroupAppointmentData {
  patientId: string;
  participantIds: string[];
  scheduledAt: string;
  duration: number;
  consultationTypeId?: string;
}

export const appointmentsApi = {
  create: (data: CreateAppointmentData, token: string) =>
    apiClient.post<{ id: string; status: string }>('/appointments', data, token),

  createGroup: (data: CreateGroupAppointmentData, token: string) =>
    apiClient.post<{ id: string; status: string; participantCount: number }>('/appointments/group', data, token),

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

  sendPaymentLink: (id: string, data: { amount?: number }, token: string) =>
    apiClient.post<{ success: boolean; checkoutUrl: string }>(`/appointments/${id}/send-payment-link`, data, token),
};

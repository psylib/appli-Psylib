import { apiClient } from './client';
import type { Session, PaginatedResponse } from '@psyscale/shared-types';

export const sessionsApi = {
  list: (params: { page?: number; patientId?: string; from?: string; to?: string }, token: string) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.patientId) qs.set('patientId', params.patientId);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    return apiClient.get<PaginatedResponse<Session>>(`/sessions?${qs}`, token);
  },

  get: (id: string, token: string) =>
    apiClient.get<Session>(`/sessions/${id}`, token),

  create: (data: {
    patientId: string;
    date: string;
    duration: number;
    type?: string;
    notes?: string;
    tags?: string[];
    rate?: number;
  }, token: string) =>
    apiClient.post<Session>('/sessions', data, token),

  update: (id: string, data: Partial<Session>, token: string) =>
    apiClient.put<Session>(`/sessions/${id}`, data, token),

  autosave: (id: string, notes: string, token: string) =>
    apiClient.patch<{ saved: boolean; at: string }>(`/sessions/${id}/autosave`, { notes }, token),

  delete: (id: string, token: string) =>
    apiClient.delete<{ deleted: boolean }>(`/sessions/${id}`, token),

  stats: (token: string) =>
    apiClient.get<{ totalThisMonth: number; revenueThisMonth: number }>('/sessions/stats', token),
};

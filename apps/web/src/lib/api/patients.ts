import { apiClient } from './client';
import type { Patient, PaginatedResponse } from '@psyscale/shared-types';

export interface PatientListItem extends Omit<Patient, 'notes'> {
  portalStatus: 'none' | 'pending' | 'active';
}

export const patientsApi = {
  list: (params: { page?: number; limit?: number; search?: string; status?: string }, token: string) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', params.search);
    if (params.status) qs.set('status', params.status);
    return apiClient.get<PaginatedResponse<PatientListItem>>(`/patients?${qs}`, token);
  },

  get: (id: string, token: string) =>
    apiClient.get<Patient>(`/patients/${id}`, token),

  create: (data: { name: string; email?: string; phone?: string; notes?: string }, token: string) =>
    apiClient.post<Patient>('/patients', data, token),

  update: (id: string, data: Partial<Patient>, token: string) =>
    apiClient.put<Patient>(`/patients/${id}`, data, token),

  archive: (id: string, token: string) =>
    apiClient.delete<Patient>(`/patients/${id}`, token),

  stats: (token: string) =>
    apiClient.get<{ total: number; active: number; newThisMonth: number }>('/patients/stats', token),

  invite: (id: string, token: string) =>
    apiClient.post<{ id: string; email: string; expiresAt: string; invitationUrl: string }>(
      `/patients/${id}/invite`,
      {},
      token,
    ),

  portalStatus: (id: string, token: string) =>
    apiClient.get<{
      hasPortalAccess: boolean;
      hasAiConsent: boolean;
      lastSignIn: string | null;
      invitation: { status: string; email: string; expiresAt: string } | null;
    }>(`/patients/${id}/portal-status`, token),

  portalMood: (id: string, token: string) =>
    apiClient.get<{ id: string; mood: number; note?: string; createdAt: string }[]>(
      `/patients/${id}/portal-mood`,
      token,
    ),

  portalExercises: (id: string, token: string) =>
    apiClient.get<
      { id: string; title: string; status: string; completedAt?: string; patientFeedback?: string }[]
    >(`/patients/${id}/portal-exercises`, token),
};

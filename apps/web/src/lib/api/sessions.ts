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

  autosave: (id: string, notes: string, token: string, mood?: number | null) =>
    apiClient.patch<{ saved: boolean; at: string }>(
      `/sessions/${id}/autosave`,
      { notes, mood },
      token,
    ),

  delete: (id: string, token: string) =>
    apiClient.delete<{ deleted: boolean }>(`/sessions/${id}`, token),

  stats: (token: string) =>
    apiClient.get<{ totalThisMonth: number; revenueThisMonth: number }>('/sessions/stats', token),

  // ── Scribe IA — import audio présentiel (Pro + Clinic) ──
  /** Importe un fichier audio de séance pour transcription + note IA */
  uploadScribeAudio: async (
    id: string,
    audioFile: File,
    consentConfirmed: boolean,
    token: string,
  ): Promise<{ status: string }> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.psylib.eu';
    const formData = new FormData();
    formData.append('audio', audioFile, audioFile.name);
    formData.append('consentConfirmed', String(consentConfirmed));
    const response = await fetch(`${baseUrl}/sessions/${id}/scribe/audio`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `HTTP ${response.status}`);
    }
    return response.json() as Promise<{ status: string }>;
  },

  /** Statut du Scribe IA (import audio) pour cette séance */
  getScribeStatus: (id: string, token: string) =>
    apiClient.get<{ status: 'none' | 'processing' | 'done' | 'failed'; hasNote: boolean }>(
      `/sessions/${id}/scribe/status`,
      token,
    ),
};

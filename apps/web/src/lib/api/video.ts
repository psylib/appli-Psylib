import { apiClient } from './client';

export interface TodayRoom {
  appointmentId: string;
  patientName: string;
  scheduledAt: string;
  duration: number;
  status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
  roomId: string | null;
}

export interface VideoTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
}

export interface PatientJoinResponse {
  token: string;
  wsUrl: string;
  roomName: string;
  needsConsent?: boolean;
}

export const videoApi = {
  /** Create a LiveKit room for an appointment */
  createRoom: (appointmentId: string, token: string) =>
    apiClient.post<{ id: string; roomName: string; status: string }>(
      '/video/rooms',
      { appointmentId },
      token,
    ),

  /** Get a LiveKit token for the psychologist */
  getPsyToken: (appointmentId: string, token: string) =>
    apiClient.post<VideoTokenResponse>(
      `/video/rooms/${appointmentId}/token`,
      {},
      token,
    ),

  /** End a video room */
  endRoom: (appointmentId: string, token: string) =>
    apiClient.post<void>(`/video/rooms/${appointmentId}/end`, {}, token),

  /** Get today's rooms with status */
  getTodayRooms: (token: string) =>
    apiClient.get<TodayRoom[]>('/video/today', token),

  /** Patient joins via public token (no auth required) */
  joinAsPatient: (joinToken: string) =>
    apiClient.post<PatientJoinResponse>(`/video/join/${joinToken}`, {}),

  /** Patient records video consent (no auth required) */
  recordConsent: (joinToken: string) =>
    apiClient.post<{ ok: boolean }>(`/video/consent/${joinToken}`, {}),
};

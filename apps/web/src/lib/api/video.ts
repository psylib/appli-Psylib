import { apiClient } from './client';

export interface InstantRoomResponse {
  appointmentId: string;
  token: string;
  wsUrl: string;
  roomName: string;
  patientLink: string;
  durationMin: number;
}

export interface TodayRoom {
  appointmentId: string;
  patientName: string | null;
  scheduledAt: string;
  duration: number;
  status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
  roomId: string | null;
  participantCount: number;
  participantsJoined: number;
  participantNames: string[];
}

export interface VideoTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
  durationMin?: number;
  patientScribeConsent?: boolean;
  scribeEnabled?: boolean;
  scribeStatus?: 'none' | 'processing' | 'done' | 'failed';
}

export interface PatientJoinResponse {
  token: string;
  wsUrl: string;
  roomName: string;
  needsConsent?: boolean;
  psychologistName?: string;
  patientName?: string;
}

export const videoApi = {
  /** Create an instant video room (no prior appointment needed) */
  createInstantRoom: (token: string, patientId?: string) =>
    apiClient.post<InstantRoomResponse>(
      '/video/instant',
      patientId ? { patientId } : {},
      token,
    ),

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
  recordConsent: (joinToken: string, includeScribe = false) =>
    apiClient.post<{ ok: boolean }>(`/video/consent/${joinToken}`, { includeScribe }),

  // ── Scribe IA (Pro + Clinic) ──
  /** Activer ou désactiver le Scribe IA pour cette séance */
  enableScribe: (appointmentId: string, enabled: boolean, token: string) =>
    apiClient.post<{ scribeEnabled: boolean }>(
      `/video/rooms/${appointmentId}/scribe/enable`,
      { enabled },
      token,
    ),

  /** Upload audio WebM pour transcription post-séance */
  uploadScribeAudio: async (appointmentId: string, audioBlob: Blob, token: string): Promise<{ status: string }> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.psylib.eu';
    const formData = new FormData();
    formData.append('audio', audioBlob, 'session.webm');
    const response = await fetch(`${baseUrl}/video/rooms/${appointmentId}/scribe/audio`, {
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

  /** Récupère le statut du Scribe IA pour cette séance */
  getScribeStatus: (appointmentId: string, token: string) =>
    apiClient.get<{ status: 'none' | 'processing' | 'done' | 'failed'; scribeEnabled: boolean }>(
      `/video/rooms/${appointmentId}/scribe/status`,
      token,
    ),

  // ── Guest invite / waiting room (psy) ──
  /** Generate (or fetch) a guest invite link for the current room */
  createGuestInvite: (appointmentId: string, token: string) =>
    apiClient.post<GuestInviteResponse>(`/video/rooms/${appointmentId}/invite`, {}, token),

  /** Revoke the guest invite link */
  revokeGuestInvite: (appointmentId: string, token: string) =>
    apiClient.post<{ ok: boolean }>(`/video/rooms/${appointmentId}/invite/revoke`, {}, token),

  /** List pending / admitted guests */
  listGuests: (appointmentId: string, token: string) =>
    apiClient.get<GuestInfo[]>(`/video/rooms/${appointmentId}/guests`, token),

  /** Admit a guest into the room */
  admitGuest: (guestId: string, token: string) =>
    apiClient.post<{ ok: boolean }>(`/video/guests/${guestId}/admit`, {}, token),

  /** Deny a waiting guest */
  denyGuest: (guestId: string, token: string) =>
    apiClient.post<{ ok: boolean }>(`/video/guests/${guestId}/deny`, {}, token),

  // ── Guest public flow (no auth) ──
  /** Validate a guest invite link */
  resolveGuestInvite: (inviteToken: string) =>
    apiClient.get<ResolveInviteResponse>(`/video/guest/${inviteToken}`),

  /** Request to join as a guest (creates a pending entry) */
  requestGuestJoin: (inviteToken: string, displayName: string) =>
    apiClient.post<GuestRequestResponse>(`/video/guest/${inviteToken}/request`, { displayName }),

  /** Poll guest admission status (returns a LiveKit token once admitted) */
  getGuestStatus: (sessionToken: string) =>
    apiClient.get<GuestStatusResponse>(`/video/guest/session/${sessionToken}/status`),
};

export interface GuestInviteResponse {
  inviteUrl: string;
}

export interface GuestInfo {
  id: string;
  displayName: string;
  status: 'pending' | 'admitted';
  createdAt: string;
  admittedAt: string | null;
}

export interface ResolveInviteResponse {
  valid: boolean;
  psychologistName: string;
}

export interface GuestRequestResponse {
  sessionToken: string;
}

export interface GuestStatusResponse {
  status: 'pending' | 'admitted' | 'denied' | 'ended';
  token?: string;
  wsUrl?: string;
  roomName?: string;
}

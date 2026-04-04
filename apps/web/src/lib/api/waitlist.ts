import { apiClient } from './client';

export type WaitlistUrgency = 'low' | 'medium' | 'high';
export type WaitlistStatus = 'waiting' | 'contacted' | 'scheduled' | 'removed';

export interface WaitlistPreferredSlots {
  mornings: boolean;
  afternoons: boolean;
  preferredDays: number[];
}

export interface WaitlistEntry {
  id: string;
  psychologistId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  consultationTypeId: string | null;
  urgency: WaitlistUrgency;
  preferredSlots: WaitlistPreferredSlots | null;
  note: string | null;
  status: WaitlistStatus;
  contactedAt: string | null;
  createdAt: string;
  consultationType?: { id: string; name: string } | null;
}

export interface CreateWaitlistEntryData {
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  consultationTypeId?: string;
  urgency?: WaitlistUrgency;
  preferredSlots?: WaitlistPreferredSlots;
  note?: string;
}

export const waitlistApi = {
  getAll: (token: string) =>
    apiClient.get<WaitlistEntry[]>('/waitlist', token),

  create: (data: CreateWaitlistEntryData, token: string) =>
    apiClient.post<WaitlistEntry>('/waitlist', data, token),

  updateStatus: (id: string, status: WaitlistStatus, token: string) =>
    apiClient.patch<WaitlistEntry>(`/waitlist/${id}/status`, { status }, token),

  remove: (id: string, token: string) =>
    apiClient.delete<void>(`/waitlist/${id}`, token),

  proposeSlot: (id: string, slotDate: string, token: string) =>
    apiClient.post<{ success: boolean }>(`/waitlist/${id}/propose-slot`, { slotDate }, token),

  // Public (no auth) — register from public booking page
  createPublic: (slug: string, data: CreateWaitlistEntryData) =>
    apiClient.post<WaitlistEntry>(`/public/psy/${slug}/waitlist`, data),
};

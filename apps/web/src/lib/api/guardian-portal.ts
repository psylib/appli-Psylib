import { apiClient } from './client';
import type { LegalGuardian, GuardianPermissions } from '@psyscale/shared-types';

// ---------- Types ----------

export interface MinorChild {
  patientId: string;
  name: string;
  birthDate: string | null;
  psychologistName: string;
  relationship: string;
  permissions: GuardianPermissions;
  guardianId: string;
}

export interface GuardianDashboard {
  patient: { name: string; birthDate: string | null };
  recentMoods: Array<{ mood: number; createdAt: string }>;
  exerciseSummary: { total: number; completed: number; inProgress: number };
  nextAppointment: { scheduledAt: string; psychologistName: string } | null;
}

export interface GuardianMoodEntry {
  mood: number;
  note?: string;
  createdAt: string;
}

// ---------- Guardian CRUD (psy-side) ----------

export const guardiansApi = {
  list: (patientId: string, token: string) =>
    apiClient.get<LegalGuardian[]>(`/patients/${patientId}/guardians`, token),

  create: (
    patientId: string,
    data: {
      name: string;
      email: string;
      phone?: string;
      relationship: string;
      isPrimary?: boolean;
      permissions?: Partial<GuardianPermissions>;
    },
    token: string,
  ) => apiClient.post<LegalGuardian>(`/patients/${patientId}/guardians`, data, token),

  update: (
    patientId: string,
    guardianId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      relationship: string;
      isPrimary: boolean;
      permissions: Partial<GuardianPermissions>;
    }>,
    token: string,
  ) => apiClient.put<LegalGuardian>(`/patients/${patientId}/guardians/${guardianId}`, data, token),

  remove: (patientId: string, guardianId: string, token: string) =>
    apiClient.delete<void>(`/patients/${patientId}/guardians/${guardianId}`, token),

  invite: (patientId: string, guardianId: string, token: string) =>
    apiClient.post<{ id: string; email: string; expiresAt: string }>(
      `/patients/${patientId}/guardians/${guardianId}/invite`,
      {},
      token,
    ),

  requestConsent: (
    patientId: string,
    guardianId: string,
    data: { consentType: string },
    token: string,
  ) =>
    apiClient.post<{ id: string; status: string }>(
      `/patients/${patientId}/guardians/${guardianId}/consent`,
      data,
      token,
    ),
};

// ---------- Guardian Portal API (guardian-side) ----------

export const guardianPortalApi = {
  getMinors: (token: string) =>
    apiClient.get<MinorChild[]>('/guardian-portal/minors', token),

  getDashboard: (patientId: string, token: string) =>
    apiClient.get<GuardianDashboard>(`/guardian-portal/minors/${patientId}/dashboard`, token),

  getMood: (patientId: string, token: string, days = 30) =>
    apiClient.get<GuardianMoodEntry[]>(`/guardian-portal/minors/${patientId}/mood?days=${days}`, token),

  getExercises: (patientId: string, token: string) =>
    apiClient.get<Array<Record<string, unknown>>>(`/guardian-portal/minors/${patientId}/exercises`, token),

  getJournal: (patientId: string, token: string) =>
    apiClient.get<Array<Record<string, unknown>>>(`/guardian-portal/minors/${patientId}/journal`, token),

  getDocuments: (patientId: string, token: string) =>
    apiClient.get<Array<Record<string, unknown>>>(`/guardian-portal/minors/${patientId}/documents`, token),

  getInvoices: (patientId: string, token: string) =>
    apiClient.get<Array<Record<string, unknown>>>(`/guardian-portal/minors/${patientId}/invoices`, token),
};

import { apiClient } from './client';

export interface MspTracking {
  id: string;
  psychologistId: string;
  patientId: string;
  year: number;
  sessionsUsed: number;
  maxSessions: number;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MspPatientTrackingResponse {
  tracking: MspTracking | null;
  quotaReached: boolean;
  nearQuota: boolean;
}

export interface MspOverviewEntry extends MspTracking {
  patient: { name: string; email: string | null };
}

export const mspApi = {
  getOverview: (token: string) =>
    apiClient.get<MspOverviewEntry[]>('/mon-soutien-psy/overview', token),

  getPatientTracking: (patientId: string, token: string) =>
    apiClient.get<MspPatientTrackingResponse>(
      `/mon-soutien-psy/patients/${patientId}`,
      token,
    ),

  getPatientHistory: (patientId: string, token: string) =>
    apiClient.get<MspTracking[]>(
      `/mon-soutien-psy/patients/${patientId}/history`,
      token,
    ),
};

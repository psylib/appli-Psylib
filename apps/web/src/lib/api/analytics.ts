import { apiClient } from './client';

// These match the actual backend response shapes from analytics.service.ts

export interface AnalyticsOverview {
  totalPatients: number;
  activePatients: number;
  totalSessions: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  avgSessionsPerPatient: number;
  portalAdoptionRate: number;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  sessions: number;
}

export interface PatientPoint {
  month: string;
  new: number;
  total: number;
}

export interface MoodTrend {
  week: string;
  avgMood: number;
  count: number;
}

export const analyticsApi = {
  getOverview: (token: string) =>
    apiClient.get<AnalyticsOverview>('/analytics/overview', token),

  getRevenue: (token: string, months = 6) =>
    apiClient.get<RevenuePoint[]>(`/analytics/revenue?months=${months}`, token),

  getPatientGrowth: (token: string, months = 6) =>
    apiClient.get<PatientPoint[]>(`/analytics/patients?months=${months}`, token),

  getMoodTrends: (token: string) =>
    apiClient.get<MoodTrend[]>('/analytics/mood-trends', token),
};

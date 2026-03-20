/**
 * Analytics hooks — revenue, patients, mood trends
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

interface RevenueData {
  month: string;
  amount: number;
}

interface PatientGrowth {
  month: string;
  count: number;
}

interface MoodTrend {
  week: string;
  avgMood: number;
}

interface AnalyticsOverview {
  totalRevenue: number;
  totalPatients: number;
  totalSessions: number;
  avgSessionsPerWeek: number;
}

export function useAnalyticsOverview() {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<AnalyticsOverview>('/analytics/overview', token ?? undefined);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useRevenueData() {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<RevenueData[]>('/analytics/revenue', token ?? undefined);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function usePatientGrowth() {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'patients'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<PatientGrowth[]>('/analytics/patients', token ?? undefined);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useMoodTrends() {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: ['analytics', 'mood-trends'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<MoodTrend[]>('/analytics/mood-trends', token ?? undefined);
    },
    staleTime: 1000 * 60 * 5,
  });
}

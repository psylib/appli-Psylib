/**
 * Dashboard hooks — KPIs, checklist, today's appointments
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

interface DashboardStats {
  activePatients: number;
  sessionsThisMonth: number;
  revenueThisMonth: number;
  upcomingAppointments: number;
}

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
}

interface TodayAppointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  patient: {
    id: string;
    name: string;
  };
  type?: string;
}

export function useDashboardStats() {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<DashboardStats>('/dashboard', token ?? undefined);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useDashboardChecklist() {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'checklist'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<ChecklistItem[]>('/dashboard/checklist', token ?? undefined);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useTodayAppointments() {
  const { getValidToken } = useAuth();
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  return useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<TodayAppointment[]>(
        `/appointments?from=${from}&to=${to}`,
        token ?? undefined,
      );
    },
    staleTime: 1000 * 60 * 1,
  });
}

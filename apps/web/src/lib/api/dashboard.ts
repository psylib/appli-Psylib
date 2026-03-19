import { apiClient } from './client';

export interface DashboardKpis {
  patients: { total: number; active: number; newThisMonth: number; trend: number };
  sessions: { totalThisMonth: number; totalLastMonth: number; trend: number };
  revenue: { thisMonth: number; lastMonth: number; trend: number };
  appointments: { upcoming: number; today: number };
  subscription: { plan: string; status: string; trialEndsAt: string | null; trialDaysLeft: number | null } | null;
}

export interface UpcomingAppointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  patient: { name: string; email: string | null };
}

export interface RecentSession {
  id: string;
  date: string;
  duration: number;
  type: string;
  paymentStatus: string;
  patient: { name: string };
}

export interface ActivationStep {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  href: string;
}

export interface ActivationChecklist {
  steps: ActivationStep[];
  completedCount: number;
  totalCount: number;
  allDone: boolean;
}

export const dashboardApi = {
  kpis: (token: string) => apiClient.get<DashboardKpis>('/dashboard', token),

  activationChecklist: (token: string) =>
    apiClient.get<ActivationChecklist>('/dashboard/checklist', token),

  upcomingAppointments: (token: string, limit = 5) => {
    const from = new Date().toISOString();
    return apiClient.get<UpcomingAppointment[]>(
      `/appointments?from=${encodeURIComponent(from)}&limit=${limit}`,
      token,
    );
  },

  recentSessions: (token: string, limit = 5) =>
    apiClient.get<{ data: RecentSession[]; total: number; page: number; limit: number; totalPages: number }>(
      `/sessions?limit=${limit}&page=1`,
      token,
    ),
};

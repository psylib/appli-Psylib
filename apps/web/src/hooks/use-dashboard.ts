'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { dashboardApi } from '@/lib/api/dashboard';
import { patientsApi } from '@/lib/api/patients';
import { sessionsApi } from '@/lib/api/sessions';
import { psychologistApi } from '@/lib/api/psychologist';
import type { ActivationChecklist } from '@/lib/api/dashboard';

export function useDashboardKpis() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => dashboardApi.kpis(token as string),
    enabled: !!token,
    staleTime: 60 * 1000, // 1min
  });
}

export function useUpcomingAppointments(limit = 5) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['dashboard', 'upcoming-appointments', limit],
    queryFn: () => dashboardApi.upcomingAppointments(token as string, limit),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

export function useRecentSessions(limit = 5) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['dashboard', 'recent-sessions', limit],
    queryFn: () => dashboardApi.recentSessions(token as string, limit),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

export function usePsychologistProfile() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['psychologist', 'profile'],
    queryFn: () => psychologistApi.getProfile(token as string),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatients(params: { page?: number; search?: string; status?: string; limit?: number } = {}) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.list({ limit: 20, ...params }, token as string),
    enabled: !!token,
  });
}

export function usePatient(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientsApi.get(id, token as string),
    enabled: !!token && !!id,
  });
}

export function usePatientAdmin(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['patients', id, 'admin'],
    queryFn: () => patientsApi.getAdmin(id, token as string),
    enabled: !!token && !!id,
  });
}

export function useSessions(params: { patientId?: string; page?: number; from?: string; to?: string } = {}) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => sessionsApi.list(params, token as string),
    enabled: !!token,
  });
}

export function useActivationChecklist() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery<ActivationChecklist>({
    queryKey: ['dashboard', 'activation-checklist'],
    queryFn: () => dashboardApi.activationChecklist(token as string),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSessionDetail(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => sessionsApi.get(id, token as string),
    enabled: !!token && !!id,
  });
}

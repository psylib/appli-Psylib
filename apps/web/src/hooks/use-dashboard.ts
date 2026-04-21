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
    queryFn: () => dashboardApi.kpis(token!),
    enabled: !!token,
    staleTime: 60 * 1000, // 1min
  });
}

export function useUpcomingAppointments(limit = 5) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['dashboard', 'upcoming-appointments', limit],
    queryFn: () => dashboardApi.upcomingAppointments(token!, limit),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

export function useRecentSessions(limit = 5) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['dashboard', 'recent-sessions', limit],
    queryFn: () => dashboardApi.recentSessions(token!, limit),
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

export function usePsychologistProfile() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['psychologist', 'profile'],
    queryFn: () => psychologistApi.getProfile(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatients(params: { page?: number; search?: string; status?: string } = {}) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => patientsApi.list({ limit: 20, ...params }, token!),
    enabled: !!token,
  });
}

export function usePatient(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['patients', id],
    queryFn: () => patientsApi.get(id, token!),
    enabled: !!token && !!id,
  });
}

export function useSessions(params: { patientId?: string; page?: number } = {}) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => sessionsApi.list(params, token!),
    enabled: !!token,
  });
}

export function useActivationChecklist() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery<ActivationChecklist>({
    queryKey: ['dashboard', 'activation-checklist'],
    queryFn: () => dashboardApi.activationChecklist(token!),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSessionDetail(id: string) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery({
    queryKey: ['sessions', id],
    queryFn: () => sessionsApi.get(id, token!),
    enabled: !!token && !!id,
  });
}

/**
 * useVideoRooms — React Query hooks pour les salles vidéo du jour
 * Endpoint: /video/*
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

export interface TodayRoom {
  appointmentId: string;
  patientName: string;
  scheduledAt: string;
  duration: number;
  status: 'upcoming' | 'ready' | 'patient_waiting' | 'active' | 'ended';
  roomId: string | null;
}

export interface VideoTokenResponse {
  token: string;
  wsUrl: string;
  roomName: string;
}

const VIDEO_KEY = 'video';

export function useTodayRooms() {
  const { getValidToken } = useAuth();

  return useQuery<TodayRoom[]>({
    queryKey: [VIDEO_KEY, 'today'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<TodayRoom[]>('/video/today', token ?? undefined);
    },
    staleTime: 1000 * 30, // 30s — refresh often for live status
    refetchInterval: 1000 * 60, // auto-refresh every minute
  });
}

export function useCreateRoom() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = await getValidToken();
      return apiClient.post<{ id: string; roomName: string; status: string }>(
        '/video/rooms',
        { appointmentId },
        token ?? undefined,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [VIDEO_KEY] });
    },
  });
}

export function useGetPsyToken() {
  const { getValidToken } = useAuth();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = await getValidToken();
      return apiClient.post<VideoTokenResponse>(
        `/video/rooms/${appointmentId}/token`,
        {},
        token ?? undefined,
      );
    },
  });
}

export function useEndRoom() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = await getValidToken();
      return apiClient.post<void>(
        `/video/rooms/${appointmentId}/end`,
        {},
        token ?? undefined,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [VIDEO_KEY] });
    },
  });
}

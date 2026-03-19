/**
 * useSessions — React Query hooks pour les séances
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';
import type {
  Session,
  PaginatedResponse,
  CreateSessionDto,
  UpdateSessionDto,
} from '@psyscale/shared-types';

const SESSIONS_KEY = 'sessions';

export function useSessions(page = 1, limit = 20, patientId?: string) {
  const { getValidToken } = useAuth();

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (patientId) params.set('patientId', patientId);

  return useQuery<PaginatedResponse<Session>>({
    queryKey: [SESSIONS_KEY, page, limit, patientId],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<PaginatedResponse<Session>>(
        `/sessions?${params.toString()}`,
        token ?? undefined,
      );
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useSession(id: string) {
  const { getValidToken } = useAuth();

  return useQuery<Session>({
    queryKey: [SESSIONS_KEY, id],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<Session>(`/sessions/${id}`, token ?? undefined);
    },
    enabled: id.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateSession() {
  const { getValidToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Session, Error, CreateSessionDto>({
    mutationFn: async (dto) => {
      const token = await getValidToken();
      return apiClient.post<Session>('/sessions', dto, token ?? undefined);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SESSIONS_KEY] });
    },
  });
}

export function useUpdateSession(id: string) {
  const { getValidToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Session, Error, UpdateSessionDto>({
    mutationFn: async (dto) => {
      const token = await getValidToken();
      return apiClient.patch<Session>(`/sessions/${id}`, dto, token ?? undefined);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Session>([SESSIONS_KEY, id], updated);
      void queryClient.invalidateQueries({ queryKey: [SESSIONS_KEY] });
    },
  });
}

export function useAutosaveNotes(sessionId: string) {
  const { getValidToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Session, Error, { notes: string; mood?: number | null }>({
    mutationFn: async ({ notes, mood }) => {
      const token = await getValidToken();
      const body: UpdateSessionDto = { notes };
      // Le mood n'est pas dans UpdateSessionDto standard — on l'inclut si fourni
      const payload = mood != null ? { ...body, mood } : body;
      return apiClient.patch<Session>(`/sessions/${sessionId}`, payload, token ?? undefined);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Session>([SESSIONS_KEY, sessionId], updated);
    },
  });
}

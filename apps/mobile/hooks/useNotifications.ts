/**
 * Notifications hooks — list, badge count, mark read
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

const NOTIFS_KEY = 'notifications';

export function useNotificationsList() {
  const { getValidToken } = useAuth();

  return useQuery({
    queryKey: [NOTIFS_KEY],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<Notification[]>('/notifications', token ?? undefined);
    },
    staleTime: 1000 * 30,
  });
}

export function useUnreadCount() {
  const { data } = useNotificationsList();
  return data?.filter((n) => !n.readAt).length ?? 0;
}

export function useMarkNotificationRead() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getValidToken();
      return apiClient.patch<Notification>(
        `/notifications/${id}`,
        { readAt: new Date().toISOString() },
        token ?? undefined,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [NOTIFS_KEY] });
    },
  });
}

export function useMarkAllRead() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = await getValidToken();
      return apiClient.post<void>('/notifications/read-all', {}, token ?? undefined);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [NOTIFS_KEY] });
    },
  });
}

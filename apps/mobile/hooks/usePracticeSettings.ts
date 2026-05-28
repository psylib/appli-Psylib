import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

interface PracticeProfile {
  bookingConfirmationMessage?: string | null;
}

interface CalendarStatus {
  connected: boolean;
  email?: string | null;
}

const PRACTICE_KEY = 'practice';

export function usePracticeProfile() {
  const { getValidToken } = useAuth();
  return useQuery<PracticeProfile>({
    queryKey: [PRACTICE_KEY, 'profile'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<PracticeProfile>('/onboarding/profile', token ?? undefined);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdatePracticeProfile() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PracticeProfile>) => {
      const token = await getValidToken();
      return apiClient.put<PracticeProfile>('/onboarding/profile', data, token ?? undefined);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: [PRACTICE_KEY] }),
  });
}

export function useCalendarStatus() {
  const { getValidToken } = useAuth();
  return useQuery<CalendarStatus>({
    queryKey: [PRACTICE_KEY, 'calendar'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<CalendarStatus>('/calendar-sync/status', token ?? undefined);
    },
    staleTime: 1000 * 60 * 2,
  });
}

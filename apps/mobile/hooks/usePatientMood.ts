/**
 * Patient Mood hooks — POST/GET mood tracking
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { usePatientAuth } from './usePatientAuth';

interface MoodEntry {
  id: string;
  patientId: string;
  mood: number;
  note: string | null;
  createdAt: string;
}

export function usePatientMoodHistory() {
  const { token } = usePatientAuth();

  return useQuery({
    queryKey: ['patient', 'mood'],
    queryFn: () => apiClient.get<MoodEntry[]>('/patient-portal/mood', token ?? undefined),
    enabled: !!token,
  });
}

export function useSubmitMood() {
  const { token } = usePatientAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { mood: number; note?: string }) =>
      apiClient.post<MoodEntry>('/patient-portal/mood', data, token ?? undefined),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', 'mood'] });
    },
  });
}

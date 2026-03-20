/**
 * Patient Exercises hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { usePatientAuth } from './usePatientAuth';

interface Exercise {
  id: string;
  patientId: string;
  title: string;
  description: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'skipped';
  createdByAi: boolean;
  dueDate: string | null;
  completedAt: string | null;
  patientFeedback: string | null;
}

export function usePatientExercises() {
  const { token } = usePatientAuth();

  return useQuery({
    queryKey: ['patient', 'exercises'],
    queryFn: () => apiClient.get<Exercise[]>('/patient-portal/exercises', token ?? undefined),
    enabled: !!token,
  });
}

export function useUpdateExercise() {
  const { token } = usePatientAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string; patientFeedback?: string }) =>
      apiClient.patch<Exercise>(`/patient-portal/exercises/${id}`, data, token ?? undefined),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', 'exercises'] });
    },
  });
}

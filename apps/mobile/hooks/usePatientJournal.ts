/**
 * Patient Journal hooks — CRUD encrypted journal entries
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { usePatientAuth } from './usePatientAuth';

interface JournalEntry {
  id: string;
  patientId: string;
  content: string;
  mood: number | null;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
}

interface CreateJournalDto {
  content: string;
  mood?: number;
  tags?: string[];
  isPrivate?: boolean;
}

export function usePatientJournal() {
  const { token } = usePatientAuth();

  return useQuery({
    queryKey: ['patient', 'journal'],
    queryFn: () => apiClient.get<JournalEntry[]>('/patient-portal/journal', token ?? undefined),
    enabled: !!token,
  });
}

export function useJournalEntry(id: string) {
  const { token } = usePatientAuth();

  return useQuery({
    queryKey: ['patient', 'journal', id],
    queryFn: () => apiClient.get<JournalEntry>(`/patient-portal/journal/${id}`, token ?? undefined),
    enabled: !!token && id.length > 0,
  });
}

export function useCreateJournalEntry() {
  const { token } = usePatientAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJournalDto) =>
      apiClient.post<JournalEntry>('/patient-portal/journal', data, token ?? undefined),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient', 'journal'] });
    },
  });
}

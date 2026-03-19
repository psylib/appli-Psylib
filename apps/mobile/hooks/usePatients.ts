/**
 * usePatients — React Query hooks pour les patients
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';
import type {
  Patient,
  PaginatedResponse,
  CreatePatientDto,
  UpdatePatientDto,
} from '@psyscale/shared-types';

const PATIENTS_KEY = 'patients';

export function usePatients(page = 1, limit = 20) {
  const { getValidToken } = useAuth();

  return useQuery<PaginatedResponse<Patient>>({
    queryKey: [PATIENTS_KEY, page, limit],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<PaginatedResponse<Patient>>(
        `/patients?page=${page}&limit=${limit}`,
        token ?? undefined,
      );
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function usePatient(id: string) {
  const { getValidToken } = useAuth();

  return useQuery<Patient>({
    queryKey: [PATIENTS_KEY, id],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<Patient>(`/patients/${id}`, token ?? undefined);
    },
    enabled: id.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreatePatient() {
  const { getValidToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, CreatePatientDto>({
    mutationFn: async (dto) => {
      const token = await getValidToken();
      return apiClient.post<Patient>('/patients', dto, token ?? undefined);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
  });
}

export function useUpdatePatient(id: string) {
  const { getValidToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, UpdatePatientDto>({
    mutationFn: async (dto) => {
      const token = await getValidToken();
      return apiClient.patch<Patient>(`/patients/${id}`, dto, token ?? undefined);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Patient>([PATIENTS_KEY, id], updated);
      void queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
  });
}

export function useDeletePatient() {
  const { getValidToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const token = await getValidToken();
      return apiClient.delete<void>(`/patients/${id}`, token ?? undefined);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PATIENTS_KEY] });
    },
  });
}

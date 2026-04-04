import { apiClient } from './client';

export interface ConsultationType {
  id: string;
  name: string;
  duration: number;
  rate: number;
  color: string;
  category: 'standard' | 'mon_soutien_psy';
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsultationTypeData {
  name: string;
  duration: number;
  rate: number;
  color?: string;
  category?: 'standard' | 'mon_soutien_psy';
  isPublic?: boolean;
}

export interface UpdateConsultationTypeData {
  name?: string;
  duration?: number;
  rate?: number;
  color?: string;
  category?: 'standard' | 'mon_soutien_psy';
  isPublic?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export const consultationTypesApi = {
  getAll: (token: string) =>
    apiClient.get<ConsultationType[]>('/consultation-types', token),

  create: (data: CreateConsultationTypeData, token: string) =>
    apiClient.post<ConsultationType>('/consultation-types', data, token),

  update: (id: string, data: UpdateConsultationTypeData, token: string) =>
    apiClient.put<ConsultationType>(`/consultation-types/${id}`, data, token),

  deactivate: (id: string, token: string) =>
    apiClient.patch<ConsultationType>(`/consultation-types/${id}/deactivate`, {}, token),
};

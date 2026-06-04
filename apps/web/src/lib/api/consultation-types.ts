import { apiClient } from './client';

export type ConsultationModalityValue = 'in_person' | 'online' | 'home_visit' | 'any';

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
  modality: ConsultationModalityValue;
  location: string | null;
  instructions: string | null;
  allowedPaymentModes: string | null;
  cancellationDelay: number | null;
  requireImprint: boolean;
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
  modality?: ConsultationModalityValue;
  location?: string;
  instructions?: string;
  allowedPaymentModes?: string;
  cancellationDelay?: number | null;
  requireImprint?: boolean;
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
  modality?: ConsultationModalityValue;
  location?: string;
  instructions?: string;
  allowedPaymentModes?: string | null;
  cancellationDelay?: number | null;
  requireImprint?: boolean;
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

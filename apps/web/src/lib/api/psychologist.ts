import { apiClient } from './client';

export interface PsychologistProfile {
  id: string;
  name: string;
  slug: string | null;
  specialization: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  adeliNumber: string | null;
  isOnboarded: boolean;
  createdAt: string;
}

export interface UpdateProfileData {
  name: string;
  specialization?: string;
  bio?: string;
  phone?: string;
  address?: string;
  adeliNumber?: string;
}

export const psychologistApi = {
  getProfile: (token: string) =>
    apiClient.get<PsychologistProfile>('/onboarding/profile', token),

  updateProfile: (data: UpdateProfileData, token: string) =>
    apiClient.put<PsychologistProfile>('/onboarding/profile', data, token),
};

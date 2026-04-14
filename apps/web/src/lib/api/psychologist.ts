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
  // Practice settings
  defaultSessionRate: number | null;
  defaultSessionDuration: number | null;
  // Reminder settings
  reminderDelay: number;
  reminderEmailEnabled: boolean;
  reminderSmsEnabled: boolean;
  reminderTemplate: string | null;
  // Payment settings
  allowOnlinePayment: boolean;
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  // MSP
  acceptsMonSoutienPsy: boolean;
  // Auto-invoice settings
  autoInvoice: boolean;
  autoInvoiceEmail: boolean;
}

export interface UpdateProfileData {
  name?: string;
  specialization?: string;
  bio?: string;
  phone?: string;
  address?: string;
  adeliNumber?: string;
  // Practice settings
  defaultSessionRate?: number;
  defaultSessionDuration?: number;
  // Reminder settings
  reminderDelay?: number;
  reminderEmailEnabled?: boolean;
  reminderSmsEnabled?: boolean;
  reminderTemplate?: string;
  // Payment settings
  allowOnlinePayment?: boolean;
  // MSP
  acceptsMonSoutienPsy?: boolean;
  // Auto-invoice settings
  autoInvoice?: boolean;
  autoInvoiceEmail?: boolean;
}

export const psychologistApi = {
  getProfile: (token: string) =>
    apiClient.get<PsychologistProfile>('/onboarding/profile', token),

  updateProfile: (data: UpdateProfileData, token: string) =>
    apiClient.put<PsychologistProfile>('/onboarding/profile', data, token),
};

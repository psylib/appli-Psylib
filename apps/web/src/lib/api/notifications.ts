import { apiClient } from './client';

export type NotificationPreferences = Record<string, { email: boolean; push: boolean }>;

export const notificationsApi = {
  getPreferences: (token: string) =>
    apiClient.get<NotificationPreferences>('/notifications/preferences', token),

  savePreferences: (preferences: NotificationPreferences, token: string) =>
    apiClient.put<{ success: boolean }>('/notifications/preferences', preferences, token),
};

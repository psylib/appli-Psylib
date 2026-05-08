import { apiClient } from './client';

export interface CalendarSyncStatus {
  connected: boolean;
  email: string | null;
  lastSyncAt: string | null;
  isActive: boolean;
}

export const calendarSyncApi = {
  getAuthUrl: (token: string) =>
    apiClient.get<{ url: string }>('/calendar-sync/google/auth', token),

  getStatus: (token: string) =>
    apiClient.get<CalendarSyncStatus>('/calendar-sync/status', token),

  disconnect: (token: string) =>
    apiClient.delete<{ success: boolean }>('/calendar-sync/disconnect', token),

  forceSync: (token: string) =>
    apiClient.post<{ success: boolean }>('/calendar-sync/force-sync', {}, token),
};

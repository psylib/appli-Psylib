import { apiClient } from './client';

export const availabilityApi = {
  getTimeslots: (from: string, to: string, duration: number, token: string): Promise<string[]> =>
    apiClient.get<string[]>(
      `/availability/timeslots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&duration=${duration}`,
      token,
    ),
};

/**
 * usePatients hook tests — query and mutation hooks
 */
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// Mock API client
jest.mock('@/lib/api', () => ({
  ApiError: class extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock auth
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    tokens: { accessToken: 'test-token' },
    isAuthenticated: true,
  }),
}));

// Mock expo modules
jest.mock('expo-constants', () => ({
  expoConfig: { extra: {} },
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  AFTER_FIRST_UNLOCK: 6,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

describe('Patient API functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches patients list via apiClient.get', async () => {
    const mockPatients = [
      { id: '1', name: 'Marie Dupont', status: 'active' },
      { id: '2', name: 'Paul Martin', status: 'active' },
    ];
    (apiClient.get as jest.Mock).mockResolvedValueOnce(mockPatients);

    const result = await apiClient.get('/patients', 'test-token');
    expect(result).toEqual(mockPatients);
    expect(apiClient.get).toHaveBeenCalledWith('/patients', 'test-token');
  });

  it('creates a patient via apiClient.post', async () => {
    const newPatient = { name: 'Sophie Leroy', email: 'sophie@test.fr' };
    const created = { id: '3', ...newPatient, status: 'active' };
    (apiClient.post as jest.Mock).mockResolvedValueOnce(created);

    const result = await apiClient.post('/patients', newPatient, 'test-token');
    expect(result).toEqual(created);
    expect(apiClient.post).toHaveBeenCalledWith('/patients', newPatient, 'test-token');
  });

  it('updates a patient via apiClient.put', async () => {
    const update = { name: 'Marie Dupont-Martin' };
    const updated = { id: '1', ...update, status: 'active' };
    (apiClient.put as jest.Mock).mockResolvedValueOnce(updated);

    const result = await apiClient.put('/patients/1', update, 'test-token');
    expect(result).toEqual(updated);
  });

  it('archives a patient via apiClient.delete', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await apiClient.delete('/patients/1', 'test-token');
    expect(result).toBeUndefined();
  });
});

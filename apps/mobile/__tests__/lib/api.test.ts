/**
 * API Client tests — error handling, timeouts, auth headers
 */
import { ApiError, apiClient } from '@/lib/api';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      apiBaseUrl: 'http://test-api.local',
    },
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('apiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('GET requests', () => {
    it('makes GET request with correct URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await apiClient.get('/patients');
      expect(result).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.local/api/v1/patients',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('includes Authorization header when token provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/patients', 'my-token');
      const call = mockFetch.mock.calls[0];
      expect(call?.[1]?.headers).toEqual(
        expect.objectContaining({ Authorization: 'Bearer my-token' }),
      );
    });

    it('omits Authorization header when no token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await apiClient.get('/patients');
      const call = mockFetch.mock.calls[0];
      expect(call?.[1]?.headers?.Authorization).toBeUndefined();
    });
  });

  describe('POST requests', () => {
    it('sends JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: '1' }),
      });

      const body = { name: 'Test Patient' };
      await apiClient.post('/patients', body, 'token');
      const call = mockFetch.mock.calls[0];
      expect(call?.[1]?.body).toBe(JSON.stringify(body));
    });
  });

  describe('Error handling', () => {
    it('throws ApiError on 4xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Patient not found' }),
      });

      await expect(apiClient.get('/patients/999')).rejects.toThrow(ApiError);
      await expect(apiClient.get('/patients/999').catch((e) => e)).resolves.toMatchObject({
        statusCode: 404,
        message: 'Patient not found',
      });
    });

    it('throws ApiError on 5xx responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      await expect(apiClient.get('/health')).rejects.toThrow(ApiError);
    });

    it('throws network error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

      await expect(apiClient.get('/health')).rejects.toThrow(ApiError);
      await expect(apiClient.get('/health').catch((e) => e)).resolves.toMatchObject({
        statusCode: 0,
      });
    });

    it('handles 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete('/patients/1', 'token');
      expect(result).toBeUndefined();
    });
  });
});

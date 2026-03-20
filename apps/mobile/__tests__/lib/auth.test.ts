/**
 * Auth module tests — token management, expiry, persistence
 */
import { isTokenExpired, loadStoredTokens } from '@/lib/auth';
import { storage } from '@/lib/storage';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  AFTER_FIRST_UNLOCK: 6,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('isTokenExpired', () => {
  it('returns false when token is not expired', () => {
    const expiresAt = Date.now() + 600_000; // 10 minutes from now
    expect(isTokenExpired(expiresAt)).toBe(false);
  });

  it('returns true when token is expired', () => {
    const expiresAt = Date.now() - 1000; // 1 second ago
    expect(isTokenExpired(expiresAt)).toBe(true);
  });

  it('returns true within 60s safety margin', () => {
    const expiresAt = Date.now() + 30_000; // 30 seconds from now (within 60s margin)
    expect(isTokenExpired(expiresAt)).toBe(true);
  });

  it('returns false at exactly 61s before expiry', () => {
    const expiresAt = Date.now() + 61_000;
    expect(isTokenExpired(expiresAt)).toBe(false);
  });
});

describe('loadStoredTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no access token stored', async () => {
    jest.spyOn(storage, 'getAccessToken').mockResolvedValue(null);
    jest.spyOn(storage, 'getRefreshToken').mockResolvedValue(null);
    jest.spyOn(storage, 'getTokenExpiry').mockResolvedValue(null);
    jest.spyOn(storage, 'getIdToken').mockResolvedValue(null);

    const result = await loadStoredTokens();
    expect(result).toBeNull();
  });

  it('returns token set when access token exists', async () => {
    const expiry = Date.now() + 600_000;
    jest.spyOn(storage, 'getAccessToken').mockResolvedValue('mock-access');
    jest.spyOn(storage, 'getRefreshToken').mockResolvedValue('mock-refresh');
    jest.spyOn(storage, 'getTokenExpiry').mockResolvedValue(expiry);
    jest.spyOn(storage, 'getIdToken').mockResolvedValue('mock-id');

    const result = await loadStoredTokens();
    expect(result).toEqual({
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh',
      idToken: 'mock-id',
      expiresAt: expiry,
    });
  });

  it('handles missing optional tokens', async () => {
    jest.spyOn(storage, 'getAccessToken').mockResolvedValue('mock-access');
    jest.spyOn(storage, 'getRefreshToken').mockResolvedValue(null);
    jest.spyOn(storage, 'getTokenExpiry').mockResolvedValue(null);
    jest.spyOn(storage, 'getIdToken').mockResolvedValue(null);

    const result = await loadStoredTokens();
    expect(result).toEqual({
      accessToken: 'mock-access',
      refreshToken: null,
      idToken: null,
      expiresAt: 0,
    });
  });
});

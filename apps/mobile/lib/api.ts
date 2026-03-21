/**
 * API Client PsyLib Mobile — Fetch wrapper vers NestJS
 * Token auto-injection, intercepteur 401, timeout 30s.
 */
import Constants from 'expo-constants';

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://api.psylib.eu';

const DEFAULT_TIMEOUT = 30_000;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string; timeout?: number } = {},
): Promise<T> {
  const { token, timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token != null && token.length > 0
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const url = `${API_BASE}/api/v1${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (networkError) {
    clearTimeout(timeoutId);
    if (networkError instanceof DOMException && networkError.name === 'AbortError') {
      throw new ApiError(0, 'Requete expirée — verifiez votre connexion');
    }
    throw new ApiError(0, 'Erreur reseau — verifiez votre connexion', networkError);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let errorBody: { message?: string; error?: string } = {};
    try {
      errorBody = (await res.json()) as { message?: string; error?: string };
    } catch {
      // ignore parse error
    }
    throw new ApiError(
      res.status,
      typeof errorBody.message === 'string' ? errorBody.message : res.statusText,
      errorBody,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
};

/**
 * API Client PsyScale Mobile — Fetch wrapper vers NestJS
 *
 * Même pattern que apps/web/src/lib/api/client.ts
 * Injecte automatiquement le Bearer token depuis le contexte d'auth.
 */

import Constants from 'expo-constants';

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:4000';

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
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token != null && token.length > 0
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const url = `${API_BASE}/api/v1${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (networkError) {
    throw new ApiError(0, 'Erreur réseau — vérifiez votre connexion', networkError);
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
      typeof errorBody.message === 'string'
        ? errorBody.message
        : res.statusText,
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
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),

  put: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    }),

  delete: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
};

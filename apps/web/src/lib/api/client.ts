/**
 * Client API PsyLib — Fetch wrapper vers NestJS
 *
 * Injecte automatiquement le Bearer token depuis la session next-auth.
 * Gestion des erreurs structurées.
 */

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

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
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(fetchOptions.headers as Record<string, string>),
  };

  const url = `${API_BASE}/api/v1${path}`;

  const res = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    let errorBody: { message?: string; error?: string } = {};
    try {
      errorBody = await res.json() as { message?: string; error?: string };
    } catch {
      // ignore parse error
    }
    throw new ApiError(
      res.status,
      (typeof errorBody.message === 'string' ? errorBody.message : null) ?? res.statusText,
      errorBody,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Helper: déclenche un téléchargement de fichier depuis l'API
export async function downloadFile(
  path: string,
  filename: string,
  token?: string,
): Promise<void> {
  const url = `${API_BASE}/api/v1${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error(`Export échoué (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
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

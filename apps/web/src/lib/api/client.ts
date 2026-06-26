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

/**
 * Session expirée → reconnexion propre.
 *
 * Quand l'API renvoie 401, le token (next-auth) est invalide/expiré et le
 * refresh silencieux a échoué : `session.accessToken` est vide. Sans ça, l'UI
 * continue de tourner avec un token mort et chaque action affiche un message
 * trompeur ("Erreur lors de la sauvegarde"). On purge la session périmée et on
 * redirige vers le login avec un message clair plutôt que de laisser
 * l'utilisateur coincé. (Cause de l'incident "authentification requise" psy.)
 */
let authRedirecting = false;
function handleSessionExpired(): void {
  if (typeof window === 'undefined') return; // SSR : laisser remonter l'ApiError
  if (authRedirecting) return;

  const { pathname } = window.location;
  // Déjà sur une page de login → ne pas boucler
  if (pathname.startsWith('/login') || pathname.includes('/login')) return;

  authRedirecting = true;
  const loginPath = pathname.startsWith('/patient')
    ? '/patient/login?expired=1'
    : '/login?expired=1';

  // Purge la session next-auth périmée (sinon le cookie ramène sur le dashboard
  // avec un token vide → boucle), puis redirige.
  import('next-auth/react')
    .then(({ signOut }) => signOut({ redirect: false }))
    .catch(() => {})
    .finally(() => {
      window.location.href = loginPath;
    });
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
    // Session expirée : déclencher la reconnexion propre (cause de l'incident
    // "authentification requise" / "erreur lors de la sauvegarde").
    if (res.status === 401) {
      handleSessionExpired();
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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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

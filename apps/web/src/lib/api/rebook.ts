const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) msg = body.message;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export interface RebookInfo {
  psychologistName: string;
  currentDate: string;
  slots: string[];
}

export async function fetchRebook(token: string): Promise<RebookInfo> {
  return publicFetch<RebookInfo>(`/public/rebook/${encodeURIComponent(token)}`, {
    cache: 'no-store',
  });
}

export async function moveRebook(
  token: string,
  newSlot: string,
): Promise<{ success: boolean; scheduledAt: string }> {
  return publicFetch<{ success: boolean; scheduledAt: string }>(
    `/public/rebook/${encodeURIComponent(token)}`,
    {
      method: 'POST',
      body: JSON.stringify({ newSlot }),
    },
  );
}

export async function unsubscribeRebook(token: string): Promise<{ success: boolean }> {
  return publicFetch<{ success: boolean }>(
    `/public/rebook/${encodeURIComponent(token)}/unsubscribe`,
    { cache: 'no-store' },
  );
}

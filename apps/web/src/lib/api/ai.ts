/**
 * Client IA PsyLib — streaming SSE vers NestJS /ai/session-summary
 *
 * Format SSE reçu :
 *   data: {"text": "chunk"}\n\n   (fragments de texte)
 *   data: {"error": "message"}\n\n (erreur IA)
 *   data: [DONE]\n\n               (fin du stream)
 */

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface AiStreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamSessionSummary(
  params: { rawNotes: string; context?: string; sessionId: string },
  token: string,
  callbacks: AiStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}/api/v1/ai/session-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
      signal,
    });
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') return;
    callbacks.onError('Impossible de joindre le serveur IA');
    return;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({})) as { message?: string };
    callbacks.onError(
      typeof errorBody.message === 'string'
        ? errorBody.message
        : `Erreur ${res.status}`,
    );
    return;
  }

  if (!res.body) {
    callbacks.onError('Streaming non supporté par ce navigateur');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string };
          if (parsed.error) {
            callbacks.onError(parsed.error);
            return;
          }
          if (parsed.text) {
            callbacks.onChunk(parsed.text);
          }
        } catch { /* ignore parse errors on malformed chunks */ }
      }
    }
  } finally {
    reader.releaseLock();
  }

  callbacks.onDone();
}

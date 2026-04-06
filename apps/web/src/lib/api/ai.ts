/**
 * Client IA PsyLib — streaming SSE vers NestJS /ai/session-summary
 *
 * Format SSE reçu :
 *   data: {"text": "chunk"}\n\n                        (fragments de texte)
 *   data: {"type":"structured","data":{...}}\n\n        (extraction structurée)
 *   data: {"type":"structured_error"}\n\n               (extraction échouée)
 *   data: {"error": "message"}\n\n                      (erreur IA)
 *   data: [DONE]\n\n                                    (fin du stream)
 */

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export interface StructuredSummaryData {
  tags: string[];
  evolution: 'progress' | 'stable' | 'regression' | 'mixed';
  alertLevel: 'none' | 'low' | 'medium' | 'high';
  alertReason: string | null;
  keyThemes: string[];
  model?: string;
}

export interface AiStreamCallbacks {
  onChunk: (text: string) => void;
  onStructuredData?: (data: StructuredSummaryData) => void;
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

  let doneEmitted = false;

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
          doneEmitted = true;
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data) as {
            text?: string;
            error?: string;
            type?: string;
            data?: StructuredSummaryData;
          };

          if (parsed.type === 'structured' && parsed.data) {
            callbacks.onStructuredData?.(parsed.data);
          } else if (parsed.type === 'structured_error') {
            // Extraction failed — frontend handles gracefully
          } else if (parsed.error) {
            callbacks.onError(parsed.error);
            return;
          } else if (parsed.text) {
            callbacks.onChunk(parsed.text);
          }
        } catch { /* ignore parse errors on malformed chunks */ }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!doneEmitted) callbacks.onDone();
}

export interface GenerateExerciseParams {
  patientContext: string;
  theme: string;
  exerciseType: 'breathing' | 'journaling' | 'exposure' | 'mindfulness' | 'cognitive';
}

export interface GeneratedExercise {
  title: string;
  description: string;
  instructions: string[];
  duration: string;
  frequency: string;
  disclaimer: string;
}

export async function generateExercise(
  params: GenerateExerciseParams,
  token: string,
): Promise<GeneratedExercise> {
  const res = await fetch(`${API_BASE}/api/v1/ai/generate-exercise`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Erreur ${res.status}`);
  }

  return res.json() as Promise<GeneratedExercise>;
}

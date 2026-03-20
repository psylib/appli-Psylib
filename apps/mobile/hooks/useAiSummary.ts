/**
 * AI Summary hook — POST /ai/session-summary (SSE streaming via fetch)
 */
import { useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { useAuth } from './useAuth';

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:4000';

interface AiSummaryResult {
  summary: string;
  isStreaming: boolean;
  error: string | null;
  generate: (sessionId: string) => Promise<void>;
  reset: () => void;
}

export function useAiSummary(): AiSummaryResult {
  const { getValidToken } = useAuth();
  const [summary, setSummary] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (sessionId: string) => {
      setIsStreaming(true);
      setError(null);
      setSummary('');

      const token = await getValidToken();
      if (!token) {
        setError('Non authentifie');
        setIsStreaming(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/v1/ai/session-summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(err || `HTTP ${response.status}`);
        }

        if (!response.body) {
          // Non-streaming fallback
          const json = (await response.json()) as { summary: string };
          setSummary(json.summary);
          setIsStreaming(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE format: "data: ..."
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data) as { text?: string; content?: string };
                const text = parsed.text ?? parsed.content ?? '';
                fullText += text;
                setSummary(fullText);
              } catch {
                // Plain text chunk
                fullText += data;
                setSummary(fullText);
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur IA');
      } finally {
        setIsStreaming(false);
      }
    },
    [getValidToken],
  );

  const reset = useCallback(() => {
    setSummary('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return { summary, isStreaming, error, generate, reset };
}

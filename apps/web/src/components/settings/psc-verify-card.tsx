'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';

type PscResult =
  | 'success'
  | 'mismatch'
  | 'not_psychologist'
  | 'error'
  | null;

const RESULT_MESSAGES: Record<
  Exclude<PscResult, null>,
  { tone: 'success' | 'error'; text: string }
> = {
  success: {
    tone: 'success',
    text: 'Identité vérifiée avec Pro Santé Connect ✅ Votre profil public est actif.',
  },
  mismatch: {
    tone: 'error',
    text: 'Le numéro renvoyé par Pro Santé Connect ne correspond pas. Notre équipe va vérifier manuellement.',
  },
  not_psychologist: {
    tone: 'error',
    text: 'Le compte Pro Santé Connect utilisé n’est pas enregistré comme psychologue.',
  },
  error: {
    tone: 'error',
    text: 'La vérification Pro Santé Connect a échoué. Réessayez plus tard.',
  },
};

export function PscVerifyCard() {
  const session = useSession();
  const token = session.data?.accessToken;
  const searchParams = useSearchParams();
  const [result, setResult] = useState<PscResult>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const psc = searchParams.get('psc') as PscResult;
    if (psc && psc in RESULT_MESSAGES) setResult(psc);
  }, [searchParams]);

  const { data: status } = useQuery<{ enabled: boolean }, ApiError>({
    queryKey: ['psc-status'],
    queryFn: () => apiClient.get<{ enabled: boolean }>('/auth/psc/status'),
    staleTime: 5 * 60 * 1000,
  });

  // Masqué tant que Pro Santé Connect n'est pas activé côté serveur.
  if (!status?.enabled) return null;

  const handleStart = async () => {
    if (!token) return;
    setStarting(true);
    try {
      const { url } = await apiClient.get<{ url: string }>(
        '/auth/psc/start',
        token,
      );
      window.location.href = url;
    } catch {
      setResult('error');
      setStarting(false);
    }
  };

  const verified = result === 'success';

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">
            Vérification d&apos;identité (Pro Santé Connect)
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Authentifiez-vous avec votre e-CPS pour activer immédiatement votre
            profil public. C&apos;est la vérification la plus sûre, reconnue par
            l&apos;État.
          </p>

          {result && (
            <p
              role="status"
              className={`mt-3 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg px-3 py-2 ${
                RESULT_MESSAGES[result].tone === 'success'
                  ? 'bg-accent/10 text-accent'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {RESULT_MESSAGES[result].tone === 'success' ? (
                <CheckCircle2 size={15} aria-hidden />
              ) : (
                <AlertTriangle size={15} aria-hidden />
              )}
              {RESULT_MESSAGES[result].text}
            </p>
          )}

          {!verified && (
            <button
              type="button"
              onClick={handleStart}
              disabled={starting || !token}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {starting ? (
                <Loader2 size={16} className="animate-spin" aria-hidden />
              ) : (
                <ShieldCheck size={16} aria-hidden />
              )}
              Vérifier avec Pro Santé Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

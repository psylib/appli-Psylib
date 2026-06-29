'use client';

import { useState, useRef, useId } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Upload, Loader2, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { sessionsApi } from '@/lib/api/sessions';
import { useSubscriptionPlan } from '@/hooks/use-subscription';

const MAX_BYTES = 25 * 1024 * 1024;

interface ScribeAudioImportProps {
  sessionId: string;
  /** Statut initial connu de la séance (évite un flash avant le 1er poll). */
  initialStatus?: 'none' | 'processing' | 'done' | 'failed';
  /** Appelé quand la note IA est prête (pour rafraîchir la fiche séance). */
  onDone?: () => void;
}

export function ScribeAudioImport({ sessionId, initialStatus = 'none', onDone }: ScribeAudioImportProps) {
  const { data: authSession } = useSession();
  const token = authSession?.accessToken ?? '';
  const queryClient = useQueryClient();
  const { isPro, isLoading: planLoading } = useSubscriptionPlan();

  const consentId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll du statut tant qu'une transcription est en cours.
  const { data: statusData } = useQuery({
    queryKey: ['session-scribe-status', sessionId],
    queryFn: () => sessionsApi.getScribeStatus(sessionId, token),
    enabled: !!token && isPro,
    initialData: { status: initialStatus, hasNote: false },
    refetchInterval: (query) => (query.state.data?.status === 'processing' ? 4000 : false),
  });

  const status = statusData?.status ?? initialStatus;
  const isProcessing = status === 'processing';

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Aucun fichier sélectionné');
      return sessionsApi.uploadScribeAudio(sessionId, file, consent, token);
    },
    onSuccess: () => {
      setError(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Bascule en "processing" + relance le polling.
      void queryClient.invalidateQueries({ queryKey: ['session-scribe-status', sessionId] });
    },
    onError: (e: Error) => setError(e.message || 'Échec de l’import'),
  });

  // Détecte la fin de traitement → rafraîchit la fiche séance.
  const prevStatus = useRef(status);
  if (prevStatus.current === 'processing' && status === 'done') {
    onDone?.();
  }
  prevStatus.current = status;

  if (planLoading) return null;

  // Gate Pro/Clinic : on affiche un appel à l'upgrade plutôt que rien.
  if (!isPro) {
    return (
      <div className="rounded-xl border border-border bg-surface/60 p-4">
        <div className="mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Transcription audio par IA</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Importez l’audio d’une séance et obtenez une note clinique structurée automatiquement.
          Disponible avec les plans <strong>Pro</strong> et <strong>Clinic</strong>.
        </p>
        <Link href="/dashboard/settings/billing" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          Découvrir les plans →
        </Link>
      </div>
    );
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_BYTES) {
      setError('Fichier trop volumineux (max 25 Mo).');
      setFile(null);
      return;
    }
    setFile(f);
  };

  return (
    <div className="rounded-xl border border-[#0D9488]/30 bg-[#0D9488]/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#0D9488]" />
        <span className="text-sm font-medium text-[#0D9488]">Transcription audio par IA (Scribe)</span>
      </div>

      {isProcessing ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin text-[#0D9488]" />
          Transcription en cours… la note apparaîtra automatiquement dans cette fiche.
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            Importez un enregistrement de la séance (formats : webm, m4a, mp3, wav, ogg — max 25&nbsp;Mo).
            La transcription et la note structurée sont générées automatiquement, puis chiffrées.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.m4a,.mp3,.wav,.ogg,.webm"
            onChange={handleFile}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-[#0D9488]/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#0D9488] hover:file:bg-[#0D9488]/20"
          />

          <label htmlFor={consentId} className="mt-3 flex items-start gap-2 text-sm text-foreground">
            <input
              id={consentId}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-[#0D9488] focus:ring-[#0D9488]"
            />
            <span>
              J’atteste avoir recueilli le <strong>consentement du patient</strong> pour la transcription
              automatisée de cette séance par une IA.
            </span>
          </label>

          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {status === 'failed' && !error && (
            <p className="mt-2 text-sm text-amber-600">
              La dernière transcription a échoué. Vous pouvez réessayer avec un nouveau fichier.
            </p>
          )}

          <div className="mt-3">
            <Button
              size="sm"
              onClick={() => uploadMutation.mutate()}
              disabled={!file || !consent}
              loading={uploadMutation.isPending}
            >
              <Upload size={14} />
              Lancer la transcription
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

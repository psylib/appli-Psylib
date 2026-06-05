'use client';

import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Check } from 'lucide-react';
import { videoApi } from '@/lib/api/video';
import { PsyVideoRoom } from '@/components/video/video-room';

export default function ConsultationRoomPage() {
  const { roomId } = useParams<{ roomId: string }>(); // roomId = appointmentId
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const patientLink = searchParams.get('patientLink') || null;

  const [tokenData, setTokenData] = useState<{
    token: string;
    wsUrl: string;
    roomName: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [scribeEnabled, setScribeEnabled] = useState(false);
  const [patientScribeConsent, setPatientScribeConsent] = useState(false);
  const [scribeUploadDone, setScribeUploadDone] = useState(false);

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`video-notes-${roomId}`);
    if (saved) setNotes(saved);
  }, [roomId]);

  // Persist notes to localStorage on change
  useEffect(() => {
    if (notes) localStorage.setItem(`video-notes-${roomId}`, notes);
  }, [notes, roomId]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const init = async () => {
      try {
        // Ensure room exists
        await videoApi.createRoom(roomId, session.accessToken);
        // Get psy token (includes duration)
        const data = await videoApi.getPsyToken(roomId, session.accessToken);
        setTokenData(data);
        if (data.durationMin) setDuration(data.durationMin);
        if (data.patientScribeConsent !== undefined) {
          setPatientScribeConsent(data.patientScribeConsent);
        }
        if (data.scribeEnabled) setScribeEnabled(data.scribeEnabled);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Impossible de demarrer la visio';
        setError(message);
        router.push('/dashboard/video');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [session?.accessToken, roomId, router]);

  const handleEndCall = async () => {
    if (ending) return;
    setEnding(true);
    // Quitter la visio doit TOUJOURS faire sortir le psy de la salle, même si
    // l'appel backend échoue ou si le token a expiré pendant une longue séance.
    // Le cron de nettoyage des rooms orphelines fermera toute room non close ici.
    try {
      if (session?.accessToken) {
        await videoApi.endRoom(roomId, session.accessToken);
      }
    } catch (err: unknown) {
      console.error('Fermeture de la visio échouée (sortie forcée) :', err);
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['video-today'] });
      router.push('/dashboard/video');
    }
  };

  const handleScribeToggle = async () => {
    if (!session?.accessToken) return;
    try {
      const result = await videoApi.enableScribe(roomId, !scribeEnabled, session.accessToken);
      setScribeEnabled(result.scribeEnabled);
    } catch (err) {
      console.error('Scribe toggle failed:', err);
    }
  };

  const handleCopyLink = async () => {
    if (!patientLink) return;
    await navigator.clipboard.writeText(patientLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !tokenData) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="w-full max-w-3xl mx-auto px-6 space-y-6">
          <div className="aspect-video rounded-xl bg-muted animate-pulse" />
          <div className="flex justify-center gap-4">
            <div className="h-10 w-24 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-24 rounded-lg bg-muted animate-pulse" />
            <div className="h-10 w-24 rounded-lg bg-muted animate-pulse" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Connexion a la salle de visio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {patientLink && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[60] bg-white/95 backdrop-blur border border-border rounded-lg shadow-lg px-4 py-2 flex items-center gap-3 max-w-lg">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Lien patient :</span>
          <input
            readOnly
            value={patientLink}
            className="flex-1 text-xs bg-transparent border-none outline-none text-foreground min-w-0"
          />
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copie !' : 'Copier'}
          </button>
        </div>
      )}
      <PsyVideoRoom
        token={tokenData.token}
        wsUrl={tokenData.wsUrl}
        appointmentId={roomId}
        plannedDurationMin={duration}
        scribeEnabled={scribeEnabled}
        patientScribeConsent={patientScribeConsent}
        isPro={true}
        accessToken={session?.accessToken ?? ''}
        psyName={session?.user?.name ?? 'Psychologue'}
        onScribeToggle={handleScribeToggle}
        onScribeUploadComplete={() => setScribeUploadDone(true)}
        onScribeError={(msg) => console.error('Scribe error:', msg)}
        notesPanel={
          <textarea
            className="w-full h-64 border border-border rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Prenez vos notes ici..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        }
        onCallEnd={handleEndCall}
      />
    </div>
  );
}

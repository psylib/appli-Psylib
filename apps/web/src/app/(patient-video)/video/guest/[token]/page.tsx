'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Video, Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import { videoApi } from '@/lib/api/video';
import { PatientVideoRoom } from '@/components/video/patient-video-room';
import { usePrecallCheck } from '@/hooks/use-precall-check';
import { PrecallChecklist } from '@/components/video/precall-checklist';

type Phase = 'loading' | 'form' | 'waiting' | 'call' | 'denied' | 'ended' | 'error';

export default function GuestVideoPage() {
  const { token: inviteToken } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>('loading');
  const [psychologistName, setPsychologistName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);
  const [tokenData, setTokenData] = useState<{ token: string; wsUrl: string } | null>(null);
  const [guestDevices, setGuestDevices] = useState<{ micId?: string; camId?: string; speakerId?: string }>({});
  const precall = usePrecallCheck();

  // Étape 1 : valider le lien
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await videoApi.resolveGuestInvite(inviteToken);
        if (cancelled) return;
        setPsychologistName(res.psychologistName || '');
        setPhase('form');
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Lien invalide ou expiré');
        setPhase('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteToken]);

  // Étape 3 : polling du statut d'admission
  const pollStatus = useCallback(async () => {
    const st = sessionTokenRef.current;
    if (!st) return;
    try {
      const res = await videoApi.getGuestStatus(st);
      if (res.status === 'admitted' && res.token && res.wsUrl) {
        setTokenData({ token: res.token, wsUrl: res.wsUrl });
        setPhase('call');
      } else if (res.status === 'denied') {
        setPhase('denied');
      } else if (res.status === 'ended') {
        setPhase('ended');
      }
    } catch {
      /* réessai au prochain tick */
    }
  }, []);

  useEffect(() => {
    if (phase !== 'waiting') return;
    pollStatus();
    const id = setInterval(pollStatus, 2500);
    return () => clearInterval(id);
  }, [phase, pollStatus]);

  // Étape 2 : soumettre nom + consentement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await videoApi.requestGuestJoin(inviteToken, name);
      setGuestDevices(precall.selected);
      precall.stop();
      sessionTokenRef.current = res.sessionToken;
      setPhase('waiting');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer la demande");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectionFailed = useCallback(() => {
    setTokenData(null);
    setPhase('waiting');
  }, []);

  // ── Rendu ──
  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">Lien invalide</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (phase === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-sm text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">Accès non autorisé</h1>
          <p className="text-muted-foreground">
            Le praticien n&apos;a pas autorisé votre entrée dans cette consultation.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">La consultation est terminée</h1>
          <p className="text-muted-foreground">Merci.</p>
        </div>
      </div>
    );
  }

  if (phase === 'form') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Video className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Rejoindre la consultation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {psychologistName ? `Vous avez été invité·e par ${psychologistName}.` : 'Vous avez été invité·e à une visio.'}{' '}
            Indiquez votre nom pour que le praticien puisse vous identifier.
          </p>

          <div className="mt-4">
            <PrecallChecklist check={precall} />
          </div>

          <label className="mt-5 block text-sm font-medium text-foreground" htmlFor="guest-name">
            Votre nom
          </label>
          <input
            id="guest-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            autoFocus
            placeholder="Prénom Nom"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-primary"
          />

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-surface p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              Visio hébergée en France (HDS), chiffrée de bout en bout. En continuant, vous acceptez de
              participer à cette consultation vidéo. Aucune donnée n&apos;est conservée après l&apos;appel.
            </span>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={!displayName.trim() || submitting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Demander à rejoindre
          </button>
        </form>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">En attente d&apos;admission</h1>
          <p className="text-muted-foreground">
            {psychologistName || 'Le praticien'} a été prévenu·e. Vous entrerez dès qu&apos;il·elle vous
            admettra. Merci de patienter.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'call' && tokenData) {
    return (
      <PatientVideoRoom
        token={tokenData.token}
        wsUrl={tokenData.wsUrl}
        onConnectionFailed={handleConnectionFailed}
        exitHref="/"
        exitLabel="Fermer"
        micId={guestDevices.micId}
        camId={guestDevices.camId}
        speakerId={guestDevices.speakerId}
      />
    );
  }

  return null;
}

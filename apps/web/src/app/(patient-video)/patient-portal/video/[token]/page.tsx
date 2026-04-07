'use client';

import { useParams } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { videoApi } from '@/lib/api/video';
import { VideoConsentScreen } from '@/components/video/video-consent-screen';
import { WaitingRoom } from '@/components/video/waiting-room';
import { PatientVideoRoom } from '@/components/video/patient-video-room';

type Phase = 'loading' | 'consent' | 'waiting' | 'call' | 'error';

export default function PatientVideoPage() {
  const { token: joinToken } = useParams<{ token: string }>();
  const [phase, setPhase] = useState<Phase>('loading');
  const [tokenData, setTokenData] = useState<{ token: string; wsUrl: string } | null>(null);
  const [psychologistName, setPsychologistName] = useState('');
  const [error, setError] = useState('');
  const [consentLoading, setConsentLoading] = useState(false);

  // Initial check — fetch token or discover consent is needed
  const checkToken = useCallback(async () => {
    try {
      const result = await videoApi.joinAsPatient(joinToken);
      if (result.needsConsent) {
        setPsychologistName(result.psychologistName || '');
        setPhase('consent');
      } else if (result.token) {
        setTokenData({ token: result.token, wsUrl: result.wsUrl });
        setPsychologistName(result.psychologistName || '');
        setPhase('waiting');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lien de visio invalide ou expire';
      setError(message);
      setPhase('error');
    }
  }, [joinToken]);

  // Run on mount
  useEffect(() => { checkToken(); }, [checkToken]);

  const handleConsent = async () => {
    setConsentLoading(true);
    try {
      await videoApi.recordConsent(joinToken);
      // Re-fetch token now that consent is recorded
      const result = await videoApi.joinAsPatient(joinToken);
      if (result.token) {
        setTokenData({ token: result.token, wsUrl: result.wsUrl });
        setPhase('waiting');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du consentement';
      setError(message);
      setPhase('error');
    } finally {
      setConsentLoading(false);
    }
  };

  const handleReady = () => {
    if (tokenData) setPhase('call');
  };

  if (phase === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">Lien invalide</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (phase === 'consent') {
    return (
      <VideoConsentScreen
        psychologistName={psychologistName}
        onAccept={handleConsent}
        isLoading={consentLoading}
      />
    );
  }

  if (phase === 'waiting') {
    return <WaitingRoom psychologistName={psychologistName} onReady={handleReady} />;
  }

  if (phase === 'call' && tokenData) {
    return <PatientVideoRoom token={tokenData.token} wsUrl={tokenData.wsUrl} />;
  }

  return null;
}

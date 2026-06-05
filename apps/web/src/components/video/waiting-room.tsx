'use client';

import { useEffect, useRef } from 'react';
import { usePrecallCheck, type PrecallSelected } from '@/hooks/use-precall-check';
import { PrecallChecklist } from './precall-checklist';

interface WaitingRoomProps {
  psychologistName: string;
  onReady: () => void;
  /** Appelé avec les périphériques choisis juste avant d'entrer. */
  onDevicesSelected?: (selected: PrecallSelected) => void;
}

export function WaitingRoom({ psychologistName, onReady, onDevicesSelected }: WaitingRoomProps) {
  const check = usePrecallCheck();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && check.stream) {
      videoRef.current.srcObject = check.stream;
    }
  }, [check.stream]);

  void psychologistName;

  const canJoin = !!check.stream;

  const handleJoin = () => {
    onDevicesSelected?.(check.selected);
    check.stop();
    onReady();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-1 text-xl font-bold text-foreground">PsyLib</h1>
        <p className="mb-6 text-sm text-muted-foreground">Consultation video</p>

        <div className="relative mx-auto mb-4 h-48 w-64 overflow-hidden rounded-xl bg-gray-900">
          {check.error ? (
            <div className="flex h-full items-center justify-center p-4 text-sm text-red-400">{check.error}</div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          )}
        </div>

        <div className="mx-auto mb-6 max-w-xs">
          <PrecallChecklist check={check} />
        </div>

        <p className="mb-2 font-medium text-foreground">
          Votre psychologue va vous recevoir dans quelques instants...
        </p>
        <div className="flex items-center justify-center gap-2 text-accent">
          <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-sm">En attente</span>
        </div>

        <button
          onClick={handleJoin}
          disabled={!canJoin}
          className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          Rejoindre la consultation
        </button>
      </div>
    </div>
  );
}

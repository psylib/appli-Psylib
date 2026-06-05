'use client';

import { useEffect, useRef } from 'react';
import { Video } from 'lucide-react';
import { usePrecallCheck, type PrecallSelected } from '@/hooks/use-precall-check';
import { PrecallChecklist } from './precall-checklist';

interface PsyPreflightProps {
  onEnter: (selected: PrecallSelected) => void;
}

/**
 * Écran de vérification matériel (micro / caméra / bande passante) affiché au
 * psy avant d'entrer dans la salle de visio. Monté uniquement pendant cette
 * phase : son démontage libère le flux de prévisualisation (cf. usePrecallCheck).
 */
export function PsyPreflight({ onEnter }: PsyPreflightProps) {
  const check = usePrecallCheck();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && check.stream) {
      videoRef.current.srcObject = check.stream;
    }
  }, [check.stream]);

  const handleEnter = () => {
    check.stop();
    onEnter(check.selected);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-1 text-xl font-bold text-foreground">Vérifiez votre matériel</h1>
        <p className="mb-6 text-sm text-muted-foreground">Avant d&apos;entrer dans la salle</p>

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

        <button
          onClick={handleEnter}
          disabled={!check.stream}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Video className="h-4 w-4" />
          Entrer dans la salle
        </button>
      </div>
    </div>
  );
}

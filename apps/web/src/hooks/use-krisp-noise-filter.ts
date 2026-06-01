'use client';

import { useEffect } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import type { LocalAudioTrack } from 'livekit-client';
import { KrispNoiseFilter, isKrispNoiseFilterSupported } from '@livekit/krisp-noise-filter';

/**
 * Active le filtre anti-bruit Krisp sur la piste micro locale dès qu'elle est
 * disponible (et la retire au démontage). Supprime les bruits de fond — clavier,
 * ventilateur, rue, écho ambiant — gros gain de confort en consultation.
 *
 * Best-effort : si le navigateur ne supporte pas Krisp (WASM / AudioWorklet),
 * on ne fait rien. À utiliser dans un composant enfant de <LiveKitRoom>.
 */
export function useKrispNoiseFilter() {
  const { microphoneTrack } = useLocalParticipant();

  useEffect(() => {
    const track = microphoneTrack?.track as LocalAudioTrack | undefined;
    if (!track || !isKrispNoiseFilterSupported()) return;

    const processor = KrispNoiseFilter();
    void track.setProcessor(processor).catch((e) => {
      console.warn('Krisp : activation du filtre anti-bruit échouée', e);
    });

    return () => {
      void track.stopProcessor().catch(() => {});
    };
  }, [microphoneTrack]);
}

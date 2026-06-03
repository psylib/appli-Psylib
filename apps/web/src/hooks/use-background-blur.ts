'use client';

import { useEffect, useRef, useState } from 'react';
import { Track, type LocalVideoTrack } from 'livekit-client';
import { useLocalParticipant } from '@livekit/components-react';

/**
 * Flou d'arrière-plan (style Zoom/Meet) appliqué à la caméra locale via
 * @livekit/track-processors (MediaPipe). Argument clé pour la télé-consultation
 * psy : préserve la confidentialité du cabinet / du domicile du praticien.
 *
 * Le processeur est chargé dynamiquement (import()) pour ne pas alourdir le
 * bundle initial de la salle. En cas d'échec (CPU faible, WASM indisponible),
 * on dégrade silencieusement : le flou reste off, l'appel continue.
 */
export function useBackgroundBlur() {
  const { localParticipant } = useLocalParticipant();
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const processorRef = useRef<unknown>(null);

  const getCameraTrack = (): LocalVideoTrack | undefined => {
    const pub = localParticipant.getTrackPublication(Track.Source.Camera);
    return pub?.track as LocalVideoTrack | undefined;
  };

  const toggle = async () => {
    if (pending) return;
    const track = getCameraTrack();
    if (!track) return;
    setPending(true);
    try {
      if (!enabled) {
        const { BackgroundBlur } = await import('@livekit/track-processors');
        const processor = BackgroundBlur(15);
        await track.setProcessor(processor);
        processorRef.current = processor;
        setEnabled(true);
      } else {
        await track.stopProcessor();
        processorRef.current = null;
        setEnabled(false);
      }
    } catch (err) {
      console.error('[background-blur] échec', err);
      setEnabled(false);
    } finally {
      setPending(false);
    }
  };

  // Nettoyage si le composant est démonté alors que le flou est actif.
  useEffect(() => {
    return () => {
      const track = getCameraTrack();
      if (track && processorRef.current) {
        track.stopProcessor().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { blurEnabled: enabled, blurPending: pending, toggleBlur: toggle };
}

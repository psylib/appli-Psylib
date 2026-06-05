'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { ConnectionQuality, RoomEvent, type Participant } from 'livekit-client';

const POOR_GRACE_MS = 6000;

export type DegradeReason = 'auto' | 'manual' | null;

export interface UseAdaptiveQualityReturn {
  degraded: boolean;
  reason: DegradeReason;
  connectionPoor: boolean;
  forceAudioOnly: () => void;
  restoreVideo: () => void;
}

export function useAdaptiveQuality(): UseAdaptiveQualityReturn {
  const room = useRoomContext();
  const { isCameraEnabled } = useLocalParticipant();
  const [degraded, setDegraded] = useState(false);
  const [reason, setReason] = useState<DegradeReason>(null);
  const [connectionPoor, setConnectionPoor] = useState(false);

  const degradedRef = useRef(false);
  const poorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraEnabledRef = useRef(isCameraEnabled);
  const wasEnabledRef = useRef(false);

  // Garde une trace de l'état caméra courant (pour respecter une coupure manuelle).
  cameraEnabledRef.current = isCameraEnabled;

  const setCamera = useCallback((on: boolean) => {
    room.localParticipant.setCameraEnabled(on).catch(() => {});
  }, [room]);

  const clearPoorTimer = () => {
    if (poorTimer.current) { clearTimeout(poorTimer.current); poorTimer.current = null; }
  };

  useEffect(() => {
    const onQuality = (quality: ConnectionQuality, participant: Participant) => {
      if (!participant.isLocal) return;
      const poor = quality === ConnectionQuality.Poor;
      setConnectionPoor(poor);

      if (poor) {
        // Ne dégrade que si la caméra est réellement active : si l'utilisateur
        // l'a coupée manuellement, on ne touche à rien.
        if (!degradedRef.current && !poorTimer.current && cameraEnabledRef.current) {
          poorTimer.current = setTimeout(() => {
            poorTimer.current = null;
            wasEnabledRef.current = cameraEnabledRef.current;
            degradedRef.current = true;
            setDegraded(true);
            setReason('auto');
            setCamera(false);
          }, POOR_GRACE_MS);
        }
      } else {
        clearPoorTimer();
      }
    };

    room.on(RoomEvent.ConnectionQualityChanged, onQuality);
    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, onQuality);
      clearPoorTimer();
    };
  }, [room, setCamera]);

  const forceAudioOnly = useCallback(() => {
    clearPoorTimer();
    wasEnabledRef.current = cameraEnabledRef.current;
    degradedRef.current = true;
    setDegraded(true);
    setReason('manual');
    setCamera(false);
  }, [setCamera]);

  const restoreVideo = useCallback(() => {
    clearPoorTimer();
    degradedRef.current = false;
    setDegraded(false);
    setReason(null);
    // Restaure l'état caméra qui précédait la dégradation (jamais "on" forcé).
    setCamera(wasEnabledRef.current);
  }, [setCamera]);

  return { degraded, reason, connectionPoor, forceAudioOnly, restoreVideo };
}

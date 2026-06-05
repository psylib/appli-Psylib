'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
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
  const [degraded, setDegraded] = useState(false);
  const [reason, setReason] = useState<DegradeReason>(null);
  const [connectionPoor, setConnectionPoor] = useState(false);

  const degradedRef = useRef(false);
  const poorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        if (!degradedRef.current && !poorTimer.current) {
          poorTimer.current = setTimeout(() => {
            poorTimer.current = null;
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
    setCamera(true);
  }, [setCamera]);

  return { degraded, reason, connectionPoor, forceAudioOnly, restoreVideo };
}

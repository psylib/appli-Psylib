'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVideoCallOptions {
  onParticipantJoined?: () => void;
  onParticipantLeft?: () => void;
  onDisconnected?: () => void;
}

export function useVideoCall(options: UseVideoCallOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectedAt, setConnectedAt] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Start timer when connected
  useEffect(() => {
    if (isConnected && connectedAt) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(
          Math.floor((Date.now() - connectedAt.getTime()) / 1000),
        );
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected, connectedAt]);

  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setIsReconnecting(false);
    setConnectedAt(new Date());
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    if (timerRef.current) clearInterval(timerRef.current);
    optionsRef.current.onDisconnected?.();
  }, []);

  const handleReconnecting = useCallback(() => {
    setIsReconnecting(true);
  }, []);

  const handleReconnected = useCallback(() => {
    setIsReconnecting(false);
  }, []);

  const handleParticipantJoined = useCallback(() => {
    optionsRef.current.onParticipantJoined?.();
  }, []);

  const handleParticipantLeft = useCallback(() => {
    optionsRef.current.onParticipantLeft?.();
  }, []);

  return {
    isConnected,
    isReconnecting,
    connectedAt,
    elapsedSeconds,
    handleConnected,
    handleDisconnected,
    handleReconnecting,
    handleReconnected,
    handleParticipantJoined,
    handleParticipantLeft,
  };
}

export function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

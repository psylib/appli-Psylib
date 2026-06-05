'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { measureBandwidth, type BandwidthResult } from '@/lib/video/bandwidth';

export type DeviceKind = 'mic' | 'cam' | 'speaker';

export interface PrecallDevices {
  mics: MediaDeviceInfo[];
  cams: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}

export interface PrecallSelected {
  micId?: string;
  camId?: string;
  speakerId?: string;
}

export interface UsePrecallCheckReturn {
  stream: MediaStream | null;
  audioLevel: number;
  bandwidth: BandwidthResult;
  devices: PrecallDevices;
  selected: PrecallSelected;
  setDevice: (kind: DeviceKind, id: string) => void;
  testSpeaker: () => void;
  error: string | null;
}

const PROBE_URL = '/bandwidth-probe.bin';

export function usePrecallCheck(): UsePrecallCheckReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [bandwidth, setBandwidth] = useState<BandwidthResult>({ mbps: 0, quality: 'good', status: 'testing' });
  const [devices, setDevices] = useState<PrecallDevices>({ mics: [], cams: [], speakers: [] });
  const [selected, setSelected] = useState<PrecallSelected>({});
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // (Re)acquire the media stream for the current selection.
  const acquire = useCallback(async (sel: PrecallSelected) => {
    try {
      stopStream();
      const constraints: MediaStreamConstraints = {
        audio: sel.micId ? { deviceId: { exact: sel.micId } } : true,
        video: sel.camId ? { deviceId: { exact: sel.camId } } : true,
      };
      const ms = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = ms;
      setStream(ms);
      setError(null);

      // Enumerate devices now that we have permission (labels populated).
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        mics: all.filter((d) => d.kind === 'audioinput'),
        cams: all.filter((d) => d.kind === 'videoinput'),
        speakers: all.filter((d) => d.kind === 'audiooutput'),
      });

      // Wire VU-meter via Web Audio.
      audioCtxRef.current?.close().catch(() => {});
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(ms);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = ((data[i] ?? 128) - 128) / 128;
          sum += v * v;
        }
        setAudioLevel(Math.min(1, Math.sqrt(sum / data.length) * 3));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setError("Impossible d'acceder a votre camera ou micro. Verifiez les permissions de votre navigateur.");
    }
  }, [stopStream]);

  // Initial acquisition + bandwidth probe on mount.
  useEffect(() => {
    acquire({});
    measureBandwidth(PROBE_URL).then(setBandwidth);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDevice = useCallback((kind: DeviceKind, id: string) => {
    setSelected((prev) => {
      const next: PrecallSelected = { ...prev };
      if (kind === 'mic') next.micId = id;
      if (kind === 'cam') next.camId = id;
      if (kind === 'speaker') next.speakerId = id;
      if (kind !== 'speaker') acquire(next); // speaker change does not affect capture
      return next;
    });
  }, [acquire]);

  const testSpeaker = useCallback(() => {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => { osc.stop(); ctx.close().catch(() => {}); }, 600);
  }, []);

  return { stream, audioLevel, bandwidth, devices, selected, setDevice, testSpeaker, error };
}

'use client';

import { useCallback, useRef, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { Track } from 'livekit-client';

export type ScribeRecorderState = 'idle' | 'recording' | 'uploading' | 'done' | 'error';

interface UseScribeRecorderOptions {
  appointmentId: string;
  accessToken: string;
  onUploadComplete?: () => void;
  onError?: (err: string) => void;
}

export function useScribeRecorder({
  appointmentId,
  accessToken,
  onUploadComplete,
  onError,
}: UseScribeRecorderOptions) {
  const room = useRoomContext();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<ScribeRecorderState>('idle');

  const start = useCallback(() => {
    if (mediaRecorderRef.current) return;

    try {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      audioContextRef.current = audioContext;
      chunksRef.current = [];

      // Mix local mic
      const localAudioTracks = room.localParticipant
        .getTrackPublications()
        .filter((pub) => pub.track?.kind === 'audio' && pub.track?.mediaStreamTrack);
      localAudioTracks.forEach((pub) => {
        if (pub.track?.mediaStreamTrack) {
          const stream = new MediaStream([pub.track.mediaStreamTrack]);
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(destination);
        }
      });

      // Mix remote participants
      room.remoteParticipants.forEach((participant) => {
        participant.getTrackPublications().forEach((pub) => {
          if (
            pub.track?.kind === 'audio' &&
            pub.source === Track.Source.Microphone &&
            pub.track?.mediaStreamTrack
          ) {
            const stream = new MediaStream([pub.track.mediaStreamTrack]);
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(destination);
          }
        });
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(destination.stream, {
        mimeType,
        audioBitsPerSecond: 32000,
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(5000);
      mediaRecorderRef.current = recorder;
      setState('recording');
    } catch (err) {
      onError?.(`Impossible de démarrer l'enregistrement : ${err}`);
      setState('error');
    }
  }, [room, onError]);

  const stopAndUpload = useCallback(async (): Promise<void> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    setState('uploading');

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    mediaRecorderRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;

    const chunks = chunksRef.current;
    if (chunks.length === 0) {
      setState('error');
      onError?.('Aucun audio enregistré');
      return;
    }

    const mimeType = chunks[0]?.type || 'audio/webm';
    const audioBlob = new Blob(chunks, { type: mimeType });
    chunksRef.current = [];

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.psylib.eu';
      const formData = new FormData();
      formData.append('audio', audioBlob, 'session.webm');

      const response = await fetch(
        `${baseUrl}/api/v1/video/rooms/${appointmentId}/scribe/audio`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        },
      );

      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `HTTP ${response.status}`);
      }

      setState('done');
      onUploadComplete?.();
    } catch (err) {
      setState('error');
      onError?.(`Upload audio échoué : ${err}`);
    }
  }, [appointmentId, accessToken, onUploadComplete, onError]);

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    mediaRecorderRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    chunksRef.current = [];
    setState('idle');
  }, []);

  return { state, start, stopAndUpload, cancel, isRecording: state === 'recording' };
}

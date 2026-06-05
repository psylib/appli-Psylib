'use client';

import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { bytesToChunks, chunksToBlob } from '@/lib/video/chunk';

const CHUNK_SIZE = 12_000; // octets bruts par paquet (sous la limite ~15KiB du DataChannel)

export interface PresentedDoc {
  fileName: string;
  mimeType: string;
  url: string;
}

export interface UseDocPresentationReturn {
  presented: PresentedDoc | null;
  progress: { received: number; total: number } | null;
  presentDocument: (meta: { fileName: string; mimeType: string }, bytes: Uint8Array) => void;
  closeDocument: () => void;
}

interface Incoming {
  docId: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  chunks: string[];
  received: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function useDocPresentation(): UseDocPresentationReturn {
  const room = useRoomContext();
  const [presented, setPresented] = useState<PresentedDoc | null>(null);
  const [progress, setProgress] = useState<{ received: number; total: number } | null>(null);
  const incomingRef = useRef<Incoming | null>(null);
  const urlRef = useRef<string | null>(null);

  const revokeUrl = useCallback(() => {
    if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; }
  }, []);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(decoder.decode(payload)) as Record<string, unknown>;
      } catch {
        return;
      }
      const kind = msg['kind'];
      if (kind === 'doc-start') {
        if (
          typeof msg['docId'] !== 'string' ||
          typeof msg['fileName'] !== 'string' ||
          typeof msg['mimeType'] !== 'string' ||
          typeof msg['totalChunks'] !== 'number'
        ) return;
        incomingRef.current = {
          docId: msg['docId'],
          fileName: msg['fileName'],
          mimeType: msg['mimeType'],
          totalChunks: msg['totalChunks'],
          chunks: new Array(msg['totalChunks']),
          received: 0,
        };
        setProgress({ received: 0, total: msg['totalChunks'] });
      } else if (kind === 'doc-chunk') {
        const inc = incomingRef.current;
        if (!inc || msg['docId'] !== inc.docId) return;
        if (typeof msg['i'] !== 'number' || typeof msg['data'] !== 'string') return;
        if (inc.chunks[msg['i']] === undefined) inc.received += 1;
        inc.chunks[msg['i']] = msg['data'];
        setProgress({ received: inc.received, total: inc.totalChunks });
        if (inc.received === inc.totalChunks) {
          const blob = chunksToBlob(inc.chunks, inc.mimeType);
          revokeUrl();
          const url = URL.createObjectURL(blob);
          urlRef.current = url;
          setPresented({ fileName: inc.fileName, mimeType: inc.mimeType, url });
          setProgress(null);
          incomingRef.current = null;
        }
      } else if (kind === 'doc-close') {
        incomingRef.current = null;
        revokeUrl();
        setPresented(null);
        setProgress(null);
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      revokeUrl();
    };
  }, [room, revokeUrl]);

  const publish = useCallback((obj: unknown) => {
    room.localParticipant
      .publishData(encoder.encode(JSON.stringify(obj)), { reliable: true })
      .catch((err: unknown) => console.error('[doc-presentation] publishData failed', err));
  }, [room]);

  const presentDocument = useCallback(
    (meta: { fileName: string; mimeType: string }, bytes: Uint8Array) => {
      const chunks = bytesToChunks(bytes, CHUNK_SIZE);
      const docId = crypto.randomUUID();
      publish({ kind: 'doc-start', docId, fileName: meta.fileName, mimeType: meta.mimeType, totalChunks: chunks.length });
      chunks.forEach((data, i) => publish({ kind: 'doc-chunk', docId, i, data }));
      revokeUrl();
      const url = URL.createObjectURL(chunksToBlob(chunks, meta.mimeType));
      urlRef.current = url;
      setPresented({ fileName: meta.fileName, mimeType: meta.mimeType, url });
    },
    [publish, revokeUrl],
  );

  const closeDocument = useCallback(() => {
    publish({ kind: 'doc-close' });
    revokeUrl();
    setPresented(null);
    setProgress(null);
  }, [publish, revokeUrl]);

  return { presented, progress, presentDocument, closeDocument };
}

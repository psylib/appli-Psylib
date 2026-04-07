'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, VideoIcon, VideoOff, CheckCircle, XCircle } from 'lucide-react';

interface WaitingRoomProps {
  psychologistName: string;
  onReady: () => void;
}

export function WaitingRoom({ psychologistName, onReady }: WaitingRoomProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasMic, setHasMic] = useState(false);
  const [hasCam, setHasCam] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    const initMedia = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        setHasMic(mediaStream.getAudioTracks().length > 0);
        setHasCam(mediaStream.getVideoTracks().length > 0);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch {
        setError("Impossible d'acceder a votre camera ou micro. Verifiez les permissions de votre navigateur.");
      }
    };
    initMedia();
    return () => {
      mediaStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Keep psychologistName in scope for future use (e.g. display)
  void psychologistName;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-bold text-foreground mb-1">PsyLib</h1>
        <p className="text-sm text-muted-foreground mb-6">Consultation video</p>

        {/* Video preview */}
        <div className="relative w-64 h-48 mx-auto rounded-xl overflow-hidden bg-gray-900 mb-4">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-400 text-sm p-4">{error}</div>
          ) : (
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          )}
        </div>

        {/* Media checks */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-1.5 text-sm">
            {hasMic ? (
              <><CheckCircle className="h-4 w-4 text-green-500" /><Mic className="h-4 w-4" /> Micro OK</>
            ) : (
              <><XCircle className="h-4 w-4 text-red-500" /><MicOff className="h-4 w-4" /> Micro</>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            {hasCam ? (
              <><CheckCircle className="h-4 w-4 text-green-500" /><VideoIcon className="h-4 w-4" /> Camera OK</>
            ) : (
              <><XCircle className="h-4 w-4 text-red-500" /><VideoOff className="h-4 w-4" /> Camera</>
            )}
          </div>
        </div>

        <p className="text-foreground font-medium mb-2">
          Votre psychologue va vous recevoir dans quelques instants...
        </p>
        <div className="flex items-center justify-center gap-2 text-accent">
          <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm">En attente</span>
        </div>

        {(hasMic || hasCam) && (
          <button
            onClick={() => { stream?.getTracks().forEach(t => t.stop()); onReady(); }}
            className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Rejoindre la salle d&apos;attente
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { useLocalParticipant } from '@livekit/components-react';
import { Mic, MicOff, VideoIcon, VideoOff, PhoneOff, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { SessionTimer } from './session-timer';

interface VideoControlsProps {
  elapsedSeconds: number;
  plannedDurationMin: number;
  showNotes: boolean;
  onToggleNotes: () => void;
  onEndCall: () => void;
}

export function VideoControls({
  elapsedSeconds,
  plannedDurationMin,
  showNotes,
  onToggleNotes,
  onEndCall,
}: VideoControlsProps) {
  const { localParticipant } = useLocalParticipant();
  const isMicOn = localParticipant.isMicrophoneEnabled;
  const isCamOn = localParticipant.isCameraEnabled;

  return (
    <div className="flex items-center justify-between border-t border-border bg-white px-4 py-3">
      <SessionTimer elapsedSeconds={elapsedSeconds} plannedDurationMin={plannedDurationMin} />

      <div className="flex items-center gap-2">
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicOn)}
          className={`rounded-full p-3 transition-colors ${isMicOn ? 'bg-muted hover:bg-muted/80' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          title={isMicOn ? 'Couper le micro' : 'Activer le micro'}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={() => localParticipant.setCameraEnabled(!isCamOn)}
          className={`rounded-full p-3 transition-colors ${isCamOn ? 'bg-muted hover:bg-muted/80' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
          title={isCamOn ? 'Couper la caméra' : 'Activer la caméra'}
        >
          {isCamOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          onClick={onToggleNotes}
          className="rounded-full p-3 bg-muted hover:bg-muted/80 transition-colors"
          title={showNotes ? 'Masquer les notes' : 'Afficher les notes'}
        >
          {showNotes ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
        </button>

        <button
          onClick={onEndCall}
          className="rounded-full p-3 bg-red-600 text-white hover:bg-red-700 transition-colors ml-2"
          title="Terminer la consultation"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>

      <div className="w-24" /> {/* Spacer for balance */}
    </div>
  );
}

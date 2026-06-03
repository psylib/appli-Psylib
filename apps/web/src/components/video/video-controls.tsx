'use client';

import { useLocalParticipant } from '@livekit/components-react';
import {
  Mic, MicOff, VideoIcon, VideoOff, PhoneOff,
  PanelRightOpen, PanelRightClose, Maximize, Minimize,
  MonitorUp, MonitorX,
} from 'lucide-react';
import { DeviceSettingsMenu } from './device-settings-menu';

interface VideoControlsProps {
  showNotes: boolean;
  onToggleNotes: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  blurEnabled: boolean;
  blurPending: boolean;
  onToggleBlur: () => void;
  inviteSlot?: React.ReactNode;
  onEndCall: () => void;
}

const baseBtn = 'rounded-full p-3 transition-colors text-white';
const neutralBtn = `${baseBtn} bg-white/10 hover:bg-white/20`;
const offBtn = `${baseBtn} bg-red-500/90 hover:bg-red-500`;
const activeBtn = `${baseBtn} bg-[#0D9488] hover:bg-[#0b7d72]`;

export function VideoControls({
  showNotes,
  onToggleNotes,
  isFullscreen,
  onToggleFullscreen,
  isScreenSharing,
  onToggleScreenShare,
  blurEnabled,
  blurPending,
  onToggleBlur,
  inviteSlot,
  onEndCall,
}: VideoControlsProps) {
  const { localParticipant, isMicrophoneEnabled: isMicOn, isCameraEnabled: isCamOn } = useLocalParticipant();

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-gray-900/80 px-3 py-2 shadow-2xl backdrop-blur-md">
      <button
        onClick={() => localParticipant.setMicrophoneEnabled(!isMicOn)}
        className={isMicOn ? neutralBtn : offBtn}
        title={isMicOn ? 'Couper le micro' : 'Activer le micro'}
      >
        {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>

      <button
        onClick={() => localParticipant.setCameraEnabled(!isCamOn)}
        className={isCamOn ? neutralBtn : offBtn}
        title={isCamOn ? 'Couper la caméra' : 'Activer la caméra'}
      >
        {isCamOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
      </button>

      <button
        onClick={onToggleScreenShare}
        className={isScreenSharing ? activeBtn : neutralBtn}
        title={isScreenSharing ? 'Arrêter le partage d\'écran' : 'Partager mon écran'}
      >
        {isScreenSharing ? <MonitorX className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
      </button>

      {inviteSlot}

      <DeviceSettingsMenu blurEnabled={blurEnabled} blurPending={blurPending} onToggleBlur={onToggleBlur} />

      <div className="mx-1 h-6 w-px bg-white/15" />

      <button
        onClick={onToggleNotes}
        className={showNotes ? activeBtn : neutralBtn}
        title={showNotes ? 'Masquer les notes' : 'Afficher les notes'}
      >
        {showNotes ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
      </button>

      <button
        onClick={onToggleFullscreen}
        className={neutralBtn}
        title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>

      <button
        onClick={onEndCall}
        className={`${baseBtn} ml-1 bg-red-600 hover:bg-red-700`}
        title="Terminer la consultation"
      >
        <PhoneOff className="h-5 w-5" />
      </button>
    </div>
  );
}

'use client';

import {
  LiveKitRoom,
  useTracks,
  useRoomContext,
  useLocalParticipant,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { useVideoCall } from '@/hooks/use-video-call';
import { useBackgroundBlur } from '@/hooks/use-background-blur';
import { VideoControls } from './video-controls';
import { VideoGrid } from './video-grid';
import { SessionTimer } from './session-timer';
import { GuestInvitePopover } from './guest-invite-popover';
import { WaitingGuestsBanner } from './waiting-guests-banner';
import { videoRoomOptions } from '@/lib/video/livekit-options';
import { useKrispNoiseFilter } from '@/hooks/use-krisp-noise-filter';
import { useScribeRecorder } from '@/hooks/use-scribe-recorder';
import { ScribeToggle } from './scribe-toggle';
import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoRoomProps {
  token: string;
  wsUrl: string;
  appointmentId: string;
  plannedDurationMin: number;
  notesPanel: React.ReactNode;
  onCallEnd: () => void;
  // Scribe props
  scribeEnabled: boolean;
  patientScribeConsent: boolean;
  isPro: boolean;
  accessToken: string;
  onScribeToggle: () => void;
  onScribeUploadComplete: () => void;
  onScribeError: (msg: string) => void;
}

function VideoLayout({
  appointmentId,
  plannedDurationMin,
  notesPanel,
  onCallEnd,
  scribeEnabled,
  patientScribeConsent,
  isPro,
  accessToken,
  onScribeToggle,
  onScribeUploadComplete,
  onScribeError,
}: Omit<VideoRoomProps, 'token' | 'wsUrl'>) {
  const [showNotes, setShowNotes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const videoPanelRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveringControls = useRef(false);

  useKrispNoiseFilter();
  const { state: recorderState, start: startRecording, stopAndUpload, cancel: cancelRecording } =
    useScribeRecorder({
      appointmentId,
      accessToken,
      onUploadComplete: onScribeUploadComplete,
      onError: onScribeError,
    });
  const { blurEnabled, blurPending, toggleBlur } = useBackgroundBlur();
  const { elapsedSeconds, handleConnected, handleDisconnected, isReconnecting } = useVideoCall({
    onDisconnected: () => {},
  });

  const room = useRoomContext();
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();

  useEffect(() => {
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, handleConnected, handleDisconnected]);

  // ----- Plein écran -----
  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === videoPanelRef.current);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoPanelRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  // ----- Contrôles flottants auto-masqués (style Zoom) -----
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!hoveringControls.current) setControlsVisible(false);
    }, 3500);
  }, []);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls]);

  // ----- Partage d'écran -----
  const toggleScreenShare = useCallback(() => {
    localParticipant.setScreenShareEnabled(!isScreenShareEnabled).catch(() => {});
  }, [localParticipant, isScreenShareEnabled]);

  // ----- Scribe auto-start/stop -----
  useEffect(() => {
    if (scribeEnabled && recorderState === 'idle') {
      startRecording();
    }
    if (!scribeEnabled && recorderState === 'recording') {
      cancelRecording();
    }
  }, [scribeEnabled, recorderState, startRecording, cancelRecording]);

  const handleEndCall = useCallback(async () => {
    if (scribeEnabled && recorderState === 'recording') {
      await stopAndUpload();
    } else {
      cancelRecording();
    }
    onCallEnd();
  }, [scribeEnabled, recorderState, stopAndUpload, cancelRecording, onCallEnd]);

  // ----- Tracks (caméra + partage d'écran) -----
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);
  const screenShareTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare && t.publication);
  const remoteTracks = cameraTracks.filter((t) => !t.participant.isLocal);
  const localTrack = cameraTracks.find((t) => t.participant.isLocal);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Panneau vidéo */}
      <div
        ref={videoPanelRef}
        onMouseMove={showControls}
        className={`relative bg-gray-900 ${showNotes ? 'w-[65%]' : 'w-full'} transition-all`}
      >
        {isReconnecting && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p>Reconnexion en cours...</p>
            </div>
          </div>
        )}

        <VideoGrid remoteTracks={remoteTracks} localTrack={localTrack} screenShareTracks={screenShareTracks} />

        {/* Minuteur (toujours visible) */}
        <div className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 shadow-md backdrop-blur">
          <SessionTimer elapsedSeconds={elapsedSeconds} plannedDurationMin={plannedDurationMin} />
        </div>

        {/* Salle d'attente : invités en attente d'admission */}
        <WaitingGuestsBanner appointmentId={appointmentId} />

        {/* Contrôles flottants */}
        <div
          onMouseEnter={() => {
            hoveringControls.current = true;
            setControlsVisible(true);
            if (hideTimer.current) clearTimeout(hideTimer.current);
          }}
          onMouseLeave={() => {
            hoveringControls.current = false;
            showControls();
          }}
          className={`absolute bottom-6 left-1/2 z-30 -translate-x-1/2 transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <VideoControls
            showNotes={showNotes}
            onToggleNotes={() => setShowNotes((v) => !v)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isScreenSharing={isScreenShareEnabled}
            onToggleScreenShare={toggleScreenShare}
            blurEnabled={blurEnabled}
            blurPending={blurPending}
            onToggleBlur={toggleBlur}
            inviteSlot={<GuestInvitePopover appointmentId={appointmentId} />}
            scribeSlot={
              <ScribeToggle
                isEnabled={scribeEnabled}
                patientConsented={patientScribeConsent}
                recorderState={recorderState}
                isPro={isPro}
                onToggle={onScribeToggle}
              />
            }
            onEndCall={handleEndCall}
          />
        </div>
      </div>

      {/* Panneau notes */}
      {showNotes && (
        <div className="w-[35%] overflow-y-auto border-l border-border bg-white">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold text-foreground">Notes de seance</h2>
          </div>
          <div className="p-4">{notesPanel}</div>
        </div>
      )}

      <RoomAudioRenderer />
    </div>
  );
}

export function PsyVideoRoom({
  token,
  wsUrl,
  appointmentId,
  plannedDurationMin,
  notesPanel,
  onCallEnd,
  scribeEnabled,
  patientScribeConsent,
  isPro,
  accessToken,
  onScribeToggle,
  onScribeUploadComplete,
  onScribeError,
}: VideoRoomProps) {
  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
      options={videoRoomOptions}
    >
      <VideoLayout
        appointmentId={appointmentId}
        plannedDurationMin={plannedDurationMin}
        notesPanel={notesPanel}
        onCallEnd={onCallEnd}
        scribeEnabled={scribeEnabled}
        patientScribeConsent={patientScribeConsent}
        isPro={isPro}
        accessToken={accessToken}
        onScribeToggle={onScribeToggle}
        onScribeUploadComplete={onScribeUploadComplete}
        onScribeError={onScribeError}
      />
    </LiveKitRoom>
  );
}

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
import { useVideoChat } from '@/hooks/use-video-chat';
import { VideoControls } from './video-controls';
import { VideoGrid } from './video-grid';
import { SessionTimer } from './session-timer';
import { GuestInvitePopover } from './guest-invite-popover';
import { WaitingGuestsBanner } from './waiting-guests-banner';
import { VideoChatPanel } from './video-chat-panel';
import { videoRoomOptions } from '@/lib/video/livekit-options';
import { useKrispNoiseFilter } from '@/hooks/use-krisp-noise-filter';
import { useScribeRecorder } from '@/hooks/use-scribe-recorder';
import { ScribeToggle } from './scribe-toggle';
import { MessageSquare } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface VideoRoomProps {
  token: string;
  wsUrl: string;
  appointmentId: string;
  plannedDurationMin: number;
  notesPanel: React.ReactNode;
  onCallEnd: () => void;
  scribeEnabled: boolean;
  patientScribeConsent: boolean;
  isPro: boolean;
  accessToken: string;
  onScribeToggle: () => void;
  onScribeUploadComplete: () => void;
  onScribeError: (msg: string) => void;
  psyName: string;
}

type RightTab = 'notes' | 'chat';

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
  psyName,
}: Omit<VideoRoomProps, 'token' | 'wsUrl'>) {
  const [showNotes, setShowNotes] = useState(true);
  const [rightTab, setRightTab] = useState<RightTab>('notes');
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

  const { messages: chatMessages, unreadCount, sendMessage, clearUnread } = useVideoChat({
    sender: 'psy',
    senderName: psyName,
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

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (!hoveringControls.current) setControlsVisible(false);
    }, 3500);
  }, []);

  useEffect(() => {
    showControls();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [showControls]);

  const toggleScreenShare = useCallback(() => {
    localParticipant.setScreenShareEnabled(!isScreenShareEnabled).catch(() => {});
  }, [localParticipant, isScreenShareEnabled]);

  useEffect(() => {
    if (scribeEnabled && recorderState === 'idle') startRecording();
    if (!scribeEnabled && recorderState === 'recording') cancelRecording();
  }, [scribeEnabled, recorderState, startRecording, cancelRecording]);

  const handleEndCall = useCallback(async () => {
    if (scribeEnabled && recorderState === 'recording') await stopAndUpload();
    else cancelRecording();
    onCallEnd();
  }, [scribeEnabled, recorderState, stopAndUpload, cancelRecording, onCallEnd]);

  const handleOpenChat = useCallback(() => {
    setShowNotes(true);
    setRightTab('chat');
    clearUnread(true);
  }, [clearUnread]);

  useEffect(() => {
    if (rightTab === 'chat') clearUnread(true);
    else clearUnread(false);
  }, [rightTab, clearUnread]);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);
  const screenShareTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare && t.publication);
  const remoteTracks = cameraTracks.filter((t) => !t.participant.isLocal);
  const localTrack = cameraTracks.find((t) => t.participant.isLocal);

  const chatBadge = unreadCount > 0 && rightTab !== 'chat';

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
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

        <div className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1.5 shadow-md backdrop-blur">
          <SessionTimer elapsedSeconds={elapsedSeconds} plannedDurationMin={plannedDurationMin} />
        </div>

        <WaitingGuestsBanner appointmentId={appointmentId} />

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
            chatSlot={
              <button
                onClick={handleOpenChat}
                className={`relative rounded-full p-3 transition-colors text-white ${
                  rightTab === 'chat' && showNotes
                    ? 'bg-[#0D9488] hover:bg-[#0b7d72]'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                title="Chat texte"
              >
                <MessageSquare className="h-5 w-5" />
                {chatBadge && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            }
            onEndCall={handleEndCall}
          />
        </div>
      </div>

      {showNotes && (
        <div className="flex w-[35%] flex-col overflow-hidden border-l border-border bg-white">
          <div className="flex border-b border-border">
            <button
              onClick={() => setRightTab('notes')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                rightTab === 'notes'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Notes
            </button>
            <button
              onClick={() => { setRightTab('chat'); clearUnread(true); }}
              className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
                rightTab === 'chat'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chat
              {chatBadge && (
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {rightTab === 'notes' ? (
              <div className="h-full overflow-y-auto p-4">{notesPanel}</div>
            ) : (
              <VideoChatPanel
                messages={chatMessages}
                localSender="psy"
                onSend={sendMessage}
              />
            )}
          </div>
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
  psyName,
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
        psyName={psyName}
      />
    </LiveKitRoom>
  );
}

'use client';

import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useRoomContext,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, VideoIcon, VideoOff, User, PhoneOff, MessageSquare, X } from 'lucide-react';
import { videoRoomOptions } from '@/lib/video/livekit-options';
import { useKrispNoiseFilter } from '@/hooks/use-krisp-noise-filter';
import { useVideoChat } from '@/hooks/use-video-chat';
import { VideoChatPanel } from './video-chat-panel';

interface PatientLayoutProps {
  onConnectionFailed: () => void;
  exitHref?: string;
  exitLabel?: string;
  patientName?: string;
  speakerId?: string;
}

function PatientLayout({
  onConnectionFailed,
  exitHref = '/patient-portal',
  exitLabel = 'Retour a mon espace',
  patientName = 'Patient',
  speakerId,
}: PatientLayoutProps) {
  const { localParticipant, isMicrophoneEnabled: isMicOn, isCameraEnabled: isCamOn } = useLocalParticipant();
  useKrispNoiseFilter();
  const room = useRoomContext();

  useEffect(() => {
    if (speakerId) {
      room.switchActiveDevice('audiooutput', speakerId).catch(() => {});
    }
  }, [room, speakerId]);
  const [disconnected, setDisconnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const hasConnected = useRef(false);

  const { messages: chatMessages, unreadCount, sendMessage, clearUnread } = useVideoChat({
    sender: 'patient',
    senderName: patientName,
  });

  useEffect(() => {
    const onConnected = () => { hasConnected.current = true; };
    const onDisconnected = () => {
      if (hasConnected.current) setDisconnected(true);
      else onConnectionFailed();
    };
    const onReconnecting = () => setReconnecting(true);
    const onReconnected = () => setReconnecting(false);
    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.Reconnecting, onReconnecting);
    room.on(RoomEvent.Reconnected, onReconnected);
    return () => {
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.Reconnecting, onReconnecting);
      room.off(RoomEvent.Reconnected, onReconnected);
    };
  }, [room, onConnectionFailed]);

  const remoteParticipants = useRemoteParticipants();
  const psyIsPresent = remoteParticipants.length > 0;
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const remoteTracks = tracks.filter((t) => !t.participant.isLocal);
  const localTrack = tracks.find((t) => t.participant.isLocal);
  const psyVideoTrack = remoteTracks.find((t) => t.publication != null);

  const handleLeave = () => {
    setDisconnected(true);
    void room.disconnect();
  };

  const handleOpenChat = () => {
    setChatOpen(true);
    clearUnread(true);
  };

  const handleCloseChat = () => {
    setChatOpen(false);
    clearUnread(false);
  };

  if (reconnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="p-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h1 className="mb-2 text-xl font-bold text-foreground">Reconnexion en cours...</h1>
          <p className="text-muted-foreground">Veuillez patienter, la connexion sera retablie automatiquement.</p>
        </div>
      </div>
    );
  }

  if (disconnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="p-8 text-center">
          <h1 className="mb-2 text-xl font-bold text-foreground">La consultation est terminee</h1>
          <p className="mb-4 text-muted-foreground">Merci. Prenez soin de vous.</p>
          <a
            href={exitHref}
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            {exitLabel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-gray-900">
      <div className="relative flex-1">
        {psyIsPresent ? (
          psyVideoTrack ? (
            <VideoTrack trackRef={psyVideoTrack} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center text-white/60">
                <User className="mx-auto mb-4 h-20 w-20 opacity-40" />
                <p>Psychologue connecté</p>
                <p className="mt-1 text-sm opacity-60">Caméra désactivée</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white/60">
              <User className="mx-auto mb-4 h-20 w-20 opacity-40" />
              <p>En attente de votre psychologue...</p>
            </div>
          </div>
        )}

        {localTrack?.publication && (
          <div className="absolute bottom-4 right-4 h-32 w-40 overflow-hidden rounded-lg border-2 border-white/20">
            <VideoTrack trackRef={localTrack} className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 bg-gray-900 px-4 py-4">
        <button
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicOn)}
          className={`rounded-full p-3 ${isMicOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={() => localParticipant.setCameraEnabled(!isCamOn)}
          className={`rounded-full p-3 ${isCamOn ? 'bg-gray-700 text-white' : 'bg-red-600 text-white'}`}
        >
          {isCamOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        <button
          onClick={handleOpenChat}
          className={`relative rounded-full p-3 text-white ${
            chatOpen ? 'bg-[#0D9488]' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Chat texte"
        >
          <MessageSquare className="h-5 w-5" />
          {unreadCount > 0 && !chatOpen && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={handleLeave}
          className="ml-2 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          <PhoneOff className="h-5 w-5" />
          Quitter
        </button>
      </div>

      {chatOpen && (
        <div className="absolute inset-x-0 bottom-[72px] z-40 flex h-[45%] flex-col rounded-t-2xl border-t border-white/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Chat</h3>
            <button
              onClick={handleCloseChat}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <VideoChatPanel
              messages={chatMessages}
              localSender="patient"
              onSend={sendMessage}
            />
          </div>
        </div>
      )}

      <RoomAudioRenderer />
    </div>
  );
}

interface PatientVideoRoomProps {
  token: string;
  wsUrl: string;
  onConnectionFailed: () => void;
  exitHref?: string;
  exitLabel?: string;
  patientName?: string;
  micId?: string;
  camId?: string;
  speakerId?: string;
}

export function PatientVideoRoom({
  token,
  wsUrl,
  onConnectionFailed,
  exitHref,
  exitLabel,
  patientName,
  micId,
  camId,
  speakerId,
}: PatientVideoRoomProps) {
  const options = {
    ...videoRoomOptions,
    audioCaptureDefaults: {
      ...videoRoomOptions.audioCaptureDefaults,
      ...(micId ? { deviceId: micId } : {}),
    },
    videoCaptureDefaults: {
      ...videoRoomOptions.videoCaptureDefaults,
      ...(camId ? { deviceId: camId } : {}),
    },
  };
  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} connect={true} video={true} audio={true} options={options}>
      <PatientLayout
        onConnectionFailed={onConnectionFailed}
        exitHref={exitHref}
        exitLabel={exitLabel}
        patientName={patientName}
        speakerId={speakerId}
      />
    </LiveKitRoom>
  );
}

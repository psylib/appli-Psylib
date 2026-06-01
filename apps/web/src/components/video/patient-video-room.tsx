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
import { Mic, MicOff, VideoIcon, VideoOff, User, PhoneOff } from 'lucide-react';
import { videoRoomOptions } from '@/lib/video/livekit-options';

interface PatientLayoutProps {
  onConnectionFailed: () => void;
}

function PatientLayout({ onConnectionFailed }: PatientLayoutProps) {
  const { localParticipant, isMicrophoneEnabled: isMicOn, isCameraEnabled: isCamOn } = useLocalParticipant();
  const room = useRoomContext();
  const [disconnected, setDisconnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  // Track whether we ever successfully connected — prevents treating a failed
  // initial connection as "consultation terminée"
  const hasConnected = useRef(false);

  useEffect(() => {
    const onConnected = () => { hasConnected.current = true; };
    const onDisconnected = () => {
      if (hasConnected.current) {
        setDisconnected(true);
      } else {
        // Never connected — token expired or room gone, retry from the top
        onConnectionFailed();
      }
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
  const remoteTracks = tracks.filter(t => !t.participant.isLocal);
  const localTrack = tracks.find(t => t.participant.isLocal);
  const psyVideoTrack = remoteTracks.find(t => t.publication != null);

  // Quitter doit toujours aboutir : on affiche l'écran de fin tout de suite,
  // puis on déconnecte la room (best-effort).
  const handleLeave = () => {
    setDisconnected(true);
    void room.disconnect();
  };

  if (reconnecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Reconnexion en cours...</h1>
          <p className="text-muted-foreground">Veuillez patienter, la connexion sera retablie automatiquement.</p>
        </div>
      </div>
    );
  }

  if (disconnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center p-8">
          <h1 className="text-xl font-bold text-foreground mb-2">La consultation est terminee</h1>
          <p className="text-muted-foreground mb-4">Merci. Prenez soin de vous.</p>
          <a
            href="/patient-portal"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Retour a mon espace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex-1 relative">
        {psyIsPresent ? (
          psyVideoTrack ? (
            <VideoTrack trackRef={psyVideoTrack} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white/60">
                <User className="h-20 w-20 mx-auto mb-4 opacity-40" />
                <p>Psychologue connecté</p>
                <p className="text-sm mt-1 opacity-60">Caméra désactivée</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/60">
              <User className="h-20 w-20 mx-auto mb-4 opacity-40" />
              <p>En attente de votre psychologue...</p>
            </div>
          </div>
        )}

        {localTrack?.publication && (
          <div className="absolute bottom-4 right-4 w-40 h-32 rounded-lg overflow-hidden border-2 border-white/20">
            <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
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
          onClick={handleLeave}
          className="ml-2 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          title="Quitter la consultation"
        >
          <PhoneOff className="h-5 w-5" />
          Quitter
        </button>
      </div>

      <RoomAudioRenderer />
    </div>
  );
}

interface PatientVideoRoomProps {
  token: string;
  wsUrl: string;
  onConnectionFailed: () => void;
}

export function PatientVideoRoom({ token, wsUrl, onConnectionFailed }: PatientVideoRoomProps) {
  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} connect={true} video={true} audio={true} options={videoRoomOptions}>
      <PatientLayout onConnectionFailed={onConnectionFailed} />
    </LiveKitRoom>
  );
}

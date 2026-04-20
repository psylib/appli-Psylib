'use client';

import {
  LiveKitRoom,
  useTracks,
  useRoomContext,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track, RoomEvent } from 'livekit-client';
import { useVideoCall } from '@/hooks/use-video-call';
import { VideoControls } from './video-controls';
import { VideoGrid } from './video-grid';
import { useState, useEffect } from 'react';

interface VideoRoomProps {
  token: string;
  wsUrl: string;
  plannedDurationMin: number;
  notesPanel: React.ReactNode;
  onCallEnd: () => void;
}

function VideoLayout({ plannedDurationMin, notesPanel, onCallEnd }: Omit<VideoRoomProps, 'token' | 'wsUrl'>) {
  const [showNotes, setShowNotes] = useState(true);
  const { elapsedSeconds, handleConnected, handleDisconnected, isReconnecting } = useVideoCall({
    onDisconnected: () => {},
  });

  const room = useRoomContext();
  useEffect(() => {
    room.on(RoomEvent.Connected, handleConnected);
    room.on(RoomEvent.Disconnected, handleDisconnected);
    return () => {
      room.off(RoomEvent.Connected, handleConnected);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, handleConnected, handleDisconnected]);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
  ]);

  const remoteTracks = tracks.filter(t => !t.participant.isLocal);
  const localTrack = tracks.find(t => t.participant.isLocal);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Video panel */}
      <div className={`flex flex-col ${showNotes ? 'w-[65%]' : 'w-full'} transition-all`}>
        <div className="flex-1 relative bg-gray-900">
          {isReconnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="text-white text-center">
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
                <p>Reconnexion en cours...</p>
              </div>
            </div>
          )}

          <VideoGrid remoteTracks={remoteTracks} localTrack={localTrack} />
        </div>

        <VideoControls
          elapsedSeconds={elapsedSeconds}
          plannedDurationMin={plannedDurationMin}
          showNotes={showNotes}
          onToggleNotes={() => setShowNotes(!showNotes)}
          onEndCall={onCallEnd}
        />
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="w-[35%] border-l border-border bg-white overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Notes de seance</h2>
          </div>
          <div className="p-4">
            {notesPanel}
          </div>
        </div>
      )}

      <RoomAudioRenderer />
    </div>
  );
}

export function PsyVideoRoom({ token, wsUrl, plannedDurationMin, notesPanel, onCallEnd }: VideoRoomProps) {
  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={true}
      video={true}
      audio={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
      }}
    >
      <VideoLayout
        plannedDurationMin={plannedDurationMin}
        notesPanel={notesPanel}
        onCallEnd={onCallEnd}
      />
    </LiveKitRoom>
  );
}

'use client';

import { VideoTrack } from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { User } from 'lucide-react';

interface VideoGridProps {
  remoteTracks: TrackReferenceOrPlaceholder[];
  localTrack: TrackReferenceOrPlaceholder | undefined;
}

function ParticipantTile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const name = trackRef.participant.name || 'Patient';

  if (!trackRef.publication) {
    return (
      <div className="relative flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-center text-white/60">
          <User className="h-12 w-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg bg-gray-900">
      <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
        {name}
      </div>
    </div>
  );
}

export function VideoGrid({ remoteTracks, localTrack }: VideoGridProps) {
  const count = remoteTracks.length;

  // Grid layout: 1=full, 2=side-by-side, 3=3cols, 4=2x2, 5+=3+2
  const gridClass = (() => {
    switch (count) {
      case 0:
      case 1:
        return 'grid-cols-1 grid-rows-1';
      case 2:
        return 'grid-cols-2 grid-rows-1';
      case 3:
        return 'grid-cols-3 grid-rows-1';
      case 4:
        return 'grid-cols-2 grid-rows-2';
      case 5:
      default:
        return 'grid-cols-3 grid-rows-2';
    }
  })();

  return (
    <div className="relative w-full h-full">
      {count === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white/60">
            <User className="h-20 w-20 mx-auto mb-4 opacity-40" />
            <p className="text-lg">En attente des participants...</p>
          </div>
        </div>
      ) : (
        <div className={`grid ${gridClass} gap-2 h-full p-2`}>
          {remoteTracks.map((track) => (
            <ParticipantTile key={track.participant.identity} trackRef={track} />
          ))}
        </div>
      )}

      {/* Local (psy) PiP */}
      {localTrack?.publication && (
        <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg z-10">
          <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
          <div className="absolute bottom-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-xs text-white">
            Vous
          </div>
        </div>
      )}
    </div>
  );
}

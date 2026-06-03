'use client';

import {
  VideoTrack,
  useIsSpeaking,
  useConnectionQualityIndicator,
} from '@livekit/components-react';
import type { TrackReferenceOrPlaceholder, TrackReference } from '@livekit/components-react';
import { ConnectionQuality } from 'livekit-client';
import { User, MicOff, Signal, MonitorUp } from 'lucide-react';

interface VideoGridProps {
  remoteTracks: TrackReferenceOrPlaceholder[];
  localTrack: TrackReferenceOrPlaceholder | undefined;
  screenShareTracks: TrackReferenceOrPlaceholder[];
}

/** Barres de signal réseau (style Zoom/Meet). */
function QualityBars({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const { quality } = useConnectionQualityIndicator({ participant: trackRef.participant });

  const color =
    quality === ConnectionQuality.Excellent ? 'text-emerald-400'
    : quality === ConnectionQuality.Good ? 'text-yellow-400'
    : quality === ConnectionQuality.Poor ? 'text-red-400'
    : 'text-white/40';

  // On masque l'indicateur quand la qualité est excellente pour ne pas surcharger.
  if (quality === ConnectionQuality.Excellent) return null;

  return (
    <div
      className="flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5"
      title={
        quality === ConnectionQuality.Poor ? 'Connexion faible'
        : quality === ConnectionQuality.Lost ? 'Connexion perdue'
        : 'Connexion correcte'
      }
    >
      <Signal className={`h-3.5 w-3.5 ${color}`} />
    </div>
  );
}

function ParticipantTile({ trackRef }: { trackRef: TrackReferenceOrPlaceholder }) {
  const name = trackRef.participant.name || trackRef.participant.identity || 'Patient';
  const isSpeaking = useIsSpeaking(trackRef.participant);
  const isMuted = !trackRef.participant.isMicrophoneEnabled;

  const ring = isSpeaking ? 'ring-2 ring-[#0D9488] ring-offset-0' : 'ring-0';

  if (!trackRef.publication) {
    return (
      <div className={`relative flex items-center justify-center rounded-lg bg-gray-800 ${ring}`}>
        <div className="text-center text-white/60">
          <User className="mx-auto mb-2 h-12 w-12 opacity-40" />
          <p className="text-sm">{name}</p>
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
          {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
          {name}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg bg-gray-900 transition-shadow ${ring}`}>
      <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
        {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
        {name}
      </div>
      <div className="absolute right-2 top-2">
        <QualityBars trackRef={trackRef} />
      </div>
    </div>
  );
}

export function VideoGrid({ remoteTracks, localTrack, screenShareTracks }: VideoGridProps) {
  const count = remoteTracks.length;
  const screenShare = screenShareTracks[0];

  // ----- Mode partage d'écran : écran en grand + caméras en filmstrip -----
  if (screenShare) {
    const sharerName = screenShare.participant.name || screenShare.participant.identity || 'Participant';
    return (
      <div className="relative h-full w-full p-2">
        <div className="relative h-full w-full overflow-hidden rounded-lg bg-black">
          <VideoTrack trackRef={screenShare as TrackReference} className="h-full w-full object-contain" />
          <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-xs text-white">
            <MonitorUp className="h-3.5 w-3.5 text-[#0D9488]" />
            Partage d&apos;écran · {sharerName}
          </div>
        </div>

        {/* Filmstrip caméras (remote + local) */}
        <div className="absolute right-4 top-4 flex max-h-[80%] w-40 flex-col gap-2 overflow-y-auto">
          {remoteTracks.map((track) => (
            <div key={track.participant.identity} className="aspect-video">
              <ParticipantTile trackRef={track} />
            </div>
          ))}
          {localTrack?.publication && (
            <div className="relative aspect-video overflow-hidden rounded-lg border border-white/20 bg-gray-900">
              <VideoTrack trackRef={localTrack} className="h-full w-full object-cover" />
              <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
                Vous
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----- Mode normal : grille adaptative -----
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
    <div className="relative h-full w-full">
      {count === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-white/60">
            <User className="mx-auto mb-4 h-20 w-20 opacity-40" />
            <p className="text-lg">En attente des participants...</p>
          </div>
        </div>
      ) : (
        <div className={`grid ${gridClass} h-full gap-2 p-2`}>
          {remoteTracks.map((track) => (
            <ParticipantTile key={track.participant.identity} trackRef={track} />
          ))}
        </div>
      )}

      {/* Local (psy) PiP */}
      {localTrack?.publication && (
        <div className="absolute bottom-4 right-4 z-10 h-36 w-48 overflow-hidden rounded-lg border-2 border-white/20 shadow-lg">
          <VideoTrack trackRef={localTrack} className="h-full w-full object-cover" />
          <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
            Vous
          </div>
        </div>
      )}
    </div>
  );
}

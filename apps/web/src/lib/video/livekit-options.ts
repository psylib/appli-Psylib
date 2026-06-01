import type { RoomOptions } from 'livekit-client';
import { VideoPresets } from 'livekit-client';

/**
 * Options LiveKit partagées entre la salle psy et la salle patient, pour une
 * qualité de visio homogène des deux côtés.
 *
 * - adaptiveStream + dynacast : adaptent automatiquement le débit reçu/envoyé
 *   au réseau, au CPU et à la taille de la fenêtre vidéo visible. Côté patient
 *   c'était absent → le patient ne savait pas dégrader sa réception sur réseau
 *   faible (gel d'image).
 * - VP9 (+ backupCodec) : ~30-40 % de qualité en plus à débit égal vs VP8/H264,
 *   avec un encodage de secours automatique pour les rares clients sans VP9.
 * - capture 720p@30 : standard visioconférence (Zoom/Meet), net et stable.
 * - echoCancellation / noiseSuppression / autoGainControl : voix propre.
 *
 * (Le bitrate audio est déjà à 48 kbps "music" par défaut côté LiveKit.)
 */
export const videoRoomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h720.resolution,
  },
  audioCaptureDefaults: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  publishDefaults: {
    videoCodec: 'vp9',
    backupCodec: true,
    red: true,
    dtx: true,
  },
};

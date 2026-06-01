import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  LiveKitRoom,
  VideoTrack,
  useLocalParticipant,
  useRoomContext,
  useTracks,
  isTrackReference,
} from '@livekit/react-native';
import { Track, VideoPresets, type RoomOptions } from 'livekit-client';
import { Colors } from '@/constants/colors';

// Options visio mobile : on adapte le débit au réseau (adaptiveStream/dynacast)
// et on nettoie l'audio (echo/bruit/gain). Le codec reste par défaut (VP8) pour
// préserver le CPU/la batterie/la chauffe du téléphone — pas de VP9 ici.
const mobileRoomOptions: RoomOptions = {
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
};

export default function VideoRoomScreen() {
  const router = useRouter();
  const { token, wsUrl } = useLocalSearchParams<{
    roomName: string;
    token: string;
    wsUrl: string;
  }>();

  const serverUrl = wsUrl ?? 'wss://livekit.psylib.eu';

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token ?? ''}
      connect={true}
      audio={true}
      video={true}
      options={mobileRoomOptions}
      onDisconnected={() => router.back()}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <RoomContent onLeave={() => router.back()} />
    </LiveKitRoom>
  );
}

function RoomContent({ onLeave }: { onLeave: () => void }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const isMuted = localParticipant?.isMicrophoneEnabled === false;
  const isCameraOff = localParticipant?.isCameraEnabled === false;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void room.disconnect().finally(() => onLeave());
      return true;
    });
    return () => sub.remove();
  }, [room, onLeave]);

  const handleLeave = useCallback(() => {
    void room.disconnect().finally(() => onLeave());
  }, [room, onLeave]);

  const toggleMic = useCallback(() => {
    void localParticipant?.setMicrophoneEnabled(isMuted);
  }, [localParticipant, isMuted]);

  const toggleCamera = useCallback(() => {
    void localParticipant?.setCameraEnabled(isCameraOff);
  }, [localParticipant, isCameraOff]);

  return (
    <View style={styles.container}>
      <View style={styles.videoGrid}>
        {tracks.length === 0 ? (
          <View style={styles.noVideo}>
            <Text style={styles.noVideoText}>En attente du patient...</Text>
          </View>
        ) : (
          tracks.filter(isTrackReference).map((track) => (
            <VideoTrack
              key={`${track.participant.identity}-${track.source}`}
              trackRef={track}
              style={styles.videoTrack}
            />
          ))
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={toggleMic}
          accessibilityLabel={isMuted ? 'Activer le microphone' : 'Couper le microphone'}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={handleLeave}
          accessibilityLabel="Terminer la consultation"
        >
          <Text style={styles.leaveIcon}>📵</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
          onPress={toggleCamera}
          accessibilityLabel={isCameraOff ? 'Activer la caméra' : 'Couper la caméra'}
        >
          <Text style={styles.controlIcon}>{isCameraOff ? '📷' : '📹'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  videoGrid: { flex: 1, padding: 8, gap: 8 },
  videoTrack: { flex: 1, borderRadius: 12, overflow: 'hidden', minHeight: 200 },
  noVideo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noVideoText: { color: '#FFF', fontSize: 16, opacity: 0.7 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: 'rgba(255,80,80,0.4)' },
  controlIcon: { fontSize: 24 },
  leaveBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  leaveIcon: { fontSize: 28 },
});

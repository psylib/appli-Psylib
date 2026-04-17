/**
 * Video Consultation — Today's rooms with status and actions
 */
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTodayRooms, useCreateRoom, useGetPsyToken, useEndRoom } from '@/hooks/useVideoRooms';
import type { TodayRoom } from '@/hooks/useVideoRooms';

const STATUS_CONFIG: Record<TodayRoom['status'], { label: string; color: string; bg: string }> = {
  upcoming: { label: 'A venir', color: Colors.muted, bg: `${Colors.muted}15` },
  ready: { label: 'Prete', color: Colors.accent, bg: `${Colors.accent}15` },
  patient_waiting: { label: 'Patient en attente', color: Colors.warning, bg: `${Colors.warning}15` },
  active: { label: 'En cours', color: Colors.success, bg: `${Colors.success}15` },
  ended: { label: 'Terminee', color: Colors.mutedLight, bg: `${Colors.mutedLight}15` },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function VideoScreen() {
  const { data: rooms, isLoading, refetch, isRefetching } = useTodayRooms();
  const createRoom = useCreateRoom();
  const getPsyToken = useGetPsyToken();
  const endRoom = useEndRoom();

  const handleCreateRoom = async (appointmentId: string) => {
    try {
      await createRoom.mutateAsync(appointmentId);
    } catch {
      Alert.alert('Erreur', 'Impossible de creer la salle');
    }
  };

  const handleJoin = async (appointmentId: string) => {
    try {
      const result = await getPsyToken.mutateAsync(appointmentId);
      // Open LiveKit room in browser (mobile doesn't have native LiveKit yet)
      const url = `https://app.psylib.eu/dashboard/video?room=${result.roomName}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erreur', 'Impossible de rejoindre la salle');
    }
  };

  const handleEnd = (appointmentId: string) => {
    Alert.alert('Terminer', 'Voulez-vous terminer cette consultation video ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer',
        style: 'destructive',
        onPress: () => void endRoom.mutateAsync(appointmentId),
      },
    ]);
  };

  const renderRoom = ({ item }: { item: TodayRoom }) => {
    const status = STATUS_CONFIG[item.status];
    const canCreate = item.status === 'upcoming' && !item.roomId;
    const canJoin = ['ready', 'patient_waiting', 'active'].includes(item.status);
    const canEnd = item.status === 'active';

    return (
      <Card elevated style={styles.roomCard}>
        <View style={styles.roomHeader}>
          <View style={styles.roomInfo}>
            <Text style={styles.roomPatient}>{item.patientName}</Text>
            <Text style={styles.roomTime}>
              {formatTime(item.scheduledAt)} · {item.duration} min
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.roomActions}>
          {canCreate && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => void handleCreateRoom(item.appointmentId)}
              loading={createRoom.isPending}
              accessibilityLabel="Preparer la salle video"
            >
              Preparer la salle
            </Button>
          )}
          {canJoin && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => void handleJoin(item.appointmentId)}
              loading={getPsyToken.isPending}
              accessibilityLabel="Rejoindre la consultation video"
            >
              Rejoindre
            </Button>
          )}
          {canEnd && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleEnd(item.appointmentId)}
              accessibilityLabel="Terminer la consultation"
            >
              Terminer
            </Button>
          )}
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <FlatList
        data={rooms ?? []}
        keyExtractor={(item) => item.appointmentId}
        renderItem={renderRoom}
        contentContainerStyle={styles.listContent}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        ListHeaderComponent={
          <Text style={styles.title}>Consultations video</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📹</Text>
            <Text style={styles.emptyText}>Aucune visio aujourd'hui</Text>
            <Text style={styles.emptyDesc}>
              Les consultations video apparaitront ici le jour du rendez-vous.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  listContent: { padding: 20, gap: 12, paddingBottom: 100 },
  title: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: Colors.text, marginBottom: 4 },

  // Room card
  roomCard: { padding: 16, gap: 12 },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  roomInfo: { flex: 1, gap: 4 },
  roomPatient: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', color: Colors.text },
  roomTime: { fontSize: 13, color: Colors.muted },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  roomActions: { flexDirection: 'row', gap: 8 },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', color: Colors.text },
  emptyDesc: { fontSize: 13, color: Colors.muted, textAlign: 'center', paddingHorizontal: 32 },
});

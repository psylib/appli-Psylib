import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { usePatients } from '@/hooks/usePatients';
import { useInstantVideo } from '@/hooks/useVideoRooms';

interface InstantVideoSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function InstantVideoSheet({ visible, onClose }: InstantVideoSheetProps) {
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { data: patientsData } = usePatients(1, 100);
  const instantVideo = useInstantVideo();

  const handleLaunch = async () => {
    try {
      const result = await instantVideo.mutateAsync(selectedPatientId ?? undefined);
      onClose();
      router.push({
        pathname: '/video-room',
        params: { roomName: result.roomName, token: result.token, wsUrl: result.wsUrl },
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de lancer la visio. Verifie ta connexion.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Visio instantanee</Text>
        <Text style={styles.subtitle}>Choisir un patient (optionnel)</Text>

        <ScrollView style={styles.patientList} contentContainerStyle={styles.patientListContent}>
          <TouchableOpacity
            style={[styles.patientItem, selectedPatientId === null && styles.patientItemSelected]}
            onPress={() => setSelectedPatientId(null)}
          >
            <Text style={[styles.patientName, selectedPatientId === null && styles.patientNameSelected]}>
              Sans patient specifique
            </Text>
          </TouchableOpacity>
          {(patientsData?.data ?? []).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.patientItem, selectedPatientId === p.id && styles.patientItemSelected]}
              onPress={() => setSelectedPatientId(p.id)}
            >
              <Text style={[styles.patientName, selectedPatientId === p.id && styles.patientNameSelected]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Button
          onPress={() => void handleLaunch()}
          variant="primary"
          size="lg"
          fullWidth
          loading={instantVideo.isPending}
          accessibilityLabel="Lancer la visio instantanee"
        >
          Lancer la visio
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 16, maxHeight: '70%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 8,
  },
  title: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.muted },
  patientList: { maxHeight: 200 },
  patientListContent: { gap: 8 },
  patientItem: {
    padding: 14, borderRadius: 10, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  patientItemSelected: { backgroundColor: `${Colors.primary}1A`, borderColor: Colors.primary },
  patientName: { fontSize: 14, color: Colors.text, fontFamily: 'DMSans_500Medium' },
  patientNameSelected: { color: Colors.primary, fontFamily: 'DMSans_600SemiBold' },
});

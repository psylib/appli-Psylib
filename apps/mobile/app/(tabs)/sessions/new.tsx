/**
 * New Session Screen — Création d'une nouvelle séance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { useCreateSession } from '@/hooks/useSessions';
import { usePatients } from '@/hooks/usePatients';
import { SessionType } from '@psyscale/shared-types';
import type { CreateSessionDto } from '@psyscale/shared-types';

const SESSION_TYPES: { value: SessionType; label: string; emoji: string }[] = [
  { value: SessionType.INDIVIDUAL, label: 'Individuelle', emoji: '👤' },
  { value: SessionType.GROUP, label: 'Groupe', emoji: '👥' },
  { value: SessionType.ONLINE, label: 'En ligne', emoji: '💻' },
];

export default function NewSessionScreen() {
  const router = useRouter();
  const { patientId: initialPatientId } = useLocalSearchParams<{ patientId?: string }>();

  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId ?? '');
  const [sessionType, setSessionType] = useState<SessionType>(SessionType.INDIVIDUAL);
  const [duration, setDuration] = useState('50');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: patientsData } = usePatients(1, 100);
  const { mutateAsync: createSession, isPending } = useCreateSession();

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (selectedPatientId.length === 0) {
      newErrors.patient = 'Veuillez sélectionner un patient';
    }
    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
      newErrors.duration = 'Durée invalide (15-480 min)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const dto: CreateSessionDto = {
      patientId: selectedPatientId,
      date: new Date().toISOString(),
      duration: parseInt(duration, 10),
      type: sessionType,
      notes: notes.length > 0 ? notes : undefined,
      rate: rate.length > 0 ? parseFloat(rate) : undefined,
    };

    try {
      const session = await createSession(dto);
      router.replace(`/(tabs)/sessions/${session.id}`);
    } catch (err) {
      Alert.alert(
        'Erreur',
        err instanceof Error ? err.message : 'Impossible de créer la séance',
        [{ text: 'OK', style: 'default' }],
      );
    }
  };

  const selectedPatient = (patientsData?.data ?? []).find(
    (p) => p.id === selectedPatientId,
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nouvelle séance',
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              accessibilityLabel="Annuler"
              accessibilityRole="button"
            >
              <Text style={styles.headerButtonText}>Annuler</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Sélection du patient */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Patient</Text>
              {errors.patient != null && (
                <Text style={styles.errorText} accessibilityRole="alert">
                  {errors.patient}
                </Text>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.patientsList}
              >
                {(patientsData?.data ?? []).map((patient) => (
                  <TouchableOpacity
                    key={patient.id}
                    style={[
                      styles.patientChip,
                      selectedPatientId === patient.id && styles.patientChipSelected,
                    ]}
                    onPress={() => setSelectedPatientId(patient.id)}
                    accessibilityLabel={`Sélectionner ${patient.name}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedPatientId === patient.id }}
                  >
                    <Text
                      style={[
                        styles.patientChipText,
                        selectedPatientId === patient.id && styles.patientChipTextSelected,
                      ]}
                    >
                      {patient.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {selectedPatient != null && (
                <Text style={styles.selectedPatient}>
                  Patient sélectionné : {selectedPatient.name}
                </Text>
              )}
            </Card>

            {/* Type de séance */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Type de séance</Text>
              <View style={styles.typeRow}>
                {SESSION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      sessionType === type.value && styles.typeButtonSelected,
                    ]}
                    onPress={() => setSessionType(type.value)}
                    accessibilityLabel={type.label}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sessionType === type.value }}
                  >
                    <Text
                      style={styles.typeEmoji}
                      accessibilityElementsHidden
                    >
                      {type.emoji}
                    </Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        sessionType === type.value && styles.typeLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Durée et tarif */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Détails</Text>
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Input
                    label="Durée (minutes)"
                    value={duration}
                    onChangeText={setDuration}
                    keyboardType="numeric"
                    error={errors.duration}
                    accessibilityLabel="Durée de la séance en minutes"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Input
                    label="Tarif (€, optionnel)"
                    value={rate}
                    onChangeText={setRate}
                    keyboardType="decimal-pad"
                    placeholder="ex: 75"
                    accessibilityLabel="Tarif de la séance en euros"
                  />
                </View>
              </View>
            </Card>

            {/* Notes initiales */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Notes initiales (optionnel)</Text>
              <Input
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholder="Objectifs de la séance, contexte..."
                style={styles.notesInput}
                accessibilityLabel="Notes initiales pour la séance"
              />
            </Card>

            {/* Submit */}
            <Button
              onPress={() => void handleSubmit()}
              variant="primary"
              size="lg"
              fullWidth
              loading={isPending}
              disabled={isPending}
              accessibilityLabel="Créer la séance"
            >
              Créer la séance
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 15,
    color: Colors.muted,
  },
  card: {
    gap: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
  patientsList: {
    gap: 8,
    paddingRight: 4,
  },
  patientChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  patientChipSelected: {
    backgroundColor: `${Colors.primary}1A`,
    borderColor: Colors.primary,
  },
  patientChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.muted,
  },
  patientChipTextSelected: {
    color: Colors.primary,
  },
  selectedPatient: {
    fontSize: 12,
    color: Colors.muted,
    fontStyle: 'italic',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 6,
  },
  typeButtonSelected: {
    backgroundColor: `${Colors.primary}1A`,
    borderColor: Colors.primary,
  },
  typeEmoji: {
    fontSize: 22,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
  },
  typeLabelSelected: {
    color: Colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  notesInput: {
    minHeight: 100,
  },
});

/**
 * AI Exercise Generator — Generate therapeutic exercises + assign to patient
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/usePatients';
import { apiClient } from '@/lib/api';

interface GeneratedExercise {
  title: string;
  description: string;
  instructions: string[];
  steps: string[];
  duration?: string;
  frequency?: string;
  disclaimer?: string;
}

const EXERCISE_TYPES = [
  { key: 'breathing', label: 'Respiration', icon: '🌬️' },
  { key: 'journaling', label: 'Journal', icon: '📝' },
  { key: 'exposure', label: 'Exposition', icon: '🎯' },
  { key: 'mindfulness', label: 'Pleine conscience', icon: '���' },
  { key: 'cognitive', label: 'Cognitif', icon: '🧠' },
] as const;

type ExerciseType = (typeof EXERCISE_TYPES)[number]['key'];

export default function AiExerciseScreen() {
  const { getValidToken } = useAuth();
  const { data: patientsData } = usePatients(1, 100);

  const [theme, setTheme] = useState('');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('breathing');
  const [patientContext, setPatientContext] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [exercise, setExercise] = useState<GeneratedExercise | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const patients = patientsData?.data ?? [];

  const handleGenerate = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    setExercise(null);
    try {
      const token = await getValidToken();
      const result = await apiClient.post<GeneratedExercise>(
        '/ai/generate-exercise',
        {
          theme: theme.trim(),
          exerciseType,
          patientContext: patientContext.trim() || undefined,
        },
        token ?? undefined,
      );
      setExercise(result);
    } catch {
      Alert.alert('Erreur', "Impossible de generer l'exercice");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!exercise || !selectedPatientId) {
      Alert.alert('Patient requis', 'Selectionnez un patient pour assigner l\'exercice');
      return;
    }
    setAssigning(true);
    try {
      const token = await getValidToken();
      const steps = exercise.instructions?.length > 0 ? exercise.instructions : exercise.steps;
      await apiClient.post(
        `/patients/${selectedPatientId}/exercises`,
        {
          title: exercise.title,
          description: `${exercise.description}\n\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
          status: 'assigned',
          createdByAi: true,
        },
        token ?? undefined,
      );
      Alert.alert('Assigne !', 'L\'exercice a ete assigne au patient avec succes.');
    } catch {
      Alert.alert('Erreur', "Impossible d'assigner l'exercice");
    } finally {
      setAssigning(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoIcon}>🧘</Text>
          <Text style={styles.infoTitle}>Generateur d'exercices</Text>
          <Text style={styles.infoText}>
            Generez des exercices therapeutiques personnalises et assignez-les directement.
          </Text>
        </Card>

        {/* Patient selector */}
        <View style={styles.field}>
          <Text style={styles.label}>Patient (optionnel)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !selectedPatientId && styles.chipActive]}
                onPress={() => setSelectedPatientId(null)}
              >
                <Text style={[styles.chipText, !selectedPatientId && styles.chipTextActive]}>
                  Aucun
                </Text>
              </TouchableOpacity>
              {patients.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, selectedPatientId === p.id && styles.chipActive]}
                  onPress={() => setSelectedPatientId(p.id)}
                >
                  <Text style={[styles.chipText, selectedPatientId === p.id && styles.chipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Exercise type */}
        <View style={styles.field}>
          <Text style={styles.label}>Type d'exercice</Text>
          <View style={styles.typeGrid}>
            {EXERCISE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, exerciseType === t.key && styles.typeBtnActive]}
                onPress={() => setExerciseType(t.key)}
              >
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text style={[styles.typeLabel, exerciseType === t.key && styles.typeLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Theme */}
        <View style={styles.field}>
          <Text style={styles.label}>Thematique *</Text>
          <TextInput
            style={styles.input}
            value={theme}
            onChangeText={setTheme}
            placeholder="ex: gestion du stress, affirmation de soi..."
            placeholderTextColor={Colors.mutedLight}
            multiline
          />
        </View>

        {/* Patient context */}
        <View style={styles.field}>
          <Text style={styles.label}>Contexte patient (optionnel)</Text>
          <TextInput
            style={[styles.input, { minHeight: 60 }]}
            value={patientContext}
            onChangeText={setPatientContext}
            placeholder="ex: anxiete sociale, premiere seance, adolescent..."
            placeholderTextColor={Colors.mutedLight}
            multiline
          />
        </View>

        <Button
          onPress={handleGenerate}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!theme.trim()}
          accessibilityLabel="Generer un exercice"
        >
          Generer un exercice
        </Button>

        {/* Result */}
        {exercise && (
          <Card elevated style={styles.resultCard}>
            <Text style={styles.exerciseTitle}>{exercise.title}</Text>
            <Text style={styles.exerciseDesc}>{exercise.description}</Text>

            {/* Steps / Instructions */}
            {((exercise.instructions?.length ?? 0) > 0 || exercise.steps.length > 0) && (
              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Etapes :</Text>
                {(exercise.instructions?.length > 0 ? exercise.instructions : exercise.steps).map(
                  (step, i) => (
                    <Text key={i} style={styles.step}>
                      {i + 1}. {step}
                    </Text>
                  ),
                )}
              </View>
            )}

            {/* Duration & Frequency */}
            {(exercise.duration || exercise.frequency) && (
              <View style={styles.metaRow}>
                {exercise.duration && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Duree</Text>
                    <Text style={styles.metaValue}>{exercise.duration}</Text>
                  </View>
                )}
                {exercise.frequency && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Frequence</Text>
                    <Text style={styles.metaValue}>{exercise.frequency}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Disclaimer */}
            {exercise.disclaimer && (
              <Text style={styles.disclaimer}>{exercise.disclaimer}</Text>
            )}

            {/* Assign button */}
            {selectedPatientId && (
              <Button
                variant="primary"
                onPress={handleAssign}
                loading={assigning}
                fullWidth
                accessibilityLabel={`Assigner a ${selectedPatient?.name ?? 'patient'}`}
              >
                Assigner a {selectedPatient?.name ?? 'patient'}
              </Button>
            )}

            {!selectedPatientId && (
              <Text style={styles.assignHint}>
                Selectionnez un patient ci-dessus pour pouvoir assigner cet exercice.
              </Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  infoCard: { alignItems: 'center', gap: 8, padding: 24 },
  infoIcon: { fontSize: 40 },
  infoTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  infoText: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20 },

  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border, fontSize: 15, color: Colors.text,
    minHeight: 80, textAlignVertical: 'top',
  },

  // Chips
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  chipTextActive: { color: '#FFF' },

  // Type selector
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: `${Colors.accent}15`, borderColor: Colors.accent },
  typeIcon: { fontSize: 16 },
  typeLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  typeLabelActive: { color: Colors.accent },

  // Result
  resultCard: { gap: 12, padding: 20 },
  exerciseTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  exerciseDesc: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  stepsContainer: { gap: 8, marginTop: 8 },
  stepsTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.text },
  step: { fontSize: 14, color: Colors.text, lineHeight: 20, paddingLeft: 8 },

  metaRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  metaItem: { gap: 2 },
  metaLabel: { fontSize: 12, color: Colors.muted },
  metaValue: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.text },

  disclaimer: {
    fontSize: 12, color: Colors.muted, fontStyle: 'italic',
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8,
  },

  assignHint: { fontSize: 13, color: Colors.muted, textAlign: 'center', fontStyle: 'italic' },
});

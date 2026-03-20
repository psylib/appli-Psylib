/**
 * Exercise Detail + Feedback
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePatientExercises, useUpdateExercise } from '@/hooks/usePatientExercises';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: exercises } = usePatientExercises();
  const updateExercise = useUpdateExercise();
  const [feedback, setFeedback] = useState('');

  const exercise = (exercises ?? []).find((e) => e.id === id);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text>Exercice introuvable</Text>
      </SafeAreaView>
    );
  }

  const handleComplete = async () => {
    try {
      await updateExercise.mutateAsync({
        id: exercise.id,
        status: 'completed',
        patientFeedback: feedback || undefined,
      });
      Alert.alert('Bravo !', 'Exercice termine');
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre a jour');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: exercise.title }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Card elevated style={styles.headerCard}>
            <Text style={styles.title}>{exercise.title}</Text>
            <Badge
              label={exercise.status === 'completed' ? 'Termine' : exercise.status === 'assigned' ? 'A faire' : 'En cours'}
              variant={exercise.status === 'completed' ? 'success' : 'primary'}
            />
          </Card>

          <Text style={styles.description}>{exercise.description}</Text>

          {exercise.status !== 'completed' && (
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackLabel}>Votre retour (optionnel)</Text>
              <TextInput
                style={styles.feedbackInput}
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Comment s'est passe l'exercice ?"
                placeholderTextColor={Colors.mutedLight}
                multiline
              />
              <Button
                onPress={handleComplete}
                loading={updateExercise.isPending}
                variant="primary"
                size="lg"
                fullWidth
                accessibilityLabel="Marquer comme termine"
              >
                Marquer comme termine
              </Button>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  headerCard: { alignItems: 'center', gap: 12, padding: 24 },
  title: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.text, textAlign: 'center' },
  description: { fontSize: 15, color: Colors.text, lineHeight: 22 },
  feedbackSection: { gap: 12 },
  feedbackLabel: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  feedbackInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border, fontSize: 15, color: Colors.text,
    minHeight: 100, textAlignVertical: 'top',
  },
});

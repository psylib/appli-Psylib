/**
 * AI Exercise Generator — Generate therapeutic exercises for patients
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

interface GeneratedExercise {
  title: string;
  description: string;
  steps: string[];
}

export default function AiExerciseScreen() {
  const { getValidToken } = useAuth();
  const [theme, setTheme] = useState('');
  const [exercise, setExercise] = useState<GeneratedExercise | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    try {
      const token = await getValidToken();
      const result = await apiClient.post<GeneratedExercise>(
        '/ai/generate-exercise',
        { theme: theme.trim() },
        token ?? undefined,
      );
      setExercise(result);
    } catch {
      Alert.alert('Erreur', 'Impossible de generer l\'exercice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoIcon}>🧘</Text>
          <Text style={styles.infoTitle}>Generateur d'exercices</Text>
          <Text style={styles.infoText}>
            Generez des exercices therapeutiques personnalises pour vos patients.
          </Text>
        </Card>

        <View style={styles.field}>
          <Text style={styles.label}>Thematique</Text>
          <TextInput
            style={styles.input}
            value={theme}
            onChangeText={setTheme}
            placeholder="ex: gestion du stress, affirmation de soi..."
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

        {exercise && (
          <Card elevated style={styles.resultCard}>
            <Text style={styles.exerciseTitle}>{exercise.title}</Text>
            <Text style={styles.exerciseDesc}>{exercise.description}</Text>
            {exercise.steps.length > 0 && (
              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Etapes :</Text>
                {exercise.steps.map((step, i) => (
                  <Text key={i} style={styles.step}>
                    {i + 1}. {step}
                  </Text>
                ))}
              </View>
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
  resultCard: { gap: 12, padding: 20 },
  exerciseTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  exerciseDesc: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  stepsContainer: { gap: 8, marginTop: 8 },
  stepsTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.text },
  step: { fontSize: 14, color: Colors.text, lineHeight: 20, paddingLeft: 8 },
});

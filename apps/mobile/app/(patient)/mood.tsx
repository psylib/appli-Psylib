/**
 * Patient Mood — Slider 1-5 + note + history
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePatientMoodHistory, useSubmitMood } from '@/hooks/usePatientMood';

const MOODS = [
  { value: 1, emoji: '😢', label: 'Tres difficile', color: Colors.mood1 },
  { value: 2, emoji: '😕', label: 'Difficile', color: Colors.mood2 },
  { value: 3, emoji: '😐', label: 'Neutre', color: Colors.mood3 },
  { value: 4, emoji: '🙂', label: 'Bien', color: Colors.mood4 },
  { value: 5, emoji: '😊', label: 'Tres bien', color: Colors.mood5 },
];

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const submitMood = useSubmitMood();
  const { data: history } = usePatientMoodHistory();

  const handleSubmit = async () => {
    if (selectedMood === null) return;
    try {
      await submitMood.mutateAsync({ mood: selectedMood, note: note || undefined });
      setSelectedMood(null);
      setNote('');
      Alert.alert('Merci', 'Votre humeur a ete enregistree');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Comment vous sentez-vous ?</Text>

        {/* Mood selector */}
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.moodButton,
                selectedMood === m.value && { backgroundColor: `${m.color}20`, borderColor: m.color },
              ]}
              onPress={() => setSelectedMood(m.value)}
              accessibilityLabel={m.label}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text style={[styles.moodLabel, selectedMood === m.value && { color: m.color }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Note */}
        {selectedMood !== null && (
          <View style={styles.noteSection}>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Ajouter une note (optionnel)..."
              placeholderTextColor={Colors.mutedLight}
              multiline
            />
            <Button onPress={handleSubmit} loading={submitMood.isPending} variant="primary" size="lg" fullWidth accessibilityLabel="Enregistrer l'humeur">
              Enregistrer
            </Button>
          </View>
        )}

        {/* History */}
        {history && history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historique</Text>
            {history.slice(0, 10).map((entry) => (
              <Card key={entry.id} style={styles.historyItem}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyEmoji}>
                    {MOODS.find((m) => m.value === entry.mood)?.emoji ?? '❓'}
                  </Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyMood}>
                      {MOODS.find((m) => m.value === entry.mood)?.label ?? `Humeur ${entry.mood}`}
                    </Text>
                    {entry.note && <Text style={styles.historyNote} numberOfLines={2}>{entry.note}</Text>}
                  </View>
                  <Text style={styles.historyDate}>
                    {new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 100 },
  title: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text, textAlign: 'center' },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  moodButton: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 16, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: 'transparent',
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 9, fontFamily: 'DMSans_500Medium', color: Colors.muted, textAlign: 'center' },
  noteSection: { gap: 12 },
  noteInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border, fontSize: 15, color: Colors.text,
    minHeight: 80, textAlignVertical: 'top',
  },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.text },
  historyItem: { padding: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyEmoji: { fontSize: 24 },
  historyInfo: { flex: 1, gap: 2 },
  historyMood: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  historyNote: { fontSize: 12, color: Colors.muted },
  historyDate: { fontSize: 12, color: Colors.mutedLight },
});

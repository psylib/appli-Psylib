/**
 * Patient Dashboard — Next appointment, mood prompt, active exercises
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { usePatientAuth } from '@/hooks/usePatientAuth';
import { usePatientExercises } from '@/hooks/usePatientExercises';

export default function PatientDashboardScreen() {
  const router = useRouter();
  const { patient } = usePatientAuth();
  const { data: exercises } = usePatientExercises();

  const activeExercises = (exercises ?? []).filter((e) => e.status !== 'completed' && e.status !== 'skipped');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Bonjour {patient?.name?.split(' ')[0] ?? ''}</Text>

        {/* Mood prompt */}
        <Card elevated style={styles.moodCard}>
          <Text style={styles.moodTitle}>Comment allez-vous aujourd'hui ?</Text>
          <TouchableOpacity
            style={styles.moodButton}
            onPress={() => router.push('/(patient)/mood')}
          >
            <Text style={styles.moodButtonText}>Enregistrer mon humeur</Text>
          </TouchableOpacity>
        </Card>

        {/* Active exercises */}
        {activeExercises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exercices en cours ({activeExercises.length})</Text>
            {activeExercises.slice(0, 3).map((ex) => (
              <TouchableOpacity
                key={ex.id}
                style={styles.exerciseItem}
                onPress={() => router.push(`/(patient)/exercises/${ex.id}`)}
              >
                <Text style={styles.exerciseTitle}>{ex.title}</Text>
                <Text style={styles.exerciseStatus}>
                  {ex.status === 'assigned' ? 'A faire' : 'En cours'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(patient)/journal/new')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionLabel}>Ecrire dans mon journal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(patient)/messages')}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Ecrire a mon psy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 100 },
  greeting: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: Colors.text },
  moodCard: { alignItems: 'center', gap: 12, padding: 24, backgroundColor: `${Colors.accent}08` },
  moodTitle: { fontSize: 16, fontFamily: 'DMSans_500Medium', color: Colors.text },
  moodButton: {
    backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
  },
  moodButtonText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#FFF' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.text },
  exerciseItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  exerciseTitle: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.text, flex: 1 },
  exerciseStatus: { fontSize: 12, color: Colors.accent },
  actions: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, alignItems: 'center', gap: 8, padding: 20,
    backgroundColor: Colors.surfaceElevated, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.text, textAlign: 'center' },
});

/**
 * Patient Exercises List
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';
import { usePatientExercises } from '@/hooks/usePatientExercises';

const STATUS_LABELS: Record<string, string> = {
  assigned: 'A faire',
  in_progress: 'En cours',
  completed: 'Termine',
  skipped: 'Passe',
};

export default function ExercisesScreen() {
  const router = useRouter();
  const { data: exercises, isLoading } = usePatientExercises();

  return (
    <>
      <Stack.Screen options={{ title: 'Exercices' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            data={exercises ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => router.push(`/(patient)/exercises/${item.id}`)}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                </View>
                <Badge
                  label={STATUS_LABELS[item.status] ?? item.status}
                  variant={item.status === 'completed' ? 'success' : item.status === 'assigned' ? 'primary' : 'default'}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🧘</Text>
                <Text style={styles.emptyTitle}>Aucun exercice</Text>
                <Text style={styles.emptySubtitle}>Votre psychologue n'a pas encore assigne d'exercice.</Text>
              </View>
            }
            contentContainerStyle={styles.list}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.text },
  itemDesc: { fontSize: 13, color: Colors.muted, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_500Medium', color: Colors.muted },
  emptySubtitle: { fontSize: 13, color: Colors.mutedLight, textAlign: 'center' },
});

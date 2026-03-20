/**
 * Journal Entry Detail
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { useJournalEntry } from '@/hooks/usePatientJournal';

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useJournalEntry(id ?? '');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text>Entree introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: new Date(entry.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'long',
          }),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.meta}>
            <Text style={styles.date}>
              {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Text>
            {entry.isPrivate && <Text style={styles.private}>🔒 Prive</Text>}
          </View>

          <Card elevated style={styles.contentCard}>
            <Text style={styles.entryText}>{entry.content}</Text>
          </Card>

          {entry.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {entry.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
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
  content: { padding: 20, gap: 16, paddingBottom: 100 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 14, color: Colors.muted, textTransform: 'capitalize' },
  private: { fontSize: 13, color: Colors.accent },
  contentCard: { padding: 20 },
  entryText: { fontSize: 16, color: Colors.text, lineHeight: 24 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: `${Colors.warm}15`, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, color: Colors.warm },
});

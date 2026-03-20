/**
 * Patient Journal — List entries
 */
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { usePatientJournal } from '@/hooks/usePatientJournal';

export default function JournalScreen() {
  const router = useRouter();
  const { data: entries, isLoading } = usePatientJournal();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Journal',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(patient)/journal/new')}
              style={{ paddingHorizontal: 12 }}
            >
              <Text style={{ fontSize: 14, color: Colors.accent, fontWeight: '600' }}>+ Ecrire</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            data={entries ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => router.push(`/(patient)/journal/${item.id}`)}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemDate}>
                    {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </Text>
                  {item.isPrivate && <Text style={styles.privateBadge}>🔒</Text>}
                </View>
                <Text style={styles.itemContent} numberOfLines={3}>{item.content}</Text>
                {item.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag) => (
                      <Text key={tag} style={styles.tag}>{tag}</Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📔</Text>
                <Text style={styles.emptyTitle}>Aucune entree</Text>
                <Text style={styles.emptySubtitle}>Commencez a ecrire dans votre journal.</Text>
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
    backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDate: { fontSize: 12, color: Colors.muted },
  privateBadge: { fontSize: 14 },
  itemContent: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { fontSize: 11, color: Colors.warm, backgroundColor: `${Colors.warm}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_500Medium', color: Colors.muted },
  emptySubtitle: { fontSize: 13, color: Colors.mutedLight },
});

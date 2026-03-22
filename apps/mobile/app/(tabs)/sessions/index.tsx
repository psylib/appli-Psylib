/**
 * Sessions List Screen — Liste des séances
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SessionListItem } from '@/components/SessionListItem';
import { Colors } from '@/constants/colors';
import { useSessions } from '@/hooks/useSessions';
import type { Session } from '@psyscale/shared-types';

const FILTER_OPTIONS = [
  { key: 'all', label: 'Toutes' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week', label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
] as const;

type FilterKey = (typeof FILTER_OPTIONS)[number]['key'];

function filterSessions(sessions: Session[], filter: FilterKey): Session[] {
  const now = new Date();
  if (filter === 'all') return sessions;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return sessions.filter((session) => {
    const date = new Date(session.date);
    switch (filter) {
      case 'today':
        return date >= startOfDay;
      case 'week':
        return date >= startOfWeek;
      case 'month':
        return date >= startOfMonth;
      default:
        return true;
    }
  });
}

export default function SessionsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const { data, isLoading, isRefetching, refetch } = useSessions(1, 100);

  const filtered = filterSessions(data?.data ?? [], activeFilter);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Séances',
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/sessions/new')}
              style={styles.headerButton}
              accessibilityLabel="Créer une nouvelle séance"
              accessibilityRole="button"
            >
              <Text style={styles.headerButtonText}>+ Nouveau</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Filtres */}
        <View style={styles.filtersContainer}>
          <FlatList
            data={FILTER_OPTIONS}
            horizontal
            keyExtractor={(item) => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  activeFilter === item.key && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(item.key)}
                accessibilityLabel={`Filtrer: ${item.label}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: activeFilter === item.key }}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === item.key && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
          {data != null && (
            <Text style={styles.count} accessibilityLiveRegion="polite">
              {filtered.length} séance{filtered.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loading} accessibilityLabel="Chargement des séances">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList<Session>
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SessionListItem
                session={item}
                onPress={(id) => router.push(`/(tabs)/sessions/${id}`)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={Colors.primary}
                accessibilityLabel="Actualiser la liste des séances"
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={64} color={Colors.mutedLight} />
                <Text style={styles.emptyTitle}>Aucune seance</Text>
                <Text style={styles.emptySubtitle}>
                  {activeFilter !== 'all'
                    ? 'Essayez de changer le filtre de date'
                    : 'Creez votre premiere seance avec le bouton +'}
                </Text>
              </View>
            }
            contentContainerStyle={[
              styles.list,
              filtered.length === 0 && styles.listEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  filtersList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 12, // Fixed WCAG: was 7pt, now 12pt for 44pt min touch target
    borderRadius: 99,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.muted,
  },
  filterTextActive: {
    color: Colors.white,
  },
  count: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    fontSize: 12,
    color: Colors.muted,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 100,
  },
  listEmpty: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

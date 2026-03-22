/**
 * Patients List Screen — Search + list with Ionicons
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PatientListItem } from '@/components/PatientListItem';
import { SkeletonListItem } from '@/components/SkeletonCard';
import { Colors } from '@/constants/colors';
import { usePatients } from '@/hooks/usePatients';
import type { Patient } from '@psyscale/shared-types';

export default function PatientsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isRefetching, refetch } = usePatients(1, 50);

  const filtered = (data?.data ?? []).filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (patient.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderItem = ({ item }: { item: Patient }) => (
    <PatientListItem
      patient={item}
      onPress={(id) => router.push(`/(tabs)/patients/${id}`)}
    />
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Patients',
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/patients/new')}
              style={styles.headerButton}
              accessibilityLabel="Ajouter un patient"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={Colors.muted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher un patient..."
              placeholderTextColor={Colors.mutedLight}
              returnKeyType="search"
              clearButtonMode="while-editing"
              accessibilityLabel="Rechercher un patient"
              accessibilityHint="Filtrer la liste par nom ou email"
            />
          </View>
          {data != null && (
            <Text style={styles.count} accessibilityLiveRegion="polite">
              {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {isLoading ? (
          <View>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </View>
        ) : (
          <FlatList<Patient>
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={() => void refetch()}
                tintColor={Colors.primary}
                accessibilityLabel="Actualiser la liste des patients"
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={64} color={Colors.mutedLight} />
                <Text style={styles.emptyTitle}>
                  {searchQuery.length > 0 ? 'Aucun resultat' : 'Aucun patient'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.length > 0
                    ? `Aucun patient ne correspond a "${searchQuery}"`
                    : 'Ajoutez votre premier patient pour commencer'}
                </Text>
                {searchQuery.length === 0 && (
                  <TouchableOpacity
                    style={styles.emptyCta}
                    onPress={() => router.push('/(tabs)/patients/new')}
                    accessibilityLabel="Ajouter un patient"
                  >
                    <Ionicons name="add" size={18} color={Colors.white} />
                    <Text style={styles.emptyCtaText}>Ajouter un patient</Text>
                  </TouchableOpacity>
                )}
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: Colors.text,
  },
  count: {
    fontSize: 12,
    color: Colors.muted,
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
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
    minHeight: 44,
  },
  emptyCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});

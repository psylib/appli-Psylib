/**
 * Patients List Screen — Liste paginée des patients
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { PatientListItem } from '@/components/PatientListItem';
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
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon} accessibilityElementsHidden>
              🔍
            </Text>
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
          <View style={styles.loading} accessibilityLabel="Chargement des patients">
            <ActivityIndicator size="large" color={Colors.primary} />
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
                <Text style={styles.emptyEmoji} accessibilityElementsHidden>
                  👥
                </Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery.length > 0 ? 'Aucun résultat' : 'Aucun patient'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery.length > 0
                    ? `Aucun patient ne correspond à "${searchQuery}"`
                    : 'Ajoutez votre premier patient depuis le bureau'}
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
  searchIcon: {
    fontSize: 16,
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
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
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

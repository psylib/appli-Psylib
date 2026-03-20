/**
 * Patient Detail Screen — Fiche patient complète
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SessionListItem } from '@/components/SessionListItem';
import { Colors } from '@/constants/colors';
import { usePatient } from '@/hooks/usePatients';
import { useSessions } from '@/hooks/useSessions';
import { PatientStatus } from '@psyscale/shared-types';

const STATUS_LABELS: Record<PatientStatus, string> = {
  [PatientStatus.ACTIVE]: 'Actif',
  [PatientStatus.INACTIVE]: 'Inactif',
  [PatientStatus.ARCHIVED]: 'Archivé',
};

const STATUS_VARIANTS: Record<PatientStatus, 'success' | 'warning' | 'default'> = {
  [PatientStatus.ACTIVE]: 'success',
  [PatientStatus.INACTIVE]: 'warning',
  [PatientStatus.ARCHIVED]: 'default',
};

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: patient,
    isLoading: patientLoading,
    refetch: refetchPatient,
    isRefetching,
  } = usePatient(id ?? '');

  const { data: sessionsData, isLoading: sessionsLoading } = useSessions(
    1,
    10,
    id,
  );

  if (patientLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Patient' }} />
        <View style={styles.loading} accessibilityLabel="Chargement du patient">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </>
    );
  }

  if (patient == null) {
    return (
      <>
        <Stack.Screen options={{ title: 'Introuvable' }} />
        <View style={styles.loading}>
          <Text style={styles.notFound}>Patient introuvable</Text>
        </View>
      </>
    );
  }

  const initials = patient.name
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Stack.Screen
        options={{
          title: patient.name,
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetchPatient()}
              tintColor={Colors.primary}
              accessibilityLabel="Actualiser la fiche patient"
            />
          }
        >
          {/* Header patient */}
          <Card elevated style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View
                style={styles.avatar}
                accessibilityLabel={`Initiales du patient: ${initials}`}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Badge
                  label={STATUS_LABELS[patient.status]}
                  variant={STATUS_VARIANTS[patient.status]}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.details}>
              {patient.email != null && patient.email.length > 0 && (
                <InfoRow label="Email" value={patient.email} />
              )}
              {patient.phone != null && patient.phone.length > 0 && (
                <InfoRow label="Téléphone" value={patient.phone} />
              )}
              {patient.birthDate != null && (
                <InfoRow
                  label="Date de naissance"
                  value={new Date(patient.birthDate).toLocaleDateString('fr-FR')}
                />
              )}
              {patient.source != null && patient.source.length > 0 && (
                <InfoRow label="Source" value={patient.source} />
              )}
              <InfoRow
                label="Créé le"
                value={new Date(patient.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/(tabs)/sessions/new?patientId=${patient.id}`)}
              accessibilityLabel={`Nouvelle séance avec ${patient.name}`}
              accessibilityRole="button"
              activeOpacity={0.75}
            >
              <Text style={styles.actionEmoji} accessibilityElementsHidden>
                ➕
              </Text>
              <Text style={styles.actionText}>Nouvelle séance</Text>
            </TouchableOpacity>
          </View>

          {/* Séances récentes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Séances ({sessionsData?.total ?? 0})
            </Text>

            {sessionsLoading ? (
              <View style={styles.loadingSmall} accessibilityLabel="Chargement des séances">
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : sessionsData == null || sessionsData.data.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Aucune séance enregistrée</Text>
              </View>
            ) : (
              <View style={styles.sessionsList}>
                {sessionsData.data.map((session) => (
                  <SessionListItem
                    key={session.id}
                    session={session}
                    onPress={(sid) => router.push(`/(tabs)/sessions/${sid}`)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={infoStyles.row}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '500',
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  notFound: {
    fontSize: 16,
    color: Colors.muted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  profileCard: {
    gap: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  patientName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  details: {
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    minHeight: 50,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  loadingSmall: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sessionsList: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.muted,
  },
});

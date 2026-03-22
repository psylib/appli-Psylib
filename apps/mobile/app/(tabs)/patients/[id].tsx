/**
 * Patient Detail Screen — Hero section + segmented tabs (Profil | Seances | Messages)
 */

import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SessionListItem } from '@/components/SessionListItem';
import { Colors } from '@/constants/colors';
import { usePatient } from '@/hooks/usePatients';
import { useSessions } from '@/hooks/useSessions';
import { PatientStatus } from '@psyscale/shared-types';

const STATUS_LABELS: Record<PatientStatus, string> = {
  [PatientStatus.ACTIVE]: 'Actif',
  [PatientStatus.INACTIVE]: 'Inactif',
  [PatientStatus.ARCHIVED]: 'Archive',
};

const STATUS_VARIANTS: Record<PatientStatus, 'success' | 'warning' | 'default'> = {
  [PatientStatus.ACTIVE]: 'success',
  [PatientStatus.INACTIVE]: 'warning',
  [PatientStatus.ARCHIVED]: 'default',
};

const STATUS_BORDER_COLORS: Record<PatientStatus, string> = {
  [PatientStatus.ACTIVE]: Colors.success,
  [PatientStatus.INACTIVE]: Colors.warning,
  [PatientStatus.ARCHIVED]: Colors.mutedLight,
};

const TABS = ['Profil', 'Seances', 'Messages'];

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

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
          <Ionicons name="person-outline" size={48} color={Colors.mutedLight} />
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

  const followSince = new Date(patient.createdAt).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: patient.name,
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              style={styles.overflowButton}
              accessibilityLabel="Plus d'options"
              accessibilityRole="button"
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={Colors.text} />
            </TouchableOpacity>
          ),
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
          {/* Hero section */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.avatar,
                { borderColor: STATUS_BORDER_COLORS[patient.status] },
              ]}
              accessibilityLabel={`Initiales: ${initials}`}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.followSince}>Suivi depuis {followSince}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{sessionsData?.total ?? 0}</Text>
                <Text style={styles.heroStatLabel}>seances</Text>
              </View>
              <View style={styles.heroDivider} />
              <Badge
                label={STATUS_LABELS[patient.status]}
                variant={STATUS_VARIANTS[patient.status]}
              />
            </View>
          </View>

          {/* Segmented Tabs */}
          <SegmentedTabs
            tabs={TABS}
            activeIndex={activeTab}
            onChange={setActiveTab}
          />

          {/* Tab Content */}
          {activeTab === 0 && (
            <ProfileTab patient={patient} />
          )}
          {activeTab === 1 && (
            <SessionsTab
              sessionsData={sessionsData}
              sessionsLoading={sessionsLoading}
              patientId={patient.id}
              patientName={patient.name}
              router={router}
            />
          )}
          {activeTab === 2 && (
            <MessagesTab />
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function ProfileTab({ patient }: { patient: any }) {
  return (
    <Card elevated style={styles.profileCard}>
      <View style={styles.details}>
        {patient.email != null && patient.email.length > 0 && (
          <InfoRow icon="mail-outline" label="Email" value={patient.email} />
        )}
        {patient.phone != null && patient.phone.length > 0 && (
          <InfoRow icon="call-outline" label="Telephone" value={patient.phone} />
        )}
        {patient.birthDate != null && (
          <InfoRow
            icon="calendar-outline"
            label="Date de naissance"
            value={new Date(patient.birthDate).toLocaleDateString('fr-FR')}
          />
        )}
        {patient.source != null && patient.source.length > 0 && (
          <InfoRow icon="navigate-outline" label="Source" value={patient.source} />
        )}
        <InfoRow
          icon="time-outline"
          label="Cree le"
          value={new Date(patient.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        />
      </View>
    </Card>
  );
}

function SessionsTab({
  sessionsData,
  sessionsLoading,
  patientId,
  patientName,
  router,
}: {
  sessionsData: any;
  sessionsLoading: boolean;
  patientId: string;
  patientName: string;
  router: any;
}) {
  return (
    <View style={styles.section}>
      {sessionsLoading ? (
        <View style={styles.loadingSmall} accessibilityLabel="Chargement des seances">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : sessionsData == null || sessionsData.data.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={Colors.mutedLight} />
          <Text style={styles.emptyTitle}>Aucune seance</Text>
          <Text style={styles.emptyText}>Commencez le suivi de ce patient</Text>
        </View>
      ) : (
        <View style={styles.sessionsList}>
          {sessionsData.data.map((session: any) => (
            <SessionListItem
              key={session.id}
              session={session}
              onPress={(sid) => router.push(`/(tabs)/sessions/${sid}`)}
            />
          ))}
        </View>
      )}

      {/* New session button — full width at bottom */}
      <TouchableOpacity
        style={styles.newSessionButton}
        onPress={() => router.push(`/(tabs)/sessions/new?patientId=${patientId}`)}
        accessibilityLabel={`Nouvelle seance avec ${patientName}`}
        accessibilityRole="button"
        activeOpacity={0.75}
      >
        <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.newSessionText}>Nouvelle seance</Text>
      </TouchableOpacity>
    </View>
  );
}

function MessagesTab() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={48} color={Colors.mutedLight} />
      <Text style={styles.emptyTitle}>Messages</Text>
      <Text style={styles.emptyText}>La messagerie sera bientot disponible</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={infoStyles.row} accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={16} color={Colors.muted} style={infoStyles.icon} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  icon: {
    marginTop: 2,
    flexShrink: 0,
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
    gap: 12,
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
  overflowButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hero
  heroSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  patientName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  followSince: {
    fontSize: 13,
    color: Colors.muted,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  heroStat: {
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  heroStatLabel: {
    fontSize: 12,
    color: Colors.muted,
  },
  heroDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  // Profile tab
  profileCard: {
    gap: 16,
  },
  details: {
    gap: 14,
  },
  // Sessions tab
  section: {
    gap: 12,
  },
  loadingSmall: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  sessionsList: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  newSessionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  // Empty states
  emptyState: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
  },
});

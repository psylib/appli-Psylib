/**
 * Dashboard — Accueil
 * Salutation + 4 KPI cards + timeline RDV du jour + quick actions + activation checklist
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { KpiCard } from '@/components/KpiCard';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStats, useTodayAppointments, useDashboardChecklist } from '@/hooks/useDashboard';
import { useUnreadCount } from '@/hooks/useNotifications';

function formatDateFR(): string {
  const now = new Date();
  const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
  const months = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
  ];
  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { name } = useAuthStore();
  const unreadCount = useUnreadCount();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: appointments, refetch: refetchAppts } = useTodayAppointments();
  const { data: checklist } = useDashboardChecklist();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchAppts()]);
    setRefreshing(false);
  };

  const displayName = name ? `Dr. ${name.split(' ').pop()}` : 'Docteur';
  const incompleteChecklist = checklist?.filter((c) => !c.completed) ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Bonjour {displayName}</Text>
            <Text style={styles.date}>{formatDateFR()}</Text>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push('/notifications')}
            accessibilityLabel={`Notifications, ${unreadCount} non lues`}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* KPI Cards 2x2 */}
        {statsLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ paddingVertical: 40 }} />
        ) : (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <KpiCard
                title="Patients actifs"
                value={String(stats?.activePatients ?? 0)}
                accentColor={Colors.primary}
              />
              <KpiCard
                title="Seances ce mois"
                value={String(stats?.sessionsThisMonth ?? 0)}
                accentColor={Colors.accent}
              />
            </View>
            <View style={styles.kpiRow}>
              <KpiCard
                title="Revenus"
                value={`${stats?.revenueThisMonth ?? 0} €`}
                accentColor={Colors.warm}
              />
              <KpiCard
                title="RDV a venir"
                value={String(stats?.upcomingAppointments ?? 0)}
                accentColor={Colors.info}
              />
            </View>
          </View>
        )}

        {/* Today's appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aujourd'hui</Text>
          {appointments && appointments.length > 0 ? (
            <View style={styles.appointmentsList}>
              {appointments.map((appt) => (
                <TouchableOpacity
                  key={appt.id}
                  style={styles.appointmentItem}
                  onPress={() => router.push(`/(tabs)/patients/${appt.patient.id}`)}
                  accessibilityLabel={`${formatTime(appt.scheduledAt)} ${appt.patient.name}`}
                >
                  <Text style={styles.appointmentTime}>{formatTime(appt.scheduledAt)}</Text>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentPatient}>{appt.patient.name}</Text>
                    {appt.type && <Text style={styles.appointmentType}>{appt.type}</Text>}
                  </View>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: appt.status === 'confirmed' ? Colors.success : Colors.warning },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun RDV prevu aujourd'hui</Text>
            </View>
          )}
        </View>

        {/* Activation checklist for new users */}
        {incompleteChecklist.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pour commencer</Text>
            <View style={styles.checklistContainer}>
              {incompleteChecklist.map((item) => (
                <View key={item.key} style={styles.checklistItem}>
                  <Text style={styles.checklistCircle}>○</Text>
                  <Text style={styles.checklistLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: `${Colors.primary}15` }]}
            onPress={() => router.push('/(tabs)/patients/new')}
            accessibilityLabel="Ajouter un patient"
          >
            <Text style={styles.quickActionIcon}>👤</Text>
            <Text style={styles.quickActionLabel}>+ Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: `${Colors.accent}15` }]}
            onPress={() => router.push('/(tabs)/sessions/new')}
            accessibilityLabel="Nouvelle seance"
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionLabel}>+ Seance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: `${Colors.warm}15` }]}
            onPress={() => router.push('/(tabs)/calendar')}
            accessibilityLabel="Voir le calendrier"
          >
            <Text style={styles.quickActionIcon}>📅</Text>
            <Text style={styles.quickActionLabel}>+ RDV</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: Colors.text, letterSpacing: -0.5 },
  date: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.muted, marginTop: 2 },
  notifButton: { position: 'relative', padding: 8 },
  notifIcon: { fontSize: 24 },
  notifBadge: {
    position: 'absolute', top: 2, right: 2,
    backgroundColor: Colors.error, borderRadius: 9, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  notifBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  kpiGrid: { gap: 12 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.text },
  appointmentsList: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  appointmentItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  appointmentTime: { fontSize: 15, fontFamily: 'DMMono_400Regular', color: Colors.primary, width: 50 },
  appointmentInfo: { flex: 1, gap: 2 },
  appointmentPatient: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.text },
  appointmentType: { fontSize: 12, color: Colors.muted },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emptyState: {
    padding: 24, alignItems: 'center', backgroundColor: Colors.surfaceElevated,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
  },
  emptyText: { fontSize: 14, color: Colors.muted },
  checklistContainer: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistCircle: { fontSize: 16, color: Colors.muted },
  checklistLabel: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.text },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 14, gap: 6 },
  quickActionIcon: { fontSize: 24 },
  quickActionLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.text },
});

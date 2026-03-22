/**
 * Dashboard — Accueil
 * Header greeting (no "Dr.") + [+] [bell] + hero today card + 2 KPI + checklist + quick actions + week strip
 */
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { KpiCard } from '@/components/KpiCard';
import { HeroTodayCard } from '@/components/HeroTodayCard';
import { WeekStrip } from '@/components/WeekStrip';
import { SkeletonKpiRow } from '@/components/SkeletonCard';
import { ProfileSheet } from '@/components/ProfileSheet';
import { NotificationDrawer } from '@/components/NotificationDrawer';
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

export default function DashboardScreen() {
  const router = useRouter();
  const { name } = useAuthStore();
  const unreadCount = useUnreadCount();

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: appointments, refetch: refetchAppts } = useTodayAppointments();
  const { data: checklist } = useDashboardChecklist();

  const [refreshing, setRefreshing] = React.useState(false);
  const [profileVisible, setProfileVisible] = React.useState(false);
  const [notifVisible, setNotifVisible] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchAppts()]);
    setRefreshing(false);
  };

  // Extract first name — psychologues are NOT doctors, no "Dr." prefix
  const displayName = name
    ? name.split(' ')[0]
    : 'Psychologue';

  const initials = (name ?? 'U')
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const incompleteChecklist = checklist?.filter((c) => !c.completed) ?? [];

  // Week strip appointment dates
  const weekAppointmentDates = useMemo(() => {
    if (!appointments) return new Set<string>();
    return new Set(appointments.map((a) => new Date(a.scheduledAt).toDateString()));
  }, [appointments]);

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
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => setProfileVisible(true)}
            accessibilityLabel="Ouvrir le profil"
            accessibilityRole="button"
          >
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>{initials}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Bonjour {displayName}</Text>
            <Text style={styles.date}>{formatDateFR()}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push('/(tabs)/sessions/new')}
              accessibilityLabel="Nouvelle seance"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={22} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setNotifVisible(true)}
              accessibilityLabel={`Notifications, ${unreadCount} non lues`}
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={22} color={Colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Today Card */}
        <HeroTodayCard
          appointments={appointments ?? []}
          onAppointmentPress={(patientId) => router.push(`/(tabs)/patients/${patientId}`)}
        />

        {/* KPI Cards — 2 cards only (Revenus moved to Analytics) */}
        {statsLoading ? (
          <SkeletonKpiRow />
        ) : (
          <View style={styles.kpiRow}>
            <KpiCard
              title="Patients actifs"
              value={String(stats?.activePatients ?? 0)}
              accentColor={Colors.primary}
              icon="people"
            />
            <KpiCard
              title="Seances ce mois"
              value={String(stats?.sessionsThisMonth ?? 0)}
              accentColor={Colors.accent}
              icon="document-text"
            />
          </View>
        )}

        {/* Activation checklist for new users */}
        {incompleteChecklist.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pour commencer</Text>
            <View style={styles.checklistContainer}>
              {incompleteChecklist.map((item) => (
                <View key={item.key} style={styles.checklistItem}>
                  <Ionicons name="ellipse-outline" size={16} color={Colors.muted} />
                  <Text style={styles.checklistLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions — 2 buttons only (RDV via Agenda tab) */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: `${Colors.primary}10` }]}
            onPress={() => router.push('/(tabs)/patients/new')}
            accessibilityLabel="Ajouter un patient"
          >
            <View style={[styles.quickActionIconCircle, { backgroundColor: `${Colors.primary}20` }]}>
              <Ionicons name="person-add-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>+ Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: `${Colors.accent}10` }]}
            onPress={() => router.push('/(tabs)/sessions/new')}
            accessibilityLabel="Nouvelle seance"
          >
            <View style={[styles.quickActionIconCircle, { backgroundColor: `${Colors.accent}20` }]}>
              <Ionicons name="create-outline" size={20} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionLabel}>+ Seance</Text>
          </TouchableOpacity>
        </View>

        {/* Week Strip */}
        <WeekStrip
          appointmentDates={weekAppointmentDates}
          onDayPress={() => router.push('/(tabs)/calendar')}
        />
      </ScrollView>

      {/* Profile Sheet */}
      <ProfileSheet visible={profileVisible} onClose={() => setProfileVisible(false)} />

      {/* Notification Drawer */}
      <NotificationDrawer
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={[]}
        onMarkAllRead={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarButton: {
    flexShrink: 0,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerCenter: { flex: 1 },
  greeting: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.muted,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  notifBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  kpiRow: { flexDirection: 'row', gap: 12 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.text },
  checklistContainer: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 12,
  },
  checklistItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistLabel: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.text },
  quickActions: { flexDirection: 'row', gap: 12 },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    gap: 10,
  },
  quickActionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.text,
  },
});

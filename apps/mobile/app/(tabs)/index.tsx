import React, { useState, useMemo } from 'react';
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
import { Colors } from '@/constants/colors';
import { DashboardHeader } from '@/components/DashboardHeader';
import { WeekStrip } from '@/components/WeekStrip';
import { DayTimeline } from '@/components/DayTimeline';
import { ProfileSheet } from '@/components/ProfileSheet';
import { NotificationDrawer } from '@/components/NotificationDrawer';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStats, useTodayAppointments } from '@/hooks/useDashboard';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useAppointmentsByDate } from '@/hooks/useAppointmentsByDate';
import { IconAdd } from '@/components/icons/AppIcons';

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAYS_LONG = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function formatSectionLabel(date: Date): string {
  return `${DAYS_LONG[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { name } = useAuthStore();
  const unreadCount = useUnreadCount();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [profileVisible, setProfileVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useDashboardStats();
  const { data: todayAppts, refetch: refetchToday } = useTodayAppointments();
  const { appointments, isLoading: apptLoading, refetch: refetchAppts } = useAppointmentsByDate(selectedDate);

  const firstName = name ? name.split(' ')[0] ?? 'Psy' : 'Psy';

  const weekAppointmentDates = useMemo(() => {
    if (!todayAppts) return new Set<string>();
    return new Set(todayAppts.map((a) => new Date(a.scheduledAt).toDateString()));
  }, [todayAppts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchToday(), refetchAppts()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <DashboardHeader
        firstName={firstName}
        todayCount={todayAppts?.length ?? 0}
        activePatients={stats?.activePatients ?? 0}
        sessionsThisMonth={stats?.sessionsThisMonth ?? 0}
        unreadCount={unreadCount}
        onBellPress={() => setNotifVisible(true)}
        onAddPress={() => router.push('/(tabs)/sessions/new')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.sageBase}
          />
        }
      >
        {/* Week strip */}
        <View style={styles.weekContainer}>
          <WeekStrip
            appointmentDates={weekAppointmentDates}
            selectedDate={selectedDate}
            onDayChange={setSelectedDate}
          />
        </View>

        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{formatSectionLabel(selectedDate)}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{appointments.length} RDV</Text>
          </View>
        </View>

        {/* Day timeline */}
        <DayTimeline
          appointments={appointments}
          isLoading={apptLoading}
          onAppointmentPress={(patientId) => router.push(`/(tabs)/patients/${patientId}`)}
          onSchedulePress={() => router.push('/(tabs)/sessions/new')}
        />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/sessions/new')}
        accessibilityLabel="Nouveau rendez-vous"
        accessibilityRole="button"
        activeOpacity={0.85}
      >
        <IconAdd size={22} color="#FFF" />
      </TouchableOpacity>

      <ProfileSheet visible={profileVisible} onClose={() => setProfileVisible(false)} />
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
  safeArea: { flex: 1, backgroundColor: Colors.sageBase },
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 14, gap: 12, paddingBottom: 80 },
  weekContainer: {
    backgroundColor: Colors.cream,
    borderRadius: 14,
    paddingVertical: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmText,
  },
  countBadge: {
    backgroundColor: Colors.sageCard,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.sageBase,
  },
  fab: {
    position: 'absolute',
    bottom: 68,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.sageBase,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.sageBase,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
});

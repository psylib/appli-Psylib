/**
 * Calendar Screen — Calendrier des rendez-vous
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { IconCalendar as IconCalendarEmpty } from '@/components/icons/AppIcons';
import { Badge } from '@/components/ui/Badge';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { NavPills } from '@/components/NavPills';
import { AppointmentStatus } from '@psyscale/shared-types';
import type { Appointment, PaginatedResponse } from '@psyscale/shared-types';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Planifié',
  [AppointmentStatus.CONFIRMED]: 'Confirmé',
  [AppointmentStatus.CANCELLED]: 'Annulé',
  [AppointmentStatus.COMPLETED]: 'Terminé',
  [AppointmentStatus.NO_SHOW]: 'Absent',
};

const STATUS_VARIANTS: Record<
  AppointmentStatus,
  'default' | 'primary' | 'success' | 'warning' | 'error'
> = {
  [AppointmentStatus.SCHEDULED]: 'primary',
  [AppointmentStatus.CONFIRMED]: 'success',
  [AppointmentStatus.CANCELLED]: 'error',
  [AppointmentStatus.COMPLETED]: 'default',
  [AppointmentStatus.NO_SHOW]: 'warning',
};

function getWeekDays(baseDate: Date): Date[] {
  const startOfWeek = new Date(baseDate);
  const day = startOfWeek.getDay();
  // Lundi en premier
  const diff = (day === 0 ? -6 : 1 - day);
  startOfWeek.setDate(startOfWeek.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

export default function CalendarScreen() {
  const { getValidToken } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  const startOfWeek = weekDays[0]!;
  const endOfWeek = weekDays[6]!;

  const {
    data: appointmentsData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<PaginatedResponse<Appointment>>({
    queryKey: ['appointments', startOfWeek.toISOString(), endOfWeek.toISOString()],
    queryFn: async () => {
      const token = await getValidToken();
      const params = new URLSearchParams({
        from: startOfWeek.toISOString(),
        to: endOfWeek.toISOString(),
        limit: '100',
      });
      return apiClient.get<PaginatedResponse<Appointment>>(
        `/appointments?${params.toString()}`,
        token ?? undefined,
      );
    },
    staleTime: 1000 * 60 * 2,
  });

  const selectedDateKey = selectedDate.toDateString();
  const todayKey = new Date().toDateString();

  const appointmentsForDay = (appointmentsData?.data ?? []).filter(
    (apt) => new Date(apt.scheduledAt).toDateString() === selectedDateKey,
  );

  const daysWithAppointments = new Set(
    (appointmentsData?.data ?? []).map(
      (apt) => new Date(apt.scheduledAt).toDateString(),
    ),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Navigation Pills */}
      <NavPills />

      {/* En-tête mois */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={() => setWeekOffset((w) => w - 1)}
          style={styles.navButton}
          accessibilityLabel="Semaine précédente"
          accessibilityRole="button"
        >
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS_FR[baseDate.getMonth()]} {baseDate.getFullYear()}
        </Text>
        <TouchableOpacity
          onPress={() => setWeekOffset((w) => w + 1)}
          style={styles.navButton}
          accessibilityLabel="Semaine suivante"
          accessibilityRole="button"
        >
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Semaine */}
      <View style={styles.weekRow} accessibilityLabel="Jours de la semaine">
        {weekDays.map((day, index) => {
          const dayKey = day.toDateString();
          const isSelected = dayKey === selectedDateKey;
          const isToday = dayKey === todayKey;
          const hasApt = daysWithAppointments.has(dayKey);

          return (
            <TouchableOpacity
              key={dayKey}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => setSelectedDate(day)}
              accessibilityLabel={`${DAYS_FR[index]} ${day.getDate()} ${MONTHS_FR[day.getMonth()]}${hasApt ? ', a des rendez-vous' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.dayName,
                  isSelected && styles.dayTextSelected,
                  isToday && !isSelected && styles.dayNameToday,
                ]}
              >
                {DAYS_FR[index]}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected && styles.dayTextSelected,
                  isToday && !isSelected && styles.dayNumberToday,
                ]}
              >
                {day.getDate()}
              </Text>
              {hasApt && (
                <View
                  style={[
                    styles.aptDot,
                    isSelected && styles.aptDotSelected,
                  ]}
                  accessibilityElementsHidden
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Liste RDV du jour */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>
          {selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </Text>
        <Text style={styles.aptCount}>
          {appointmentsForDay.length} RDV
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading} accessibilityLabel="Chargement des rendez-vous">
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList<Appointment>
          data={appointmentsForDay}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={Colors.primary}
              accessibilityLabel="Actualiser le calendrier"
            />
          }
          renderItem={({ item }) => {
            const aptTime = new Date(item.scheduledAt);
            return (
              <TouchableOpacity
                style={styles.aptItem}
                onPress={() => {
                  if (item.sessionId != null) {
                    router.push(`/(tabs)/sessions/${item.sessionId}`);
                  }
                }}
                accessibilityLabel={`Rendez-vous à ${aptTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}, ${item.duration} minutes, ${STATUS_LABELS[item.status]}`}
                accessibilityRole={item.sessionId != null ? 'link' : 'text'}
              >
                <View style={styles.aptTime} accessibilityElementsHidden>
                  <Text style={styles.aptTimeText}>
                    {aptTime.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.aptDuration}>{item.duration} min</Text>
                </View>
                <Card style={styles.aptCard}>
                  <View style={styles.aptCardContent}>
                    <View style={styles.aptCardLeft}>
                      <Text style={styles.aptPatientId} numberOfLines={1}>
                        Patient {item.patientId.slice(0, 8)}
                      </Text>
                      <Badge
                        label={STATUS_LABELS[item.status]}
                        variant={STATUS_VARIANTS[item.status]}
                      />
                    </View>
                    {item.sessionId != null && (
                      <Text style={styles.aptChevron} accessibilityElementsHidden>
                        ›
                      </Text>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <IconCalendarEmpty size={64} color={Colors.mutedLight} />
              <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
              <Text style={styles.emptySubtitle}>
                Pas de RDV prevu pour ce jour
              </Text>
            </View>
          }
          contentContainerStyle={styles.aptList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: '300',
    lineHeight: 32,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  weekRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
  },
  dayName: {
    fontSize: 11, // Fixed WCAG: was 10pt, minimum 11pt
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  dayNameToday: {
    color: Colors.accent,
  },
  dayNumberToday: {
    color: Colors.accent,
  },
  dayTextSelected: {
    color: Colors.white,
  },
  aptDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  aptDotSelected: {
    backgroundColor: Colors.white,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  aptCount: {
    fontSize: 13,
    color: Colors.muted,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  aptList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
  },
  aptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  aptTime: {
    width: 56,
    alignItems: 'flex-end',
    paddingTop: 14,
    flexShrink: 0,
  },
  aptTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  aptDuration: {
    fontSize: 11,
    color: Colors.muted,
  },
  aptCard: {
    flex: 1,
    padding: 14,
  },
  aptCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  aptCardLeft: {
    flex: 1,
    gap: 6,
  },
  aptPatientId: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  aptChevron: {
    fontSize: 22,
    color: Colors.mutedLight,
    fontWeight: '300',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
  },
});

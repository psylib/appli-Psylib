import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import type { DayAppointment } from '@/hooks/useAppointmentsByDate';

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [Colors.sageBase, Colors.sageDark, Colors.sageLight, '#3B82F6', '#7C3AED'];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? Colors.sageBase;
}

interface DayTimelineProps {
  appointments: DayAppointment[];
  isLoading: boolean;
  onAppointmentPress: (patientId: string) => void;
  onSchedulePress: () => void;
}

export function DayTimeline({ appointments, isLoading, onAppointmentPress, onSchedulePress }: DayTimelineProps) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.sageBase} />
      </View>
    );
  }

  if (appointments.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🌿</Text>
        <Text style={styles.emptyTitle}>Journée libre</Text>
        <Text style={styles.emptySubtitle}>Aucun rendez-vous ce jour</Text>
        <TouchableOpacity
          style={styles.scheduleBtn}
          onPress={onSchedulePress}
          accessibilityLabel="Planifier un rendez-vous"
        >
          <Text style={styles.scheduleBtnText}>+ Planifier un RDV</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rows: Array<{ type: 'appt'; appt: DayAppointment } | { type: 'free'; time: string }> = [];

  appointments.forEach((appt, i) => {
    rows.push({ type: 'appt', appt });
    if (i < appointments.length - 1) {
      const endOfCurrent = addMinutes(appt.scheduledAt, appt.duration);
      const startOfNext = appointments[i + 1]!.scheduledAt;
      if (new Date(startOfNext).getTime() - new Date(endOfCurrent).getTime() > 15 * 60_000) {
        rows.push({ type: 'free', time: endOfCurrent });
      }
    }
  });

  return (
    <View style={styles.list}>
      {rows.map((row, i) => {
        if (row.type === 'free') {
          return (
            <View key={`free-${i}`} style={styles.slot}>
              <Text style={styles.slotTime}>{formatHHMM(row.time)}</Text>
              <View style={styles.slotLine} />
              <View style={styles.freeCard}>
                <Text style={styles.freeText}>créneau libre</Text>
              </View>
            </View>
          );
        }

        const { appt } = row;
        const isOnline = appt.type === 'online' || appt.modality === 'online';
        const borderColor = isOnline ? '#3B82F6' : Colors.sageBase;
        const badgeStyle = isOnline ? styles.badgeOnline : styles.badgeConfirmed;
        const badgeTextStyle = isOnline ? styles.badgeTextOnline : styles.badgeTextConfirmed;
        const badgeLabel = isOnline ? 'Visio' : appt.status === 'confirmed' ? 'Confirmé' : 'Planifié';

        return (
          <View key={appt.id} style={styles.slot}>
            <Text style={styles.slotTime}>{formatHHMM(appt.scheduledAt)}</Text>
            <View style={styles.slotLine} />
            <TouchableOpacity
              style={[styles.apptCard, { borderLeftColor: borderColor }]}
              onPress={() => onAppointmentPress(appt.patient.id)}
              activeOpacity={0.75}
              accessibilityLabel={`${appt.patient.name} à ${formatHHMM(appt.scheduledAt)}`}
            >
              <View style={[styles.avatar, { backgroundColor: avatarColor(appt.patient.id) }]}>
                <Text style={styles.avatarText}>{getInitials(appt.patient.name)}</Text>
              </View>
              <View style={styles.apptInfo}>
                <Text style={styles.apptName} numberOfLines={1}>{appt.patient.name}</Text>
                <Text style={styles.apptSub}>{appt.duration} min · {isOnline ? 'visio' : 'cabinet'}</Text>
              </View>
              <View style={[styles.badge, badgeStyle]}>
                <Text style={[styles.badgeText, badgeTextStyle]}>{badgeLabel}</Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.warmText },
  emptySubtitle: { fontSize: 13, color: Colors.warmMuted },
  scheduleBtn: {
    marginTop: 8,
    backgroundColor: Colors.sageCard,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scheduleBtnText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.sageBase },
  slot: { flexDirection: 'row', alignItems: 'stretch', gap: 8, minHeight: 48 },
  slotTime: {
    width: 36,
    paddingTop: 12,
    fontSize: 10,
    fontFamily: 'DMMono_400Regular',
    color: Colors.warmMuted,
    textAlign: 'right',
    flexShrink: 0,
  },
  slotLine: { width: 1, backgroundColor: Colors.warmBorder, flexShrink: 0, marginVertical: 4 },
  freeCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.warmBorder,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    marginVertical: 2,
  },
  freeText: { fontSize: 11, color: '#C4BAB4', fontFamily: 'DMSans_400Regular' },
  apptCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  apptInfo: { flex: 1 },
  apptName: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.warmText },
  apptSub: { fontSize: 10, color: Colors.warmMuted, marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
  badgeText: { fontSize: 9, fontWeight: '700' },
  badgeConfirmed: { backgroundColor: Colors.sageCard },
  badgeTextConfirmed: { color: Colors.sageBase },
  badgeOnline: { backgroundColor: '#EFF6FF' },
  badgeTextOnline: { color: '#3B82F6' },
});

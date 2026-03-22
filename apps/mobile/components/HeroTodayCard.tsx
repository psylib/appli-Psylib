/**
 * HeroTodayCard — Gradient primary card with today's appointments
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface TodayAppointment {
  id: string;
  scheduledAt: string;
  patient: { id: string; name: string };
  status: string;
  type?: string;
}

interface HeroTodayCardProps {
  appointments: TodayAppointment[];
  onAppointmentPress: (patientId: string) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function HeroTodayCard({ appointments, onAppointmentPress }: HeroTodayCardProps) {
  return (
    <LinearGradient
      colors={[Colors.heroGradientStart, Colors.heroGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.label}>AUJOURD'HUI</Text>
          <Text style={styles.count}>
            {appointments.length} rendez-vous
          </Text>
        </View>
        <View style={styles.iconCircle}>
          <Ionicons name="calendar" size={20} color={Colors.white} />
        </View>
      </View>

      {appointments.length > 0 ? (
        <View style={styles.list}>
          {appointments.slice(0, 4).map((appt) => (
            <TouchableOpacity
              key={appt.id}
              style={styles.item}
              onPress={() => onAppointmentPress(appt.patient.id)}
              accessibilityLabel={`${formatTime(appt.scheduledAt)} ${appt.patient.name}`}
              activeOpacity={0.7}
            >
              <Text style={styles.time}>{formatTime(appt.scheduledAt)}</Text>
              <Text style={styles.patientName} numberOfLines={1}>{appt.patient.name}</Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: appt.status === 'confirmed' ? '#5EEAD4' : '#FCD34D' },
                ]}
              />
            </TouchableOpacity>
          ))}
          {appointments.length > 4 && (
            <Text style={styles.moreText}>
              +{appointments.length - 4} autre{appointments.length - 4 > 1 ? 's' : ''}
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="sunny-outline" size={24} color="rgba(255,255,255,0.6)" />
          <Text style={styles.emptyText}>Journee libre</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  count: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  time: {
    fontSize: 14,
    fontFamily: 'DMMono_400Regular',
    color: Colors.white,
    width: 44,
  },
  patientName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    paddingTop: 4,
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
});

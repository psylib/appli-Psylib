/**
 * WeekStrip — Mini week overview for the dashboard
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface WeekStripProps {
  appointmentDates?: Set<string>;
  onDayPress?: (date: Date) => void;
}

function getWeekDays(): Date[] {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

export function WeekStrip({ appointmentDates, onDayPress }: WeekStripProps) {
  const weekDays = useMemo(() => getWeekDays(), []);
  const todayKey = new Date().toDateString();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cette semaine</Text>
      <View style={styles.row}>
        {weekDays.map((day, index) => {
          const dayKey = day.toDateString();
          const isToday = dayKey === todayKey;
          const hasApt = appointmentDates?.has(dayKey) ?? false;

          return (
            <TouchableOpacity
              key={dayKey}
              style={[styles.day, isToday && styles.dayToday]}
              onPress={() => onDayPress?.(day)}
              accessibilityLabel={`${DAYS_SHORT[index]} ${day.getDate()}`}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {DAYS_SHORT[index]}
              </Text>
              <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                {day.getDate()}
              </Text>
              {hasApt && (
                <View style={[styles.dot, isToday && styles.dotToday]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    gap: 4,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  dayToday: {
    backgroundColor: Colors.primary,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
  },
  dayLabelToday: {
    color: 'rgba(255,255,255,0.7)',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  dayNumberToday: {
    color: Colors.white,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  dotToday: {
    backgroundColor: Colors.white,
  },
});

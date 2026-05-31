import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface WeekStripProps {
  appointmentDates?: Set<string>;
  selectedDate?: Date;
  onDayChange?: (date: Date) => void;
  /** Legacy prop — kept for backward compat on other screens */
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

export function WeekStrip({ appointmentDates, selectedDate, onDayChange, onDayPress }: WeekStripProps) {
  const weekDays = useMemo(() => getWeekDays(), []);
  const todayKey = new Date().toDateString();
  const selectedKey = selectedDate?.toDateString();

  return (
    <View style={styles.row}>
      {weekDays.map((day, index) => {
        const dayKey = day.toDateString();
        const isToday = dayKey === todayKey;
        const isSelected = selectedKey ? dayKey === selectedKey : isToday;
        const hasApt = appointmentDates?.has(dayKey) ?? false;

        return (
          <TouchableOpacity
            key={dayKey}
            style={[styles.day, isSelected && styles.daySelected]}
            onPress={() => {
              onDayChange?.(day);
              onDayPress?.(day);
            }}
            accessibilityLabel={`${DAYS_SHORT[index]} ${day.getDate()}`}
            accessibilityState={{ selected: isSelected }}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
              {DAYS_SHORT[index]}
            </Text>
            <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
              {day.getDate()}
            </Text>
            {hasApt && (
              <View style={[styles.dot, isSelected && styles.dotSelected]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 3,
  },
  daySelected: {
    backgroundColor: Colors.sageBase,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.warmMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dayLabelSelected: {
    color: 'rgba(255,255,255,0.65)',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warmText,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.sageBase,
  },
  dotSelected: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

/**
 * KpiCard — KPI card with icon circle for the dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accentColor?: string;
  icon?: IoniconsName;
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  accentColor = Colors.primary,
  icon,
}: KpiCardProps) {
  return (
    <View style={styles.card}>
      {icon != null ? (
        <View style={[styles.iconCircle, { backgroundColor: `${accentColor}15` }]}>
          <Ionicons name={icon} size={18} color={accentColor} />
        </View>
      ) : (
        <View style={[styles.indicator, { backgroundColor: accentColor }]} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.value} accessibilityLabel={`${title}: ${String(value)}`}>
        {String(value)}
      </Text>
      {subtitle != null && subtitle.length > 0 && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
      {trend != null && (
        <View style={styles.trendRow}>
          <Text
            style={[
              styles.trendText,
              { color: trend.isPositive ? Colors.success : Colors.error },
            ]}
            accessibilityLabel={`Tendance: ${trend.isPositive ? '+' : '-'}${Math.abs(trend.value)}%`}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  indicator: {
    width: 32,
    height: 3,
    borderRadius: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.muted,
  },
  trendRow: {
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

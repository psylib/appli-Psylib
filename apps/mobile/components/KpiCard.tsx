/**
 * KpiCard — Carte KPI pour le dashboard
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './ui/Card';
import { Colors } from '@/constants/colors';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accentColor?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  accentColor = Colors.primary,
}: KpiCardProps) {
  return (
    <Card elevated style={styles.card}>
      <View style={[styles.indicator, { backgroundColor: accentColor }]} />
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    gap: 4,
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

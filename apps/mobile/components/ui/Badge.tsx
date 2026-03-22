/**
 * Badge — Indicateur de statut PsyScale
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'accent' | 'warm';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  return (
    <View
      style={[styles.badge, badgeStyles[variant], style]}
      accessibilityLabel={label}
    >
      <Text style={[styles.text, textStyles[variant]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    minWidth: 20,
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11, // WCAG minimum 11pt
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

const badgeStyles = StyleSheet.create({
  default: {
    backgroundColor: Colors.surface,
  },
  primary: {
    backgroundColor: `${Colors.primary}1A`,
  },
  success: {
    backgroundColor: '#D1FAE5',
  },
  warning: {
    backgroundColor: '#FEF3C7',
  },
  error: {
    backgroundColor: '#FEE2E2',
  },
  accent: {
    backgroundColor: `${Colors.accent}1A`,
  },
  warm: {
    backgroundColor: `${Colors.warm}1A`,
  },
});

const textStyles = StyleSheet.create({
  default: {
    color: Colors.muted,
  },
  primary: {
    color: Colors.primary,
  },
  success: {
    color: Colors.success,
  },
  warning: {
    color: Colors.warning,
  },
  error: {
    color: Colors.error,
  },
  accent: {
    color: Colors.accent,
  },
  warm: {
    color: Colors.warm,
  },
});

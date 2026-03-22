/**
 * SkeletonCard — Shimmer loading placeholder for KPI cards and lists
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors } from '@/constants/colors';

interface SkeletonCardProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonCard({
  width = '100%',
  height = 100,
  borderRadius = 16,
  style,
}: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
      accessibilityLabel="Chargement"
      accessibilityRole="progressbar"
    />
  );
}

export function SkeletonKpiRow() {
  return (
    <View style={styles.kpiRow}>
      <SkeletonCard height={100} style={styles.kpiCard} />
      <SkeletonCard height={100} style={styles.kpiCard} />
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <SkeletonCard width={44} height={44} borderRadius={22} />
      <View style={styles.listContent}>
        <SkeletonCard height={14} borderRadius={4} style={{ width: '60%' }} />
        <SkeletonCard height={12} borderRadius={4} style={{ width: '40%', marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.surface,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listContent: {
    flex: 1,
    gap: 0,
  },
});

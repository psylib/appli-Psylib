/**
 * Offline Banner — Yellow animated banner "Hors ligne"
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useUIStore } from '@/store/ui.store';

export function OfflineBanner() {
  const isOnline = useUIStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutUp.duration(300)}>
      <View style={styles.banner}>
        <Text style={styles.icon}>📡</Text>
        <Text style={styles.text}>Hors ligne — les modifications seront synchronisees</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: { fontSize: 14 },
  text: { fontSize: 13, fontWeight: '500', color: '#FFF' },
});

/**
 * Biometric Lock Screen — shown when app returns from background
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { useBiometrics } from '@/hooks/useBiometrics';

export function BiometricLock({ children }: { children: React.ReactNode }) {
  const { isLocked, unlock, label } = useBiometrics();

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>PsyLib est verrouille</Text>
        <Text style={styles.subtitle}>
          Utilisez {label} pour deverrouiller
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => void unlock()}>
          <Text style={styles.buttonText}>Deverrouiller</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#FFF',
  },
});

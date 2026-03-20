/**
 * Biometrics hook — manages biometric lock state and app state transitions
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  isBiometricAvailable,
  getBiometricType,
  getBiometricLabel,
  authenticateWithBiometrics,
  isBiometricsEnabled,
  setBiometricsEnabled,
  recordBackgroundTimestamp,
  shouldPromptBiometrics,
  BiometricType,
} from '@/lib/biometrics';

interface UseBiometricsReturn {
  /** Whether biometric hardware is available */
  available: boolean;
  /** Type of biometric (face, fingerprint, iris, none) */
  type: BiometricType;
  /** Human-readable label */
  label: string;
  /** Whether the user has enabled biometric lock */
  enabled: boolean;
  /** Whether the app is currently locked */
  isLocked: boolean;
  /** Toggle biometric lock on/off */
  toggle: () => Promise<void>;
  /** Manually trigger biometric authentication */
  unlock: () => Promise<boolean>;
}

export function useBiometrics(): UseBiometricsReturn {
  const [available, setAvailable] = useState(false);
  const [type, setType] = useState<BiometricType>('none');
  const [enabled, setEnabled] = useState(isBiometricsEnabled());
  const [isLocked, setIsLocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Check hardware availability on mount
  useEffect(() => {
    async function check() {
      const avail = await isBiometricAvailable();
      setAvailable(avail);
      if (avail) {
        const t = await getBiometricType();
        setType(t);
      }
    }
    void check();
  }, []);

  // Listen for app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        // Going to background — record timestamp
        recordBackgroundTimestamp();
      }

      if (nextState === 'active' && appState.current.match(/inactive|background/)) {
        // Coming to foreground — check if we need to lock
        if (shouldPromptBiometrics()) {
          setIsLocked(true);
        }
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  // Auto-unlock when locked
  useEffect(() => {
    if (!isLocked) return;

    async function autoPrompt() {
      const success = await authenticateWithBiometrics();
      if (success) {
        setIsLocked(false);
      }
    }
    void autoPrompt();
  }, [isLocked]);

  const toggle = useCallback(async () => {
    if (enabled) {
      setBiometricsEnabled(false);
      setEnabled(false);
      return;
    }

    // When enabling, verify biometrics first
    const success = await authenticateWithBiometrics(
      'Activez la securite biometrique',
    );
    if (success) {
      setBiometricsEnabled(true);
      setEnabled(true);
    }
  }, [enabled]);

  const unlock = useCallback(async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      setIsLocked(false);
    }
    return success;
  }, []);

  return {
    available,
    type,
    label: getBiometricLabel(type),
    enabled,
    isLocked,
    toggle,
    unlock,
  };
}

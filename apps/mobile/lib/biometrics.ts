/**
 * Biometric Authentication — Face ID / Touch ID / Fingerprint
 * Uses expo-local-authentication for secure app access.
 */
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { mmkvStorage } from './mmkv';

const BIOMETRICS_ENABLED_KEY = 'psylib_biometrics_enabled';
const LAST_BACKGROUND_KEY = 'psylib_last_background_ts';

/** Minimum time in background before re-prompting (5 minutes) */
const LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'none';

/**
 * Check if the device supports biometric authentication
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Get the type of biometric available on the device
 */
export async function getBiometricType(): Promise<BiometricType> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'iris';
  }
  return 'none';
}

/**
 * Get a human-readable label for the biometric type
 */
export function getBiometricLabel(type: BiometricType): string {
  switch (type) {
    case 'face':
      return Platform.OS === 'ios' ? 'Face ID' : 'Reconnaissance faciale';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Empreinte digitale';
    case 'iris':
      return 'Reconnaissance iris';
    case 'none':
      return 'Non disponible';
  }
}

/**
 * Prompt the user for biometric authentication
 */
export async function authenticateWithBiometrics(
  promptMessage?: string,
): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: promptMessage ?? 'Authentifiez-vous pour acceder a PsyLib',
    cancelLabel: 'Annuler',
    disableDeviceFallback: false,
    fallbackLabel: 'Utiliser le code',
  });
  return result.success;
}

/**
 * Check if biometrics are enabled in settings
 */
export function isBiometricsEnabled(): boolean {
  return mmkvStorage.getBoolean(BIOMETRICS_ENABLED_KEY) ?? false;
}

/**
 * Enable or disable biometric lock
 */
export function setBiometricsEnabled(enabled: boolean): void {
  mmkvStorage.set(BIOMETRICS_ENABLED_KEY, enabled);
}

/**
 * Record when the app goes to background
 */
export function recordBackgroundTimestamp(): void {
  mmkvStorage.set(LAST_BACKGROUND_KEY, Date.now());
}

/**
 * Check if biometric re-auth is needed (app was in background > LOCK_TIMEOUT_MS)
 */
export function shouldPromptBiometrics(): boolean {
  if (!isBiometricsEnabled()) return false;

  const lastBackground = mmkvStorage.getNumber(LAST_BACKGROUND_KEY);
  if (lastBackground == null) return false;

  return Date.now() - lastBackground > LOCK_TIMEOUT_MS;
}

/**
 * SecureStore wrapper — stockage sécurisé des tokens Keycloak
 * Utilise expo-secure-store sur iOS/Android, AsyncStorage comme fallback web
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEYS = {
  ACCESS_TOKEN: 'psyscale_access_token',
  REFRESH_TOKEN: 'psyscale_refresh_token',
  TOKEN_EXPIRY: 'psyscale_token_expiry',
  ID_TOKEN: 'psyscale_id_token',
} as const;

export type StorageKey = (typeof KEYS)[keyof typeof KEYS];

/**
 * Sauvegarde une valeur en SecureStore (iOS/Android) ou AsyncStorage (web)
 */
async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  }
}

/**
 * Récupère une valeur
 */
async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

/**
 * Supprime une valeur
 */
async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export const storage = {
  // Tokens
  setAccessToken: (token: string) => setItem(KEYS.ACCESS_TOKEN, token),
  getAccessToken: () => getItem(KEYS.ACCESS_TOKEN),
  removeAccessToken: () => removeItem(KEYS.ACCESS_TOKEN),

  setRefreshToken: (token: string) => setItem(KEYS.REFRESH_TOKEN, token),
  getRefreshToken: () => getItem(KEYS.REFRESH_TOKEN),
  removeRefreshToken: () => removeItem(KEYS.REFRESH_TOKEN),

  setTokenExpiry: (expiry: number) =>
    setItem(KEYS.TOKEN_EXPIRY, expiry.toString()),
  getTokenExpiry: async () => {
    const val = await getItem(KEYS.TOKEN_EXPIRY);
    return val ? parseInt(val, 10) : null;
  },
  removeTokenExpiry: () => removeItem(KEYS.TOKEN_EXPIRY),

  setIdToken: (token: string) => setItem(KEYS.ID_TOKEN, token),
  getIdToken: () => getItem(KEYS.ID_TOKEN),
  removeIdToken: () => removeItem(KEYS.ID_TOKEN),

  /**
   * Efface tous les tokens (logout)
   */
  clearAll: async () => {
    await Promise.all([
      removeItem(KEYS.ACCESS_TOKEN),
      removeItem(KEYS.REFRESH_TOKEN),
      removeItem(KEYS.TOKEN_EXPIRY),
      removeItem(KEYS.ID_TOKEN),
    ]);
  },
};

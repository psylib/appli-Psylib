/**
 * MMKV Storage — 30x faster than AsyncStorage
 * Used for React Query cache persistence and general app state.
 */
import { MMKV } from 'react-native-mmkv';

export const mmkvStorage = new MMKV({
  id: 'psylib-cache',
});

/**
 * MMKV adapter for Zustand persist middleware
 */
export const zustandMmkvStorage = {
  getItem: (name: string): string | null => {
    return mmkvStorage.getString(name) ?? null;
  },
  setItem: (name: string, value: string): void => {
    mmkvStorage.set(name, value);
  },
  removeItem: (name: string): void => {
    mmkvStorage.delete(name);
  },
};

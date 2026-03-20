/**
 * UI Store — Zustand + MMKV persist
 * Tracks online status, active tab, and UI preferences.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '@/lib/mmkv';

interface UIState {
  isOnline: boolean;
  activeTab: string;
  hasSeenOnboarding: boolean;
  setIsOnline: (online: boolean) => void;
  setActiveTab: (tab: string) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isOnline: true,
      activeTab: 'index',
      hasSeenOnboarding: false,
      setIsOnline: (online) => set({ isOnline: online }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setHasSeenOnboarding: (seen) => set({ hasSeenOnboarding: seen }),
    }),
    {
      name: 'psylib-ui-store',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    },
  ),
);

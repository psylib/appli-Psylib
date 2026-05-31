/**
 * Auth Store — Zustand + MMKV persist
 * Stores decoded user info from JWT for quick access.
 * Tokens themselves stay in SecureStore (not MMKV).
 * Plan is persisted so feature gates work immediately on cold start.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '@/lib/mmkv';

interface AuthStoreState {
  psychologistId: string | null;
  name: string | null;
  email: string | null;
  plan: string | null;
  role: string | null;
  setPsychologist: (data: {
    psychologistId: string;
    name: string;
    email: string;
    plan?: string;
    role?: string;
  }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      psychologistId: null,
      name: null,
      email: null,
      plan: null,
      role: null,
      setPsychologist: ({ psychologistId, name, email, plan, role }) =>
        set((state) => ({
          psychologistId,
          name,
          email,
          plan: plan ?? state.plan,
          role: role ?? 'psychologist',
        })),
      clear: () =>
        set({
          psychologistId: null,
          name: null,
          email: null,
          plan: null,
          role: null,
        }),
    }),
    {
      name: 'psylib-auth',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({
        psychologistId: state.psychologistId,
        name: state.name,
        email: state.email,
        plan: state.plan,
        role: state.role,
      }),
    },
  ),
);

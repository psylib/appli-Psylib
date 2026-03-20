/**
 * Auth Store — Zustand
 * Stores decoded user info from JWT for quick access.
 * Tokens themselves stay in SecureStore (not MMKV).
 */
import { create } from 'zustand';

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

export const useAuthStore = create<AuthStoreState>((set) => ({
  psychologistId: null,
  name: null,
  email: null,
  plan: null,
  role: null,
  setPsychologist: ({ psychologistId, name, email, plan, role }) =>
    set({
      psychologistId,
      name,
      email,
      plan: plan ?? null,
      role: role ?? 'psychologist',
    }),
  clear: () =>
    set({
      psychologistId: null,
      name: null,
      email: null,
      plan: null,
      role: null,
    }),
}));

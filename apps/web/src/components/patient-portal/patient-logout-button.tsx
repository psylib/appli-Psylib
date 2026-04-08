'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function PatientLogoutButton() {
  return (
    <button
      onClick={() => void signOut({ callbackUrl: '/patient/login' })}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 transition"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Déconnexion</span>
    </button>
  );
}

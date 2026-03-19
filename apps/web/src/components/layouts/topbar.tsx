'use client';

import { signOut, useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { NotificationBell } from './notification-bell';

interface TopbarProps {
  userEmail: string;
  userName: string;
}

async function revokeAndSignOut(accessToken?: string) {
  if (accessToken) {
    try {
      const apiBase = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
      await fetch(`${apiBase}/api/v1/auth/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // silencieux — on déconnecte quoi qu'il arrive
    }
  }
  void signOut({ callbackUrl: '/login' });
}

export function Topbar({ userEmail, userName }: TopbarProps) {
  const { data: session } = useSession();
  const displayName = userName || userEmail;

  return (
    <header className="h-14 flex items-center justify-end gap-2 px-4 border-b border-border bg-white flex-shrink-0">
      {/* Notification bell */}
      <NotificationBell />

      {/* Divider */}
      <div className="h-5 w-px bg-border mx-1" aria-hidden />

      {/* User menu */}
      <div className="flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <span className="text-xs font-semibold text-primary">
            {getInitials(displayName)}
          </span>
        </div>

        <div className="hidden sm:block text-right">
          <p className="text-xs font-medium text-foreground leading-tight max-w-[140px] truncate">
            {userName || userEmail}
          </p>
          {userName && (
            <p className="text-[10px] text-muted-foreground max-w-[140px] truncate">
              {userEmail}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void revokeAndSignOut((session as { accessToken?: string } | null)?.accessToken)}
          className={cn(
            'p-1.5 rounded transition-colors',
            'text-muted-foreground hover:text-foreground hover:bg-surface',
          )}
          aria-label="Se déconnecter"
        >
          <LogOut size={15} aria-hidden />
        </button>
      </div>
    </header>
  );
}

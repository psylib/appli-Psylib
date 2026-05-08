'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Calendar, RefreshCw, Unlink, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { calendarSyncApi, type CalendarSyncStatus } from '@/lib/api/calendar-sync';

interface CalendarSyncSettingsProps {
  token?: string;
}

export function CalendarSyncSettings({ token: tokenProp }: CalendarSyncSettingsProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);

  const token = tokenProp || session?.accessToken || '';

  // Handle callback params after OAuth redirect
  useEffect(() => {
    const calendarParam = searchParams.get('calendar');
    if (calendarParam === 'connected') {
      success('Google Calendar connecte avec succes.');
    } else if (calendarParam === 'error') {
      toastError('Erreur lors de la connexion a Google Calendar. Veuillez reessayer.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Load sync status
  const loadStatus = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const status = await calendarSyncApi.getStatus(token);
      setSyncStatus(status);
    } catch {
      setSyncStatus(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    void loadStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionStatus, searchParams]);

  const handleConnect = async () => {
    try {
      const data = await calendarSyncApi.getAuthUrl(token);
      window.location.href = data.url;
    } catch {
      toastError('Impossible de generer le lien de connexion Google.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deconnecter Google Calendar ? Les evenements Google ne bloqueront plus vos creneaux.')) return;
    setDisconnecting(true);
    try {
      await calendarSyncApi.disconnect(token);
      setSyncStatus(null);
      success('Google Calendar deconnecte.');
    } catch {
      toastError('Erreur lors de la deconnexion.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);
    try {
      await calendarSyncApi.forceSync(token);
      const newStatus = await calendarSyncApi.getStatus(token);
      setSyncStatus(newStatus);
      success('Synchronisation terminee.');
    } catch {
      toastError('Erreur lors de la synchronisation.');
    } finally {
      setSyncing(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-surface rounded" />
        <div className="h-4 w-72 bg-surface rounded" />
        <div className="h-10 w-56 bg-surface rounded" />
      </div>
    );
  }

  const isConnected = syncStatus?.connected ?? false;
  const isActive = syncStatus?.isActive ?? false;

  // Format last sync date
  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-medium text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Google Calendar
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Synchronisez vos rendez-vous avec Google Calendar. Les evenements Google bloqueront
          automatiquement vos creneaux.
        </p>
      </div>

      {/* Disconnected state */}
      {!isConnected && (
        <button
          type="button"
          onClick={() => void handleConnect()}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-lg border border-border bg-white hover:bg-surface transition-colors text-sm font-medium text-foreground"
        >
          {/* Google "G" icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connecter Google Calendar
        </button>
      )}

      {/* Connected state */}
      {isConnected && (
        <div className="space-y-4">
          {/* Status badge + email */}
          <div className="flex items-center gap-3 flex-wrap">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Connecte
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                Connexion expiree
              </span>
            )}
            {syncStatus?.email && (
              <span className="text-sm text-muted-foreground">
                {syncStatus.email}
              </span>
            )}
          </div>

          {/* Expired warning */}
          {!isActive && (
            <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  La connexion a Google Calendar a expire.
                  Veuillez vous reconnecter pour continuer la synchronisation.
                </p>
                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  className="text-primary font-medium hover:underline"
                >
                  Reconnecter
                </button>
              </div>
            </div>
          )}

          {/* Last sync + Actions */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-muted-foreground">
              Derniere synchronisation : {formatLastSync(syncStatus?.lastSyncAt ?? null)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleForceSync()}
                loading={syncing}
                disabled={!isActive}
              >
                <RefreshCw size={14} />
                Synchroniser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleDisconnect()}
                loading={disconnecting}
              >
                <Unlink size={14} />
                Deconnecter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

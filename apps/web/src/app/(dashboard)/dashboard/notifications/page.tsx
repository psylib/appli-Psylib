'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Network,
  Target,
  MessageCircle,
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
} from 'lucide-react';
import { cn, formatDateTime } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

type FilterTab = 'all' | 'unread';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

function getNotificationIcon(type: string) {
  if (type.includes('network') || type.includes('referral')) {
    return <Network size={16} className="text-blue-500" aria-hidden />;
  }
  if (type.includes('outcome') || type.includes('assessment')) {
    return <Target size={16} className="text-amber-500" aria-hidden />;
  }
  return <MessageCircle size={16} className="text-primary" aria-hidden />;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'à l\'instant';
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return formatDateTime(dateStr);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [error, setError] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Impossible de charger les notifications.');
      const data = (await res.json()) as Notification[];
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const markRead = async (id: string) => {
    if (!token) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    try {
      await fetch(`${API_BASE}/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // optimistic
    }
  };

  const markAllRead = async () => {
    if (!token) return;
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    try {
      await fetch(`${API_BASE}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // optimistic
    }
  };

  const deleteNotification = async (id: string) => {
    if (!token) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`${API_BASE}/api/v1/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // optimistic — item already removed from state
    }
  };

  const deleteAll = async () => {
    if (!token) return;
    if (!window.confirm('Supprimer toutes les notifications ?')) return;
    setIsDeleting(true);
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`${API_BASE}/api/v1/notifications/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }),
        ),
      );
    } catch {
      // best-effort
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markRead(notification.id);
    }
    const href = notification.data?.href;
    if (typeof href === 'string') {
      router.push(href);
    }
  };

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.readAt) : notifications;

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Tout est à jour'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface border border-border"
            >
              <CheckCheck size={15} aria-hidden />
              Tout marquer lu
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={deleteAll}
              disabled={isDeleting}
              className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/5 border border-destructive/20 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 size={13} className="animate-spin" aria-hidden />
              ) : (
                <Trash2 size={13} aria-hidden />
              )}
              Tout supprimer
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-surface rounded-lg w-fit">
        {(
          [
            { id: 'all', label: `Toutes (${notifications.length})` },
            { id: 'unread', label: `Non lues (${unreadCount})` },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              filter === id
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse flex gap-4 p-4 rounded-xl border border-border bg-white"
            >
              <div className="h-10 w-10 rounded-full bg-surface flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-surface rounded w-1/2" />
                <div className="h-3 bg-surface rounded w-full" />
                <div className="h-3 bg-surface rounded w-3/4" />
                <div className="h-2.5 bg-surface rounded w-1/4 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredNotifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-full bg-surface flex items-center justify-center mb-4">
            <Bell size={28} className="text-muted-foreground opacity-50" aria-hidden />
          </div>
          <h2 className="text-base font-semibold text-foreground mb-1">
            {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {filter === 'unread'
              ? 'Vous avez tout lu. Bien joué !'
              : 'Vous n\'avez pas encore de notifications.'}
          </p>
          {filter === 'unread' && (
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Filter size={13} aria-hidden />
              Voir toutes les notifications
            </button>
          )}
        </div>
      )}

      {/* Notification list */}
      {!isLoading && filteredNotifications.length > 0 && (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'group flex items-start gap-4 p-4 rounded-xl border transition-shadow',
                !notification.readAt
                  ? 'bg-primary/5 border-primary/20 hover:shadow-sm'
                  : 'bg-white border-border hover:shadow-sm',
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  !notification.readAt ? 'bg-primary/10' : 'bg-surface',
                )}
              >
                {getNotificationIcon(notification.type)}
              </div>

              {/* Content */}
              <button
                type="button"
                className="flex-1 min-w-0 text-left"
                onClick={() => handleNotificationClick(notification)}
              >
                <p
                  className={cn(
                    'text-sm leading-snug',
                    !notification.readAt
                      ? 'font-semibold text-foreground'
                      : 'font-medium text-foreground',
                  )}
                >
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  {notification.body}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1.5">
                  {formatRelativeTime(notification.createdAt)}
                  <span className="text-muted-foreground/40 mx-1.5">·</span>
                  {formatDateTime(notification.createdAt)}
                </p>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.readAt && (
                  <button
                    type="button"
                    onClick={() => markRead(notification.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                    title="Marquer comme lu"
                    aria-label="Marquer comme lu"
                  >
                    <CheckCheck size={13} aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteNotification(notification.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                  title="Supprimer"
                  aria-label="Supprimer cette notification"
                >
                  <Trash2 size={13} aria-hidden />
                </button>
              </div>

              {/* Unread dot */}
              {!notification.readAt && (
                <span
                  className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5"
                  aria-label="Non lue"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

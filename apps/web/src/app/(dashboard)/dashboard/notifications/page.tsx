'use client';

import { useState } from 'react';
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
import { useNotifications } from '@/hooks/use-notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications();
  const router = useRouter();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Actions ───────────────────────────────────────────────────────────────

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const deleteAll = async () => {
    setIsDeleting(true);
    setConfirmDeleteAll(false);
    try {
      await Promise.all(notifications.map((n) => deleteNotification(n.id)));
    } catch {
      // best-effort
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNotificationClick = async (notification: (typeof notifications)[0]) => {
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
              onClick={() => void markAllRead()}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-surface border border-border"
            >
              <CheckCheck size={15} aria-hidden />
              Tout marquer lu
            </button>
          )}
          {notifications.length > 0 && !confirmDeleteAll && (
            <button
              type="button"
              onClick={() => setConfirmDeleteAll(true)}
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
          {confirmDeleteAll && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Confirmer ?</span>
              <button
                type="button"
                onClick={() => void deleteAll()}
                className="text-xs font-medium text-destructive hover:text-destructive/80 px-2 py-1 rounded border border-destructive/20"
              >
                Oui, supprimer
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteAll(false)}
                className="text-xs font-medium text-muted-foreground px-2 py-1 rounded border border-border"
              >
                Annuler
              </button>
            </div>
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

      {/* Empty state */}
      {filteredNotifications.length === 0 && (
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
      {filteredNotifications.length > 0 && (
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
                onClick={() => void handleNotificationClick(notification)}
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
                    onClick={() => void markRead(notification.id)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                    title="Marquer comme lu"
                    aria-label="Marquer comme lu"
                  >
                    <CheckCheck size={13} aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void deleteNotification(notification.id)}
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

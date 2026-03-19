'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Network,
  Target,
  MessageCircle,
  CheckCheck,
  X,
  ExternalLink,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

function getNotificationIcon(type: string) {
  if (type.includes('network') || type.includes('referral')) {
    return <Network size={15} className="text-blue-500 flex-shrink-0" aria-hidden />;
  }
  if (type.includes('outcome') || type.includes('assessment')) {
    return <Target size={15} className="text-amber-500 flex-shrink-0" aria-hidden />;
  }
  return <MessageCircle size={15} className="text-sage flex-shrink-0" aria-hidden />;
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

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.accessToken;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // ── Fetch notifications ────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as Notification[];
      setNotifications(data);
    } catch {
      // silent — non-blocking
    }
  }, [token]);

  // Initial fetch + polling every 30s
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

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
      // optimistic — no rollback needed
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

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.readAt) {
      await markRead(notification.id);
    }
    const href = notification.data?.href;
    if (typeof href === 'string') {
      setIsOpen(false);
      router.push(href);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/dashboard/notifications');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) void fetchNotifications();
        }}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isOpen
            ? 'bg-surface text-foreground'
            : 'text-muted-foreground hover:bg-surface hover:text-foreground',
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} non lues` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell size={20} aria-hidden />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-surface"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={13} aria-hidden />
                  Tout lire
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                aria-label="Fermer"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading && notifications.length === 0 && (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3 p-3">
                    <div className="h-8 w-8 rounded-full bg-surface flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-surface rounded w-3/4" />
                      <div className="h-3 bg-surface rounded w-full" />
                      <div className="h-2 bg-surface rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="py-10 text-center">
                <Bell size={28} className="text-muted-foreground mx-auto mb-2 opacity-40" aria-hidden />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            )}

            {notifications.slice(0, 8).map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface',
                  !notification.readAt && 'bg-primary/5',
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    !notification.readAt ? 'bg-primary/10' : 'bg-surface',
                  )}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p
                    className={cn(
                      'text-sm leading-snug truncate',
                      !notification.readAt
                        ? 'font-semibold text-foreground'
                        : 'font-medium text-foreground',
                    )}
                  >
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notification.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notification.readAt && (
                  <span
                    className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2"
                    aria-label="Non lue"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5">
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1"
            >
              <ExternalLink size={11} aria-hidden />
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  AlertTriangle,
  UserX,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardApi } from '@/lib/api/dashboard';

interface ClinicalAlert {
  id: string;
  type: 'score_drop' | 'inactive' | 'overdue_exercise';
  severity: 'warning' | 'info';
  title: string;
  description: string;
  href: string;
  patientName: string;
}

/**
 * Fetches clinical alerts from the dashboard API.
 * Falls back to empty array if the endpoint doesn't exist yet.
 */
function useClinicalAlerts() {
  const { data: session } = useSession();
  const token = session?.accessToken;

  return useQuery<ClinicalAlert[]>({
    queryKey: ['dashboard', 'clinical-alerts'],
    queryFn: async () => {
      if (!token) return [];
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/dashboard/clinical-alerts`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) return [];
        return res.json();
      } catch {
        return [];
      }
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

const ALERT_CONFIG = {
  score_drop: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    label: 'Score en baisse',
  },
  inactive: {
    icon: UserX,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    label: 'Patient inactif',
  },
  overdue_exercise: {
    icon: ClipboardList,
    iconClass: 'text-orange-500',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    label: 'Exercice en retard',
  },
} as const;

function AlertSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-surface flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-surface rounded w-40" />
          <div className="h-3 bg-surface rounded w-56" />
        </div>
      </div>
    </div>
  );
}

export function ClinicalAlerts() {
  const { data: alerts, isLoading } = useClinicalAlerts();

  // Don't render section if no alerts and not loading
  if (!isLoading && (!alerts || alerts.length === 0)) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-500" />
          Alertes cliniques
        </h2>
        {alerts && alerts.length > 3 && (
          <Link
            href="/dashboard/alerts"
            className="text-xs text-primary hover:underline"
          >
            Voir toutes ({alerts.length}) →
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AlertSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts?.slice(0, 6).map((alert) => {
            const config = ALERT_CONFIG[alert.type];
            const Icon = config.icon;

            return (
              <Link
                key={alert.id}
                href={alert.href}
                className={cn(
                  'group rounded-xl border p-4 transition-all hover:shadow-sm',
                  config.borderClass,
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg flex-shrink-0',
                      config.bgClass,
                    )}
                  >
                    <Icon size={18} className={config.iconClass} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {alert.patientName}
                      </p>
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {alert.description}
                    </p>
                    <span
                      className={cn(
                        'inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                        config.bgClass,
                        config.borderClass,
                        config.iconClass,
                      )}
                    >
                      {config.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

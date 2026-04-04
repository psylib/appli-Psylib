'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { mspApi, type MspPatientTrackingResponse } from '@/lib/api/mon-soutien-psy';
import { formatDate } from '@/lib/utils';

interface MspTrackerProps {
  patientId: string;
}

export function MspTracker({ patientId }: MspTrackerProps) {
  const { data: session } = useSession();
  const [data, setData] = useState<MspPatientTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const token = session?.accessToken ?? '';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    mspApi
      .getPatientTracking(patientId, token)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patientId, token]);

  if (loading || !data?.tracking) return null;

  const { tracking, quotaReached, nearQuota } = data;
  const used = tracking.sessionsUsed;
  const max = tracking.maxSessions;
  const pct = Math.min(100, Math.round((used / max) * 100));

  const barColor = quotaReached
    ? 'bg-red-500'
    : nearQuota
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const badgeClass = quotaReached
    ? 'bg-red-100 text-red-700 border-red-200'
    : nearQuota
    ? 'bg-amber-100 text-amber-700 border-amber-200'
    : 'bg-emerald-100 text-emerald-700 border-emerald-200';

  const badgeLabel = quotaReached
    ? 'Quota atteint'
    : nearQuota
    ? 'Proche du quota'
    : 'En cours';

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Mon Soutien Psy</h3>
            <p className="text-xs text-muted-foreground">Année {tracking.year}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
        >
          {(nearQuota || quotaReached) && <AlertTriangle size={12} aria-hidden />}
          {badgeLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-foreground">
            {used}
            <span className="text-sm font-normal text-muted-foreground"> / {max}</span>
          </span>
          <span className="text-xs text-muted-foreground">séances utilisées</span>
        </div>
        <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={max}
          />
        </div>
      </div>

      {/* Dates */}
      {(tracking.firstSessionAt || tracking.lastSessionAt) && (
        <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs">
          {tracking.firstSessionAt && (
            <div>
              <p className="text-muted-foreground">Première séance</p>
              <p className="font-medium text-foreground">{formatDate(tracking.firstSessionAt)}</p>
            </div>
          )}
          {tracking.lastSessionAt && (
            <div>
              <p className="text-muted-foreground">Dernière séance</p>
              <p className="font-medium text-foreground">{formatDate(tracking.lastSessionAt)}</p>
            </div>
          )}
        </div>
      )}

      {quotaReached && (
        <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Le patient a atteint les 12 séances remboursables cette année.
        </p>
      )}
      {nearQuota && !quotaReached && (
        <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Attention : le patient approche du quota annuel (10/12 ou plus).
        </p>
      )}
    </div>
  );
}

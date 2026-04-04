'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { mspApi, type MspOverviewEntry } from '@/lib/api/mon-soutien-psy';

export function MspOverviewWidget() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<MspOverviewEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const token = session?.accessToken ?? '';

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    mspApi
      .getOverview(token)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading || entries.length === 0) return null;

  const nearQuota = entries.filter(
    (e) => e.sessionsUsed >= 10 && e.sessionsUsed < e.maxSessions,
  );
  const reached = entries.filter((e) => e.sessionsUsed >= e.maxSessions);
  const currentYear = new Date().getFullYear();

  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600" aria-hidden />
          Mon Soutien Psy — {currentYear}
        </h2>
        <span className="text-xs text-muted-foreground">
          {entries.length} patient{entries.length > 1 ? 's' : ''} suivi{entries.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-xs text-emerald-700 font-medium">Actifs</p>
          <p className="text-xl font-bold text-emerald-900 mt-0.5">
            {entries.length - reached.length}
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-700 font-medium">≥ 10 séances</p>
          <p className="text-xl font-bold text-amber-900 mt-0.5">{nearQuota.length}</p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-xs text-red-700 font-medium">Quota atteint</p>
          <p className="text-xl font-bold text-red-900 mt-0.5">{reached.length}</p>
        </div>
      </div>

      {/* Patients near quota — priority display */}
      {nearQuota.length > 0 && (
        <div>
          <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-600" aria-hidden />
            À surveiller
          </p>
          <ul className="space-y-1.5">
            {nearQuota.slice(0, 5).map((e) => {
              const pct = Math.min(100, Math.round((e.sessionsUsed / e.maxSessions) * 100));
              return (
                <li key={e.id}>
                  <Link
                    href={`/dashboard/patients/${e.patientId}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors"
                  >
                    <span className="text-sm text-foreground flex-1 truncate">
                      {e.patient.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="h-1.5 w-16 rounded-full bg-surface overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-amber-700 tabular-nums">
                        {e.sessionsUsed}/{e.maxSessions}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

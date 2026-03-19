'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Target, TrendingUp, TrendingDown, Minus, Plus, ChevronRight } from 'lucide-react';
import { useSession } from 'next-auth/react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface RecentAssessment {
  id: string;
  score: number | null;
  severity: string | null;
  completedAt: string | null;
  patient: { id: string; name: string };
  template: { type: string; name: string; maxScore: number };
}

interface Overview {
  totalCount: number;
  recent: RecentAssessment[];
}

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  minimal:           { label: 'Minimal',           color: 'bg-green-100 text-green-700' },
  healthy:           { label: 'Sain',               color: 'bg-green-100 text-green-700' },
  mild:              { label: 'Léger',              color: 'bg-yellow-100 text-yellow-700' },
  low:               { label: 'Léger',              color: 'bg-yellow-100 text-yellow-700' },
  moderate:          { label: 'Modéré',             color: 'bg-orange-100 text-orange-700' },
  moderately_severe: { label: 'Modérément sévère',  color: 'bg-red-100 text-red-600' },
  moderate_severe:   { label: 'Modérément sévère',  color: 'bg-red-100 text-red-600' },
  severe:            { label: 'Sévère',             color: 'bg-red-100 text-red-700' },
};

const TYPE_COLORS: Record<string, string> = {
  PHQ9:    'bg-blue-50 text-blue-700',
  GAD7:    'bg-purple-50 text-purple-700',
  CORE_OM: 'bg-teal-50 text-teal-700',
};

function ScoreBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = Math.min(100, Math.round((score / maxScore) * 100));
  const color =
    pct < 30 ? 'bg-green-400' :
    pct < 55 ? 'bg-yellow-400' :
    pct < 75 ? 'bg-orange-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-500 w-14 text-right">{score}/{maxScore}</span>
    </div>
  );
}

export function OutcomesOverviewContent() {
  const { data: session } = useSession();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch(`${API}/api/v1/outcomes`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((d: Overview) => setData(d))
      .catch(() => setError('Impossible de charger les outcomes.'))
      .finally(() => setLoading(false));
  }, [session]);

  // Group recent by patient for "last scores"
  const byPatient = data?.recent.reduce(
    (acc, a) => {
      if (!acc[a.patient.id]) acc[a.patient.id] = { name: a.patient.name, assessments: [] };
      acc[a.patient.id]!.assessments.push(a);
      return acc;
    },
    {} as Record<string, { name: string; assessments: RecentAssessment[] }>
  ) ?? {};

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Target size={22} className="text-primary" />
            Outcome Tracking
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Mesures PHQ-9, GAD-7 et CORE-OM de tous vos patients
          </p>
        </div>
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Nouvelle évaluation
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Évaluations totales', value: data?.totalCount ?? '—', icon: Target },
          { label: 'Cette semaine', value: data?.recent.filter(a => {
            if (!a.completedAt) return false;
            const d = new Date(a.completedAt);
            const now = new Date();
            return now.getTime() - d.getTime() < 7 * 86400 * 1000;
          }).length ?? '—', icon: TrendingUp },
          { label: 'Patients évalués', value: Object.keys(byPatient).length || '—', icon: TrendingDown },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
              <Icon size={14} />
              {label}
            </div>
            <div className="text-2xl font-semibold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      {/* Per-patient list */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-medium text-foreground text-sm">Dernières évaluations par patient</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Chargement…</div>
        ) : Object.keys(byPatient).length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Target size={32} className="mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">Aucune évaluation encore.</p>
            <p className="text-xs text-muted-foreground">Ouvrez la fiche d'un patient pour démarrer une évaluation.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(byPatient).map(([patientId, { name, assessments }]) => (
              <div key={patientId} className="px-5 py-4 hover:bg-surface/50 transition-colors group">
                <div className="flex items-center justify-between mb-3">
                  <Link
                    href={`/dashboard/outcomes/${patientId}`}
                    className="font-medium text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1"
                  >
                    {name}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {assessments.length} évaluation{assessments.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {assessments.slice(0, 3).map((a) => {
                    const sev = a.severity ? SEVERITY_LABELS[a.severity] : null;
                    return (
                      <div key={a.id} className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${TYPE_COLORS[a.template.type] ?? 'bg-gray-100 text-gray-600'}`}>
                          {a.template.type.replace('_', '-')}
                        </span>
                        <div className="flex-1">
                          {a.score !== null && (
                            <ScoreBar score={a.score} maxScore={a.template.maxScore} />
                          )}
                        </div>
                        {sev && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sev.color}`}>
                            {sev.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

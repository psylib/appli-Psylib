'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Plus, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

interface DataPoint {
  date: string;
  score: number | null;
  severity: string | null;
}

interface Series {
  type: string;
  name: string;
  maxScore: number;
  scoringRanges: Array<{ min: number; max: number; label: string; severity: string }>;
  dataPoints: DataPoint[];
}

interface EvolutionData {
  patientId: string;
  patientName: string;
  series: Series[];
}

// SVG evolution chart — pure SVG, no dep
function EvolutionChart({ series, width = 480, height = 160 }: { series: Series; width?: number; height?: number }) {
  const pts = series.dataPoints.filter((d) => d.score !== null);
  if (pts.length === 0) return <p className="text-sm text-muted-foreground py-4">Aucune donnée encore.</p>;

  const pad = { top: 16, right: 12, bottom: 32, left: 36 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const xs = pts.map((_, i) => pad.left + (i / Math.max(pts.length - 1, 1)) * cw);
  const ys = pts.map((p) => pad.top + ch - ((p.score! / series.maxScore) * ch));

  const pathD = xs.map((x, i) => (i === 0 ? `M${x},${ys[i]}` : `L${x},${ys[i]}`)).join(' ');
  const areaD = `${pathD} L${xs[xs.length - 1]},${pad.top + ch} L${xs[0]},${pad.top + ch} Z`;

  // Severity band lines
  const bandLines = series.scoringRanges.slice(1).map((r) => ({
    y: pad.top + ch - ((r.min / series.maxScore) * ch),
    label: r.label,
  }));

  const COLOR = '#3D52A0';

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 280 }}>
        <defs>
          <linearGradient id={`grad-${series.type}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLOR} stopOpacity="0.18" />
            <stop offset="100%" stopColor={COLOR} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Band lines */}
        {bandLines.map(({ y, label }) => (
          <g key={label}>
            <line x1={pad.left} y1={y} x2={pad.left + cw} y2={y} stroke="#E5E7EB" strokeWidth="0.8" strokeDasharray="4,3" />
            <text x={pad.left - 4} y={y + 4} fontSize="7" fill="#9CA3AF" textAnchor="end">{series.scoringRanges.find(r => pad.top + ch - (r.min / series.maxScore) * ch === y)?.min}</text>
          </g>
        ))}

        {/* Y-axis labels */}
        <text x={pad.left - 4} y={pad.top + 4} fontSize="7" fill="#9CA3AF" textAnchor="end">{series.maxScore}</text>
        <text x={pad.left - 4} y={pad.top + ch + 4} fontSize="7" fill="#9CA3AF" textAnchor="end">0</text>

        {/* Area */}
        <path d={areaD} fill={`url(#grad-${series.type})`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {xs.map((x, i) => {
          const pt = pts[i];
          const y = ys[i];
          if (!pt || y === undefined) return null;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="white" stroke={COLOR} strokeWidth="2" />
              <text x={x} y={pad.top + ch + 14} fontSize="7" fill="#9CA3AF" textAnchor="middle">
                {new Date(pt.date).toLocaleDateString('fr', { day: '2-digit', month: '2-digit' })}
              </text>
              <text x={x} y={y - 8} fontSize="8" fill={COLOR} textAnchor="middle" fontWeight="600">
                {pt.score}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

type ModalType = 'PHQ9' | 'GAD7' | 'CORE_OM' | null;

function NewAssessmentModal({
  patientId,
  onClose,
  onCreated,
  token,
}: {
  patientId: string;
  onClose: () => void;
  onCreated: () => void;
  token: string;
}) {
  const [type, setType] = useState<'PHQ9' | 'GAD7' | 'CORE_OM'>('PHQ9');
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/outcomes/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patientId, type }),
      });
      if (r.ok) { onCreated(); onClose(); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-foreground mb-4">Nouvelle évaluation</h3>
        <div className="space-y-2 mb-5">
          {(['PHQ9', 'GAD7', 'CORE_OM'] as const).map((t) => {
            const labels: Record<string, string> = {
              PHQ9: 'PHQ-9 — Dépression (0–27)',
              GAD7: 'GAD-7 — Anxiété (0–21)',
              CORE_OM: 'CORE-OM — Bien-être général (0–40)',
            };
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  type === t ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-primary/40'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-surface transition-colors">
            Annuler
          </button>
          <button
            onClick={create}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

export function PatientEvolutionContent({ patientId }: { patientId: string }) {
  const { data: session } = useSession();
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    if (!session?.accessToken) return;
    setLoading(true);
    fetch(`${API}/api/v1/outcomes/patients/${patientId}/evolution`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then((r) => r.json())
      .then((d: EvolutionData) => setData(d))
      .catch(() => setError('Impossible de charger les données.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [session, patientId]);

  const typeLabels: Record<string, string> = {
    PHQ9: 'PHQ-9 · Dépression',
    GAD7: 'GAD-7 · Anxiété',
    CORE_OM: 'CORE-OM · Bien-être',
  };

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/outcomes" className="p-2 rounded-lg hover:bg-surface transition-colors text-muted-foreground">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">
              {loading ? '…' : data?.patientName ?? 'Patient'}
            </h1>
            <p className="text-sm text-muted-foreground">Évolution des questionnaires cliniques</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} />
            Évaluation
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.series.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-10 text-center space-y-3">
            <Target size={36} className="mx-auto text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Aucune évaluation pour ce patient.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90"
            >
              <Plus size={15} /> Démarrer une évaluation
            </button>
          </div>
        ) : (
          data.series.map((s) => (
            <div key={s.type} className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-foreground text-sm">{typeLabels[s.type] ?? s.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.dataPoints.length} mesure{s.dataPoints.length > 1 ? 's' : ''} · Score max {s.maxScore}
                  </p>
                </div>
                {s.dataPoints[s.dataPoints.length - 1]?.score !== undefined && (
                  <div className="text-right">
                    <div className="text-2xl font-mono font-semibold text-primary">
                      {s.dataPoints[s.dataPoints.length - 1]?.score}
                    </div>
                    <div className="text-xs text-muted-foreground">score actuel</div>
                  </div>
                )}
              </div>
              <div className="p-5">
                <EvolutionChart series={s} />
                {/* Legend */}
                <div className="flex gap-2 flex-wrap mt-3">
                  {s.scoringRanges.map((r) => (
                    <span key={r.label} className="text-xs text-muted-foreground">
                      {r.min}–{r.max} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && session?.accessToken && (
        <NewAssessmentModal
          patientId={patientId}
          token={session.accessToken as string}
          onClose={() => setShowModal(false)}
          onCreated={load}
        />
      )}
    </>
  );
}

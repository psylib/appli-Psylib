'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { patientPortalApi, type Exercise } from '@/lib/api/patient-portal';

const STATUS_LABELS: Record<Exercise['status'], string> = {
  assigned: 'À faire',
  in_progress: 'En cours',
  completed: 'Terminé',
  skipped: 'Passé',
};

const STATUS_COLORS: Record<Exercise['status'], string> = {
  assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  skipped: 'bg-slate-50 text-slate-500 border-slate-200',
};

function ExerciseCard({
  exercise,
  onUpdate,
}: {
  exercise: Exercise;
  onUpdate: (id: string, status: Exercise['status'], feedback?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState(exercise.patientFeedback ?? '');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    await onUpdate(exercise.id, 'completed', feedback || undefined);
    setSaving(false);
    setExpanded(false);
  };

  const handleSkip = async () => {
    setSaving(true);
    await onUpdate(exercise.id, 'skipped');
    setSaving(false);
  };

  const handleStart = async () => {
    await onUpdate(exercise.id, 'in_progress');
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-4 transition-all ${
        exercise.status === 'completed' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-900">{exercise.title}</h3>
            {exercise.createdByAi && (
              <span className="text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-full px-2 py-0.5">
                IA
              </span>
            )}
            <span
              className={`text-xs border rounded-full px-2 py-0.5 ${STATUS_COLORS[exercise.status]}`}
            >
              {STATUS_LABELS[exercise.status]}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">{exercise.description}</p>
          {exercise.dueDate && (
            <p className="text-xs text-slate-400 mt-1">
              Avant le{' '}
              {new Date(exercise.dueDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
              })}
            </p>
          )}
        </div>

        {exercise.status === 'assigned' && (
          <button
            onClick={handleStart}
            className="shrink-0 text-xs bg-[#3D52A0] text-white rounded-lg px-3 py-1.5 hover:bg-[#2d3f7c] transition-colors"
          >
            Commencer
          </button>
        )}
      </div>

      {exercise.status === 'in_progress' && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          {expanded ? (
            <div className="space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Votre retour sur cet exercice (facultatif)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/30"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60"
                >
                  {saving ? '...' : 'Marquer terminé'}
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="py-2 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setExpanded(true)}
                className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                ✓ Terminé
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                className="py-2 px-4 rounded-lg border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Passer
              </button>
            </div>
          )}
        </div>
      )}

      {exercise.patientFeedback && exercise.status === 'completed' && (
        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {exercise.patientFeedback}
        </div>
      )}
    </div>
  );
}

export default function ExercisesPage() {
  const { data: session } = useSession();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    patientPortalApi
      .getExercises(session.accessToken)
      .then(setExercises)
      .catch(() => setError('Impossible de charger vos exercices.'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const handleUpdate = async (
    id: string,
    status: Exercise['status'],
    feedback?: string,
  ) => {
    if (!session?.accessToken) return;
    const updated = await patientPortalApi.updateExercise(
      session.accessToken,
      id,
      status,
      feedback,
    );
    setExercises((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };

  const pending = exercises.filter((e) => e.status === 'assigned' || e.status === 'in_progress');
  const done = exercises.filter((e) => e.status === 'completed' || e.status === 'skipped');

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 pb-24">
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mes exercices</h1>
        <p className="text-sm text-slate-500 mt-0.5">Prescrits par votre psychologue</p>
      </div>

      {exercises.length === 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
          <span className="text-4xl">🎯</span>
          <p className="mt-3 text-sm text-slate-500">Aucun exercice pour le moment.</p>
          <p className="text-xs text-slate-400 mt-1">
            Votre psychologue vous en assignera lors des prochaines séances.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            À faire · {pending.length}
          </p>
          {pending.map((e) => (
            <ExerciseCard key={e.id} exercise={e} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Terminés · {done.length}
          </p>
          {done.map((e) => (
            <ExerciseCard key={e.id} exercise={e} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

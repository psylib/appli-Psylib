'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { patientPortalApi, type PatientDashboard } from '@/lib/api/patient-portal';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😭', 2: '😢', 3: '😟', 4: '😕', 5: '😐',
  6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩',
};

function MoodBar({ mood }: { mood: number }) {
  const pct = ((mood - 1) / 9) * 100;
  const color = mood <= 3 ? 'bg-red-400' : mood <= 6 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-5 text-right">{mood}</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PatientPortalDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<PatientDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    patientPortalApi
      .getDashboard(session.accessToken)
      .then(setData)
      .catch(() => setError('Impossible de charger votre espace. Veuillez rafraichir la page.'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-sm text-red-600 bg-red-50 rounded-xl p-4">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-24">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  const avgMood = data?.avgMood7d;
  const moodEmoji = avgMood ? MOOD_EMOJIS[Math.round(avgMood)] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Bonjour {session?.user?.name?.split(' ')[0] ?? ''} {moodEmoji ?? '👋'}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Comment vous sentez-vous aujourd&apos;hui ?</p>
      </div>

      {/* Quick mood log */}
      <Link
        href="/patient-portal/mood"
        className="block rounded-2xl bg-[#3D52A0] text-white p-4 hover:bg-[#2d3f7c] transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Enregistrer mon humeur</p>
            <p className="text-sm text-blue-200 mt-0.5">2 minutes · confidentiel</p>
          </div>
          <span className="text-3xl">💬</span>
        </div>
      </Link>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Mood 7j */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Humeur moyenne 7j</p>
          {avgMood ? (
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-slate-900">{avgMood.toFixed(1)}</span>
              <span className="text-xl mb-0.5">{moodEmoji}</span>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucune donnée</p>
          )}
        </div>

        {/* Exercices */}
        <Link
          href="/patient-portal/exercises"
          className="rounded-2xl bg-white border border-slate-200 p-4 hover:border-[#3D52A0] transition-colors"
        >
          <p className="text-xs text-slate-500 mb-1">Exercices en cours</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-slate-900">
              {data?.pendingExercises.length ?? 0}
            </span>
            <span className="text-sm text-slate-400 mb-0.5">à faire</span>
          </div>
        </Link>
      </div>

      {/* Mood history mini chart */}
      {data && data.moodHistory.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-700 mb-3">Humeur — 7 derniers jours</p>
          <div className="space-y-1.5">
            {data.moodHistory.slice(-7).map((m, i) => (
              <MoodBar key={i} mood={m.mood} />
            ))}
          </div>
          <Link
            href="/patient-portal/mood"
            className="mt-3 block text-xs text-[#3D52A0] font-medium hover:underline"
          >
            Voir l&apos;historique complet →
          </Link>
        </div>
      )}

      {/* Prochain RDV */}
      {data?.nextAppointment && (
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-700 mb-2">Prochain rendez-vous</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3D52A0]/10 flex items-center justify-center text-xl">
              📅
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {new Date(data.nextAppointment.scheduledAt).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(data.nextAppointment.scheduledAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · {data.nextAppointment.duration} min
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Journal */}
      <Link
        href="/patient-portal/journal"
        className="block rounded-2xl bg-amber-50 border border-amber-200 p-4 hover:border-amber-400 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-900">Mon journal</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {data?.journalCount ?? 0} entrée{(data?.journalCount ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <span className="text-2xl">📖</span>
        </div>
      </Link>
    </div>
  );
}

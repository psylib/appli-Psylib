'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { patientPortalApi, type MoodEntry } from '@/lib/api/patient-portal';

const MOOD_LABELS: Record<number, string> = {
  1: 'Très mal', 2: 'Mal', 3: 'Assez mal', 4: 'Pas bien',
  5: 'Neutre', 6: 'Pas trop mal', 7: 'Bien', 8: 'Très bien',
  9: 'Super', 10: 'Excellent',
};

const MOOD_EMOJIS: Record<number, string> = {
  1: '😭', 2: '😢', 3: '😟', 4: '😕', 5: '😐',
  6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩',
};

function moodColor(m: number) {
  if (m <= 3) return 'text-red-500 bg-red-50 border-red-200';
  if (m <= 6) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-emerald-600 bg-emerald-50 border-emerald-200';
}

export default function MoodPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [selected, setSelected] = useState<number>(5);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    patientPortalApi
      .getMoodHistory(session.accessToken, 30)
      .then(setHistory)
      .catch(() => setError('Impossible de charger votre historique.'));
  }, [session?.accessToken]);

  const handleSave = async () => {
    if (!session?.accessToken) return;
    setSaving(true);
    try {
      const entry = await patientPortalApi.createMood(
        session.accessToken,
        selected,
        note.trim() || undefined,
      );
      setHistory((prev) => [entry, ...prev]);
      setNote('');
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mon humeur</h1>
        <p className="text-sm text-slate-500 mt-0.5">Comment vous sentez-vous ?</p>
      </div>

      {/* Mood selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="text-center mb-6">
          <span className="text-6xl">{MOOD_EMOJIS[selected]}</span>
          <p className="mt-2 font-semibold text-slate-900">{MOOD_LABELS[selected]}</p>
          <p className="text-sm text-slate-400">{selected}/10</p>
        </div>

        <input
          type="range"
          min={1}
          max={10}
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="w-full accent-[#3D52A0]"
        />

        <div className="flex justify-between text-xs text-slate-400 mt-1 px-0.5">
          <span>😭 Très mal</span>
          <span>🤩 Excellent</span>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Une note sur votre journée ? (facultatif)"
          className="mt-4 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/30 focus:border-[#3D52A0]"
          rows={2}
        />

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {saved && (
          <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700 text-center">
            ✓ Humeur enregistrée
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-3 w-full py-2.5 rounded-lg bg-[#3D52A0] text-white text-sm font-medium hover:bg-[#2d3f7c] transition-colors disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Historique — 30 derniers jours</h2>
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold border ${moodColor(entry.mood)} shrink-0`}
                >
                  {entry.mood}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                    {' '}· {MOOD_EMOJIS[entry.mood]} {MOOD_LABELS[entry.mood]}
                  </p>
                  {entry.note && (
                    <p className="text-sm text-slate-600 mt-0.5 truncate">{entry.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

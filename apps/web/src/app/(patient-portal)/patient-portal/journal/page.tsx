'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { patientPortalApi, type JournalEntry } from '@/lib/api/patient-portal';

const MOOD_EMOJIS: Record<number, string> = {
  1: '😭', 2: '😢', 3: '😟', 4: '😕', 5: '😐',
  6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩',
};

function EntryCard({
  entry,
  onDelete,
}: {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-slate-400">
              {new Date(entry.createdAt).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            {entry.mood && (
              <span className="text-sm">
                {MOOD_EMOJIS[entry.mood]} {entry.mood}/10
              </span>
            )}
            {entry.isPrivate && (
              <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                Privé
              </span>
            )}
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.content}</p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 text-sm p-1"
            aria-label="Supprimer"
          >
            ✕
          </button>
        ) : (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onDelete(entry.id)}
              className="text-xs text-red-500 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50"
            >
              Oui
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50"
            >
              Non
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JournalPage() {
  const { data: session } = useSession();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!session?.accessToken) return;
    patientPortalApi
      .getJournalEntries(session.accessToken)
      .then(setEntries)
      .catch(() => setError('Impossible de charger vos entrées de journal.'))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  const handleSubmit = async () => {
    if (!session?.accessToken || !content.trim()) return;
    setSaving(true);
    try {
      const tagList = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const entry = await patientPortalApi.createJournalEntry(
        session.accessToken,
        content.trim(),
        mood,
        tagList.length ? tagList : undefined,
        isPrivate,
      );
      setEntries((prev) => [entry, ...prev]);
      setContent('');
      setMood(undefined);
      setTags('');
      setIsPrivate(false);
      setWriting(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!session?.accessToken) return;
    await patientPortalApi.deleteJournalEntry(session.accessToken, id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mon journal</h1>
          <p className="text-sm text-slate-500 mt-0.5">{entries.length} entrée{entries.length !== 1 ? 's' : ''}</p>
        </div>
        {!writing && (
          <button
            onClick={() => {
              setWriting(true);
              setTimeout(() => textareaRef.current?.focus(), 50);
            }}
            className="px-4 py-2 rounded-xl bg-[#3D52A0] text-white text-sm font-medium hover:bg-[#2d3f7c] transition-colors"
          >
            + Écrire
          </button>
        )}
      </div>

      {/* New entry form */}
      {writing && (
        <div className="bg-white rounded-2xl border border-[#3D52A0]/30 p-4 space-y-3 shadow-sm">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Comment s'est passée votre journée ? Qu'avez-vous ressenti ?"
            className="w-full px-0 py-0 text-sm text-slate-700 resize-none focus:outline-none placeholder:text-slate-300"
            rows={4}
          />

          <div className="border-t border-slate-100 pt-3 space-y-2">
            {/* Mood */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-12">Humeur</span>
              <div className="flex gap-1">
                {[2, 4, 5, 7, 9, 10].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMood(mood === m ? undefined : m)}
                    className={`text-lg transition-transform ${mood === m ? 'scale-125' : 'opacity-50 hover:opacity-100'}`}
                    title={`${m}/10`}
                  >
                    {MOOD_EMOJIS[m]}
                  </button>
                ))}
              </div>
              {mood && <span className="text-xs text-slate-400">{mood}/10</span>}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-12">Tags</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="anxiété, travail, famille..."
                className="flex-1 text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-[#3D52A0]"
              />
            </div>

            {/* Private */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded accent-[#3D52A0]"
              />
              <span className="text-xs text-slate-500">Entrée privée (non partagée)</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving || !content.trim()}
              className="flex-1 py-2 rounded-xl bg-[#3D52A0] text-white text-sm font-medium hover:bg-[#2d3f7c] transition-colors disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              onClick={() => setWriting(false)}
              className="py-2 px-4 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 && !writing ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
          <span className="text-4xl">📖</span>
          <p className="mt-3 text-sm text-slate-500">Votre journal est vide pour l&apos;instant.</p>
          <button
            onClick={() => setWriting(true)}
            className="mt-3 text-sm text-[#3D52A0] font-medium hover:underline"
          >
            Écrire votre première entrée
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

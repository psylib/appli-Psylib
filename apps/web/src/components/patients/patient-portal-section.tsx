'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { patientsApi } from '@/lib/api/patients';
import { ExerciseDialog } from './exercise-dialog';

interface PortalStatus {
  hasPortalAccess: boolean;
  hasAiConsent: boolean;
  lastSignIn: string | null;
  invitation: { status: string; email: string; expiresAt: string } | null;
}

interface MoodEntry {
  id: string;
  mood: number;
  note?: string;
  createdAt: string;
}

interface Exercise {
  id: string;
  title: string;
  status: string;
  completedAt?: string;
  patientFeedback?: string;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😭', 2: '😢', 3: '😟', 4: '😕', 5: '😐',
  6: '🙂', 7: '😊', 8: '😄', 9: '😁', 10: '🤩',
};

function moodBg(m: number) {
  if (m <= 3) return 'bg-red-100 text-red-700';
  if (m <= 6) return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

export function PatientPortalSection({ patientId }: { patientId: string }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<PortalStatus | null>(null);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [exerciseDialogOpen, setExerciseDialogOpen] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    patientsApi
      .portalStatus(patientId, session.accessToken)
      .then(setStatus)
      .catch(console.error);
  }, [patientId, session?.accessToken]);

  useEffect(() => {
    if (!status?.hasPortalAccess || !session?.accessToken) return;
    Promise.all([
      patientsApi.portalMood(patientId, session.accessToken),
      patientsApi.portalExercises(patientId, session.accessToken),
    ])
      .then(([m, e]) => {
        setMoods(m);
        setExercises(e);
      })
      .catch(console.error);
  }, [status?.hasPortalAccess, patientId, session?.accessToken]);

  const handleInvite = async () => {
    if (!session?.accessToken) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const result = await patientsApi.invite(patientId, session.accessToken);
      setInviteResult(`Invitation envoyée à ${result.email}`);
      // Refresh status
      const newStatus = await patientsApi.portalStatus(patientId, session.accessToken);
      setStatus(newStatus);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setInviteResult(`Erreur: ${msg}`);
    } finally {
      setInviting(false);
    }
  };

  const refreshExercises = () => {
    if (!session?.accessToken) return;
    patientsApi
      .portalExercises(patientId, session.accessToken)
      .then(setExercises)
      .catch(console.error);
  };

  const avgMood =
    moods.length > 0 ? moods.reduce((s, m) => s + m.mood, 0) / moods.length : null;

  return (
    <section className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Espace patient</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status?.hasPortalAccess
              ? status.lastSignIn
                ? `Dernière connexion ${new Date(status.lastSignIn).toLocaleDateString('fr-FR')}`
                : 'Compte créé — jamais connecté'
              : 'Non activé'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status?.hasPortalAccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Actif
            </span>
          ) : (
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="inline-flex items-center gap-1.5 text-xs bg-[#3D52A0] text-white rounded-lg px-3 py-1.5 hover:bg-[#2d3f7c] transition-colors disabled:opacity-60"
            >
              {inviting ? 'Envoi...' : status?.invitation?.status === 'pending' ? 'Renvoyer l\'invitation' : 'Inviter au portal'}
            </button>
          )}
          {status?.hasPortalAccess && (
            <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1 ${
              status.hasAiConsent
                ? 'bg-violet-50 text-violet-700 border border-violet-200'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}>
              {status.hasAiConsent ? 'IA autorisée' : 'IA non autorisée'}
            </span>
          )}
        </div>
      </div>

      {/* Invitation pending info */}
      {!status?.hasPortalAccess && status?.invitation?.status === 'pending' && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
          Invitation en attente — expire le{' '}
          {new Date(status.invitation.expiresAt).toLocaleDateString('fr-FR')}
        </div>
      )}

      {/* Invite feedback */}
      {inviteResult && (
        <div className="px-6 py-3 bg-slate-50 border-b border-border text-xs text-slate-600">
          {inviteResult}
        </div>
      )}

      {/* Portal data — only if patient has access */}
      {status?.hasPortalAccess && (
        <div className="p-6 space-y-6">
          {/* Mood */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Humeur — 30 derniers jours</h4>
              {avgMood && (
                <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${moodBg(Math.round(avgMood))}`}>
                  Moy. {avgMood.toFixed(1)} {MOOD_EMOJIS[Math.round(avgMood)]}
                </span>
              )}
            </div>

            {moods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune entrée humeur enregistrée</p>
            ) : (
              <div className="flex gap-1.5 flex-wrap">
                {moods.slice(-14).map((m) => (
                  <div key={m.id} className="flex flex-col items-center gap-0.5" title={m.note ?? ''}>
                    <span className="text-base">{MOOD_EMOJIS[m.mood]}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Exercices</h4>
              <button
                onClick={() => setExerciseDialogOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-[#3D52A0] hover:text-[#2d3f7c] font-medium"
              >
                <Plus size={14} />
                Nouvel exercice
              </button>
            </div>
            {exercises.length > 0 ? (
              <div className="space-y-2">
                {exercises.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        e.status === 'completed'
                          ? 'bg-emerald-500'
                          : e.status === 'in_progress'
                          ? 'bg-amber-500'
                          : 'bg-slate-300'
                      }`}
                    />
                    <span className="flex-1 truncate text-foreground">{e.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {e.status === 'completed'
                        ? '✓ Terminé'
                        : e.status === 'in_progress'
                        ? 'En cours'
                        : 'À faire'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun exercice assigné</p>
            )}
          </div>
        </div>
      )}

      {/* Not activated empty state */}
      {!status?.hasPortalAccess && !status?.invitation && (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Invitez ce patient à rejoindre son espace pour partager humeur, exercices et journal entre les séances.
          </p>
        </div>
      )}
      <ExerciseDialog
        patientId={patientId}
        hasAiConsent={status?.hasAiConsent ?? false}
        open={exerciseDialogOpen}
        onClose={() => setExerciseDialogOpen(false)}
        onCreated={refreshExercises}
      />
    </section>
  );
}

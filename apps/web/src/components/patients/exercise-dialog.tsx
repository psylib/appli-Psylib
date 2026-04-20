'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Sparkles, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { patientsApi } from '@/lib/api/patients';
import { generateExercise } from '@/lib/api/ai';
import type { GeneratedExercise } from '@/lib/api/ai';

interface ExerciseDialogProps {
  patientId: string;
  hasAiConsent: boolean;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const manualSchema = z.object({
  title: z.string().min(3, 'Minimum 3 caractères').max(200),
  description: z.string().min(10, 'Minimum 10 caractères').max(5000),
  dueDate: z.string().optional(),
});

const aiSchema = z.object({
  theme: z.string().min(2, 'Thème requis').max(200),
  exerciseType: z.enum(['breathing', 'journaling', 'exposure', 'mindfulness', 'cognitive']),
  patientContext: z.string().min(1, 'Contexte requis').max(500),
});

type ManualForm = z.infer<typeof manualSchema>;
type AiForm = z.infer<typeof aiSchema>;

const EXERCISE_TYPES = [
  { value: 'breathing', label: 'Respiration' },
  { value: 'journaling', label: 'Journal' },
  { value: 'exposure', label: 'Exposition progressive' },
  { value: 'mindfulness', label: 'Pleine conscience' },
  { value: 'cognitive', label: 'Cognitif' },
] as const;

export function ExerciseDialog({ patientId, hasAiConsent, open, onClose, onCreated }: ExerciseDialogProps) {
  const { data: session } = useSession();
  const [tab, setTab] = useState<'manual' | 'ai'>('manual');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedExercise | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  
  const manual = useForm<ManualForm>({ resolver: zodResolver(manualSchema as any) });
  const ai = useForm<AiForm>({
    
    resolver: zodResolver(aiSchema as any),
    defaultValues: { exerciseType: 'breathing' },
  });

  if (!open) return null;
  const token = session?.accessToken ?? '';

  const handleManualSubmit = async (data: ManualForm) => {
    setSaving(true);
    setError(null);
    try {
      await patientsApi.createExercise(patientId, { ...data, createdByAi: false }, token);
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (data: AiForm) => {
    setGenerating(true);
    setError(null);
    setGenerated(null);
    try {
      const result = await generateExercise(data, token);
      setGenerated(result);
      setEditedTitle(result.title);
      setEditedDescription(result.description);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de génération IA');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignGenerated = async () => {
    if (!editedTitle || !editedDescription) return;
    setSaving(true);
    setError(null);
    try {
      await patientsApi.createExercise(
        patientId,
        { title: editedTitle, description: editedDescription, createdByAi: true },
        token,
      );
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'assignation');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setGenerated(null);
    setError(null);
    manual.reset();
    ai.reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/30 focus:border-[#3D52A0]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Nouvel exercice</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setTab('manual'); setGenerated(null); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'manual' ? 'text-[#3D52A0] border-b-2 border-[#3D52A0]' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PenLine size={14} className="inline mr-1.5" />
            Manuel
          </button>
          <button
            onClick={() => { setTab('ai'); setError(null); }}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'ai' ? 'text-[#3D52A0] border-b-2 border-[#3D52A0]' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={14} className="inline mr-1.5" />
            IA
          </button>
        </div>

        <div className="p-6">
          {/* Manual tab */}
          {tab === 'manual' && (
            <form onSubmit={manual.handleSubmit(handleManualSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input {...manual.register('title')} className={inputClass} placeholder="Ex: Respiration 4-7-8" />
                {manual.formState.errors.title && (
                  <p className="mt-1 text-xs text-red-500">{manual.formState.errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea {...manual.register('description')} rows={4} className={inputClass} placeholder="Instructions détaillées..." />
                {manual.formState.errors.description && (
                  <p className="mt-1 text-xs text-red-500">{manual.formState.errors.description.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date limite (optionnel)</label>
                <input {...manual.register('dueDate')} type="date" className={inputClass} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin mr-1.5" />Création...</> : 'Assigner'}
                </Button>
              </div>
            </form>
          )}

          {/* AI tab */}
          {tab === 'ai' && !hasAiConsent && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">
                Ce patient n&apos;a pas autorisé le traitement IA.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Utilisez l&apos;onglet Manuel pour créer un exercice.
              </p>
            </div>
          )}

          {tab === 'ai' && hasAiConsent && !generated && (
            <form onSubmit={ai.handleSubmit(handleGenerate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thème</label>
                <input {...ai.register('theme')} className={inputClass} placeholder="Ex: Gestion de l'anxiété sociale" />
                {ai.formState.errors.theme && (
                  <p className="mt-1 text-xs text-red-500">{ai.formState.errors.theme.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type d&apos;exercice</label>
                <select {...ai.register('exerciseType')} className={inputClass}>
                  {EXERCISE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contexte patient</label>
                <textarea {...ai.register('patientContext')} rows={3} className={inputClass} placeholder="Contexte anonymisé du patient..." />
                {ai.formState.errors.patientContext && (
                  <p className="mt-1 text-xs text-red-500">{ai.formState.errors.patientContext.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={handleClose}>Annuler</Button>
                <Button type="submit" disabled={generating}>
                  {generating ? <><Loader2 size={14} className="animate-spin mr-1.5" />Génération...</> : <><Sparkles size={14} className="mr-1.5" />Générer</>}
                </Button>
              </div>
            </form>
          )}

          {/* AI preview */}
          {tab === 'ai' && hasAiConsent && generated && (
            <div className="space-y-4">
              <div className="rounded-lg bg-violet-50 border border-violet-200 p-3 text-xs text-violet-700">
                Exercice généré par IA — modifiez avant d&apos;assigner
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
                <input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} rows={4} className={inputClass} />
              </div>
              {generated.instructions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (lecture seule)</label>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1 bg-slate-50 rounded-lg p-3">
                    {generated.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ol>
                  <p className="text-xs text-slate-400 mt-1">
                    Intégrez les instructions dans la description si nécessaire.
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setGenerated(null)}>Regénérer</Button>
                <Button onClick={handleAssignGenerated} disabled={saving}>
                  {saving ? <><Loader2 size={14} className="animate-spin mr-1.5" />Assignation...</> : 'Assigner'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

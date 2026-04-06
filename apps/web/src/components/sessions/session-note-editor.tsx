'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useSession } from 'next-auth/react';
import { Save, Sparkles, Loader2, CheckCircle2, AlertCircle, X, Copy, Check, LayoutTemplate, AlignLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sessionsApi } from '@/lib/api/sessions';
import { streamSessionSummary } from '@/lib/api/ai';
import type { StructuredSummaryData } from '@/lib/api/ai';
import { cn } from '@/lib/utils';
import { OrientationSelector } from '@/components/sessions/orientation-selector';
import { StructuredNoteEditor } from '@/components/sessions/structured-note-editor';
import type { TherapyOrientation, TemplateSection } from '@/lib/api/note-templates';

// ─── Structured notes serialization ──────────────────────────────────────────

const STRUCTURED_PREFIX = '{"__template_id__"';

interface StructuredNotesPayload {
  __template_id__: string;
  __orientation__: TherapyOrientation;
  [sectionId: string]: string;
}

function serializeStructured(
  templateId: string,
  orientation: TherapyOrientation,
  values: Record<string, string>,
): string {
  const payload: StructuredNotesPayload = {
    __template_id__: templateId,
    __orientation__: orientation,
    ...values,
  };
  return JSON.stringify(payload);
}

function tryParseStructured(notes: string): {
  templateId: string;
  orientation: TherapyOrientation;
  values: Record<string, string>;
} | null {
  if (!notes.startsWith(STRUCTURED_PREFIX)) return null;
  try {
    const parsed = JSON.parse(notes) as StructuredNotesPayload;
    const { __template_id__: templateId, __orientation__: orientation, ...rest } = parsed;
    if (!templateId || !orientation) return null;
    return { templateId, orientation, values: rest };
  } catch {
    return null;
  }
}

interface AiMetadata {
  evolution?: string;
  alertLevel?: string;
  alertReason?: string | null;
  keyThemes?: string[];
  generatedAt?: string;
  model?: string;
}

interface SessionNoteEditorProps {
  sessionId: string;
  initialNotes?: string | null;
  existingSummary?: string | null;
  existingAiMetadata?: AiMetadata | null;
  existingTags?: string[];
  onNotesChange?: (notes: string) => void;
  onSummarySaved?: () => void;
  readOnly?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type AiStatus = 'idle' | 'streaming' | 'done' | 'error';
type EditorMode = 'free' | 'structured';

const MOOD_OPTIONS = [
  { value: 1, label: 'Très difficile', emoji: '😰', color: 'text-red-500 hover:bg-red-50' },
  { value: 2, label: 'Difficile', emoji: '😟', color: 'text-orange-500 hover:bg-orange-50' },
  { value: 3, label: 'Neutre', emoji: '😐', color: 'text-amber-500 hover:bg-amber-50' },
  { value: 4, label: 'Bien', emoji: '🙂', color: 'text-lime-500 hover:bg-lime-50' },
  { value: 5, label: 'Très bien', emoji: '😊', color: 'text-green-500 hover:bg-green-50' },
] as const;

const MOOD_SHORT_LABELS: Record<number, string> = {
  1: 'Très diff.',
  2: 'Difficile',
  3: 'Neutre',
  4: 'Bien',
  5: 'Très bien',
};

/**
 * Rendu Markdown minimaliste (sans dépendance externe)
 * Gère : ## titres, - listes, retours à la ligne
 */
function MarkdownBlock({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="text-sm text-foreground space-y-1 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <p key={i} className="font-semibold text-foreground mt-3 first:mt-0">
              {line.slice(3)}
            </p>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <p key={i} className="pl-3 text-muted-foreground before:content-['•'] before:mr-2 before:text-accent">
              {line.slice(2)}
            </p>
          );
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />;
        }
        return (
          <p key={i} className="text-muted-foreground">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function EvolutionBadge({ evolution }: { evolution: string }) {
  const config: Record<string, { label: string; className: string }> = {
    progress: { label: 'Progrès', className: 'bg-green-100 text-green-800 border-green-200' },
    stable: { label: 'Stable', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    regression: { label: 'Régression', className: 'bg-red-100 text-red-800 border-red-200' },
    mixed: { label: 'Mixte', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  };
  const fallback = { label: 'Stable', className: 'bg-gray-100 text-gray-700 border-gray-200' };
  const c = config[evolution] ?? fallback;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border', c.className)}>
      {c.label}
    </span>
  );
}

function AlertBadge({ level, reason }: { level: string; reason?: string | null }) {
  if (level === 'none') return null;
  const config: Record<string, { className: string }> = {
    low: { className: 'bg-amber-50 text-amber-700 border-amber-200' },
    medium: { className: 'bg-orange-50 text-orange-700 border-orange-200' },
    high: { className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const fallback = { className: 'bg-amber-50 text-amber-700 border-amber-200' };
  const c = config[level] ?? fallback;
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border', c.className)}
      title={reason ?? undefined}
    >
      <AlertCircle size={12} aria-hidden />
      Alerte {level === 'high' ? 'élevée' : level === 'medium' ? 'modérée' : 'faible'}
      {reason && ` — ${reason}`}
    </span>
  );
}

/**
 * SessionNoteEditor — Éditeur de notes de séance
 *
 * Fonctionnalités :
 * - Autosave toutes les 30 secondes
 * - Ctrl+S / Cmd+S pour sauvegarde manuelle
 * - MoodSelector 5 niveaux (accessible — emoji + label)
 * - Assistant IA opt-in avec streaming SSE
 * - Indicateur de statut sauvegarde
 */
export function SessionNoteEditor({
  sessionId,
  initialNotes = '',
  existingSummary,
  existingAiMetadata,
  existingTags,
  onNotesChange,
  onSummarySaved,
  readOnly = false,
}: SessionNoteEditorProps) {
  const { data: session } = useSession();

  // ─── Detect initial mode from notes content ───────────────────────────────
  const parsedInitial = tryParseStructured(initialNotes ?? '');

  const [notes, setNotes] = useState(
    parsedInitial ? '' : (initialNotes ?? ''),
  );
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // État IA
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [aiSummary, setAiSummary] = useState('');
  const [aiError, setAiError] = useState('');
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // État IA structuré / tags / save
  const [structuredData, setStructuredData] = useState<StructuredSummaryData | null>(null);
  const [editableTags, setEditableTags] = useState<string[]>(existingTags ?? []);
  const [newTagInput, setNewTagInput] = useState('');
  const [savingSummary, setSavingSummary] = useState(false);
  const [summaryToast, setSummaryToast] = useState<'saved' | null>(null);

  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesRef = useRef(notes);

  notesRef.current = notes;

  // ─── Template / orientation state ─────────────────────────────────────────
  const [editorMode, setEditorMode] = useState<EditorMode>(
    parsedInitial ? 'structured' : 'free',
  );
  const [orientationPanelOpen, setOrientationPanelOpen] = useState(
    parsedInitial ? true : false,
  );
  const [selectedOrientation, setSelectedOrientation] = useState<TherapyOrientation | null>(
    parsedInitial?.orientation ?? null,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    parsedInitial?.templateId ?? null,
  );
  const [templateSections, setTemplateSections] = useState<TemplateSection[]>([]);
  const [structuredValues, setStructuredValues] = useState<Record<string, string>>(
    parsedInitial?.values ?? {},
  );

  // Keep notesRef current for autosave — in structured mode, serialize before saving
  const getNotesForSave = useCallback((): string => {
    if (editorMode === 'structured' && selectedTemplateId && selectedOrientation) {
      return serializeStructured(selectedTemplateId, selectedOrientation, structuredValues);
    }
    return notesRef.current;
  }, [editorMode, selectedTemplateId, selectedOrientation, structuredValues]);

  // Sauvegarde
  const save = useCallback(async (silent = false) => {
    if (!isDirty && silent) return;
    if (!session?.accessToken) return;

    setSaveStatus('saving');
    try {
      await sessionsApi.autosave(sessionId, getNotesForSave(), session.accessToken);
      setSaveStatus('saved');
      setLastSaved(new Date());
      setIsDirty(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [sessionId, session?.accessToken, isDirty, getNotesForSave]);

  // Autosave 30s
  useEffect(() => {
    if (readOnly) return;

    if (isDirty) {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
      autosaveRef.current = setTimeout(() => {
        void save(true);
      }, 30000);
    }

    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current);
    };
  }, [isDirty, save, readOnly]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        void save(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save, readOnly]);

  // Annuler le stream IA à l'unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleChange = (value: string) => {
    setNotes(value);
    setIsDirty(true);
    onNotesChange?.(value);
  };

  // ─── Template handlers ────────────────────────────────────────────────────

  const handleTemplateApply = (id: string, sections: TemplateSection[]) => {
    setSelectedTemplateId(id);
    setTemplateSections(sections);
    // Initialise empty values for new sections (preserve existing if same id)
    setStructuredValues((prev) => {
      const next: Record<string, string> = {};
      sections.forEach((s) => {
        next[s.id] = prev[s.id] ?? '';
      });
      return next;
    });
    setEditorMode('structured');
    setIsDirty(true);
  };

  const handleStructuredChange = (values: Record<string, string>) => {
    setStructuredValues(values);
    setIsDirty(true);
    // Notify parent with serialized value
    if (selectedTemplateId && selectedOrientation) {
      onNotesChange?.(serializeStructured(selectedTemplateId, selectedOrientation, values));
    }
  };

  const handleSwitchToFree = () => {
    setEditorMode('free');
    // Keep notes content — switch to free mode with empty textarea if notes were structured
    if (!notes) {
      setNotes('');
    }
    setIsDirty(true);
  };

  // Determine if AI button should show
  const notesLengthForAi =
    editorMode === 'free'
      ? notes.length
      : Object.values(structuredValues).join(' ').length;

  // Lancer le résumé IA
  const handleAiSummarize = async () => {
    if (!session?.accessToken) return;
    if (aiStatus === 'streaming') {
      abortRef.current?.abort();
      setAiStatus('idle');
      return;
    }

    abortRef.current = new AbortController();
    setAiStatus('streaming');
    setAiSummary('');
    setAiError('');

    await streamSessionSummary(
      { rawNotes: getNotesForSave(), sessionId },
      session.accessToken,
      {
        onChunk: (text) => setAiSummary((prev) => prev + text),
        onStructuredData: (data) => {
          setStructuredData(data);
          setEditableTags(data.tags);
        },
        onDone: () => setAiStatus('done'),
        onError: (msg) => {
          setAiError(msg);
          setAiStatus('error');
        },
      },
      abortRef.current.signal,
    );
  };

  const handleCopySummary = async () => {
    if (!aiSummary) return;
    await navigator.clipboard.writeText(aiSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDismissAi = () => {
    abortRef.current?.abort();
    setAiStatus('idle');
    setAiSummary('');
    setAiError('');
    setStructuredData(null);
    setEditableTags([]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setEditableTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (tag && !editableTags.includes(tag)) {
      setEditableTags((prev) => [...prev, tag]);
    }
    setNewTagInput('');
  };

  const handleSaveSummary = async () => {
    if (!session?.accessToken || !aiSummary) return;
    setSavingSummary(true);
    try {
      await sessionsApi.update(
        sessionId,
        {
          summaryAi: aiSummary,
          tags: editableTags,
          aiMetadata: {
            evolution: structuredData?.evolution ?? 'stable',
            alertLevel: structuredData?.alertLevel ?? 'none',
            alertReason: structuredData?.alertReason ?? null,
            keyThemes: structuredData?.keyThemes ?? [],
            generatedAt: new Date().toISOString(),
            model: structuredData?.model ?? 'unknown',
          },
        },
        session.accessToken,
      );
      setSummaryToast('saved');
      setTimeout(() => setSummaryToast(null), 3000);
      onSummarySaved?.();
    } catch {
      setAiError('Erreur lors de la sauvegarde du résumé');
    } finally {
      setSavingSummary(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Bloc orientation thérapeutique (collapsible) ─── */}
      {!readOnly && (
        <div className="rounded-xl border border-border bg-surface/50">
          {/* Header collapsible */}
          <button
            type="button"
            onClick={() => setOrientationPanelOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-surface/80 transition-colors rounded-xl"
            aria-expanded={orientationPanelOpen}
          >
            <div className="flex items-center gap-2">
              <LayoutTemplate size={15} className="text-muted-foreground" aria-hidden />
              <span>Orientation thérapeutique</span>
              {selectedOrientation && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border',
                    // inline colors based on orientation
                    selectedOrientation === 'TCC' && 'bg-blue-50 text-blue-700 border-blue-200',
                    selectedOrientation === 'PSYCHODYNAMIQUE' && 'bg-purple-50 text-purple-700 border-purple-200',
                    selectedOrientation === 'SYSTEMIQUE' && 'bg-amber-50 text-amber-700 border-amber-200',
                    selectedOrientation === 'ACT' && 'bg-green-50 text-green-700 border-green-200',
                    selectedOrientation === 'AUTRE' && 'bg-gray-50 text-gray-700 border-gray-200',
                  )}
                >
                  {selectedOrientation === 'TCC' ? 'TCC'
                    : selectedOrientation === 'PSYCHODYNAMIQUE' ? 'Psychodynamique'
                    : selectedOrientation === 'SYSTEMIQUE' ? 'Systémique'
                    : selectedOrientation === 'ACT' ? 'ACT'
                    : 'Autre'}
                </span>
              )}
              {editorMode === 'structured' && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-accent/10 text-accent">
                  Mode structuré actif
                </span>
              )}
            </div>
            {orientationPanelOpen ? (
              <ChevronUp size={15} className="text-muted-foreground" aria-hidden />
            ) : (
              <ChevronDown size={15} className="text-muted-foreground" aria-hidden />
            )}
          </button>

          {/* Panel content */}
          {orientationPanelOpen && (
            <div className="px-4 pb-4 pt-1 border-t border-border space-y-4">
              <OrientationSelector
                orientation={selectedOrientation}
                onOrientationChange={setSelectedOrientation}
                selectedTemplateId={selectedTemplateId}
                onTemplateSelect={handleTemplateApply}
                token={session?.accessToken ?? ''}
              />

              {/* Mode toggle */}
              {editorMode === 'structured' && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSwitchToFree}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <AlignLeft size={13} aria-hidden />
                    Revenir en mode libre
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Mode toggle badge (read-only info) ─────────────── */}
      {!readOnly && editorMode === 'structured' && !orientationPanelOpen && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LayoutTemplate size={12} aria-hidden />
          <span>Mode structuré actif</span>
          <button
            type="button"
            onClick={handleSwitchToFree}
            className="text-xs text-primary hover:underline"
          >
            Passer en mode libre
          </button>
        </div>
      )}

      {/* Barre d'outils */}
      {!readOnly && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Humeur patient */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Humeur du patient (optionnel)
            </p>
            <div className="flex items-center gap-1" role="group" aria-label="Sélecteur d'humeur">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(selectedMood === mood.value ? null : mood.value)}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg transition-colors min-h-[52px] min-w-[48px]',
                    selectedMood === mood.value
                      ? 'bg-primary/10 ring-2 ring-primary'
                      : mood.color,
                  )}
                  aria-label={mood.label}
                  aria-pressed={selectedMood === mood.value}
                  title={mood.label}
                >
                  <span className="text-lg" aria-hidden="true">{mood.emoji}</span>
                  <span className="text-[10px] font-medium hidden sm:block leading-tight text-center">
                    {MOOD_SHORT_LABELS[mood.value]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Statut sauvegarde */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 size={12} className="text-muted-foreground animate-spin" aria-hidden />
                  <span className="text-muted-foreground">Sauvegarde...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 size={12} className="text-accent" aria-hidden />
                  <span className="text-accent">Sauvegardé</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle size={12} className="text-destructive" aria-hidden />
                  <span className="text-destructive">Erreur de sauvegarde</span>
                  <button
                    onClick={() => void save(false)}
                    className="text-xs text-primary hover:underline"
                  >
                    Réessayer
                  </button>
                </>
              )}
              {saveStatus === 'idle' && lastSaved && (
                <span className="text-muted-foreground">
                  Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => void save(false)}
              disabled={saveStatus === 'saving' || !isDirty}
              aria-label="Sauvegarder (Ctrl+S)"
            >
              <Save size={14} />
              Sauvegarder
            </Button>
          </div>
        </div>
      )}

      {/* Éditeur — Mode libre */}
      {editorMode === 'free' && (
        <div className="relative">
          <Textarea
            label={readOnly ? undefined : 'Notes de séance'}
            placeholder={
              readOnly
                ? 'Aucune note'
                : 'Rédigez vos notes cliniques ici...\n\nConseil : utilisez Ctrl+S pour sauvegarder rapidement.'
            }
            value={notes}
            onChange={readOnly ? undefined : (e) => handleChange(e.target.value)}
            readOnly={readOnly}
            className={cn(
              'min-h-[400px] resize-y font-sans text-sm leading-relaxed',
              readOnly && 'bg-surface cursor-default',
            )}
            hint={!readOnly ? 'Autosauvegarde toutes les 30 secondes • Chiffré AES-256-GCM (HDS)' : undefined}
          />
          {!readOnly && (
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-xs text-muted-foreground">
                {notes.trim()
                  ? `${notes.trim().split(/\s+/).filter(Boolean).length} mots`
                  : 'Commencez à rédiger...'}
              </span>
              {notes.length > 0 && notes.length < 50 && (
                <span className="text-xs text-amber-600">
                  Ajoutez plus de contenu pour activer l&apos;assistant IA
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Éditeur — Mode structuré */}
      {editorMode === 'structured' && (
        <div className="rounded-xl border border-border p-4 space-y-1">
          {templateSections.length === 0 && parsedInitial ? (
            // Notes structurées existantes mais sections non chargées — affichage texte brut
            <p className="text-sm text-muted-foreground italic">
              Template non trouvé localement. Sélectionnez le template ci-dessus pour éditer.
            </p>
          ) : (
            <StructuredNoteEditor
              sections={templateSections}
              values={structuredValues}
              onChange={handleStructuredChange}
              readOnly={readOnly}
            />
          )}
          {!readOnly && (
            <p className="text-xs text-muted-foreground pt-2">
              Autosauvegarde toutes les 30 secondes • Chiffré AES-256-GCM (HDS)
            </p>
          )}
        </div>
      )}

      {/* Résumé IA sauvegardé (affiché quand disponible et IA idle) */}
      {!readOnly && existingSummary && aiStatus === 'idle' && (
        <details className="rounded-xl border border-border bg-white shadow-sm group">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium text-foreground hover:bg-surface/50 rounded-xl">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-accent" aria-hidden />
              <span>Résumé IA sauvegardé</span>
              {existingAiMetadata?.evolution && (
                <EvolutionBadge evolution={existingAiMetadata.evolution} />
              )}
              {existingAiMetadata?.alertLevel && existingAiMetadata.alertLevel !== 'none' && (
                <AlertBadge level={existingAiMetadata.alertLevel} reason={existingAiMetadata.alertReason} />
              )}
            </div>
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
            <MarkdownBlock content={existingSummary} />
            {existingTags && existingTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {existingTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {existingAiMetadata?.generatedAt && (
              <p className="text-xs text-muted-foreground">
                Généré le {new Date(existingAiMetadata.generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <button
              onClick={() => {
                handleDismissAi();
                void handleAiSummarize();
              }}
              className="text-xs text-accent hover:underline"
            >
              Régénérer un nouveau résumé
            </button>
          </div>
        </details>
      )}

      {/* Bouton IA — opt-in uniquement, visible quand notes suffisantes */}
      {!readOnly && notesLengthForAi > 50 && aiStatus === 'idle' && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-start gap-3">
          <Sparkles size={18} className="text-accent flex-shrink-0 mt-0.5" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Assistant IA disponible</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Générer un résumé structuré à partir de vos notes
            </p>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={() => void handleAiSummarize()}
          >
            <Sparkles size={14} />
            Résumer
          </Button>
        </div>
      )}

      {/* Panneau résumé IA — streaming + résultat */}
      {!readOnly && (aiStatus === 'streaming' || aiStatus === 'done' || aiStatus === 'error') && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
            <div className="flex items-center gap-2">
              {aiStatus === 'streaming' ? (
                <Loader2 size={16} className="text-accent animate-spin" aria-hidden />
              ) : aiStatus === 'error' ? (
                <AlertCircle size={16} className="text-destructive" aria-hidden />
              ) : (
                <CheckCircle2 size={16} className="text-accent" aria-hidden />
              )}
              <span className="text-sm font-medium text-foreground">
                {aiStatus === 'streaming' && 'Génération en cours...'}
                {aiStatus === 'done' && 'Résumé IA'}
                {aiStatus === 'error' && 'Erreur IA'}
              </span>
              {aiStatus === 'streaming' && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Ne quittez pas la page
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {aiStatus === 'done' && aiSummary && (
                <button
                  onClick={() => void handleCopySummary()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copier le résumé"
                >
                  {copied ? (
                    <Check size={14} className="text-accent" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              )}
              {aiStatus === 'streaming' && (
                <button
                  onClick={handleDismissAi}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              )}
              {(aiStatus === 'done' || aiStatus === 'error') && (
                <button
                  onClick={handleDismissAi}
                  className="p-1 rounded hover:bg-accent/10 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Contenu */}
          <div className="p-4">
            {aiStatus === 'error' ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">{aiError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleAiSummarize()}
                >
                  Réessayer
                </Button>
              </div>
            ) : (
              <div className="min-h-[80px]">
                {aiSummary ? (
                  <MarkdownBlock content={aiSummary} />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce [animation-delay:0ms]">.</span>
                      <span className="animate-bounce [animation-delay:150ms]">.</span>
                      <span className="animate-bounce [animation-delay:300ms]">.</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tags + badges (quand done) */}
            {aiStatus === 'done' && (structuredData || editableTags.length > 0) && (
              <div className="mt-4 pt-3 border-t border-accent/20 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {structuredData?.evolution && (
                    <EvolutionBadge evolution={structuredData.evolution} />
                  )}
                  {structuredData?.alertLevel && structuredData.alertLevel !== 'none' && (
                    <AlertBadge level={structuredData.alertLevel} reason={structuredData.alertReason} />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tags suggérés (modifiables)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {editableTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive transition-colors"
                          aria-label={`Supprimer le tag ${tag}`}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <form
                      className="inline-flex"
                      onSubmit={(e) => { e.preventDefault(); handleAddTag(); }}
                    >
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        placeholder="+ tag"
                        className="w-16 text-xs rounded-full border border-dashed border-border px-2 py-0.5 focus:outline-none focus:border-primary"
                      />
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer légal (affiché uniquement quand terminé) */}
          {aiStatus === 'done' && (
            <div className="px-4 py-2 bg-accent/10 border-t border-accent/20">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Outil d&apos;aide uniquement</span> — Le praticien reste
                responsable de l&apos;interprétation clinique. Ce résumé ne remplace pas votre jugement professionnel.
              </p>
            </div>
          )}

          {/* Barre d'actions (done) */}
          {aiStatus === 'done' && (
            <div className="px-4 pb-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleDismissAi();
                    void handleAiSummarize();
                  }}
                  className="text-xs text-accent hover:underline"
                >
                  Régénérer
                </button>
                <button
                  onClick={handleDismissAi}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Fermer
                </button>
              </div>
              <div className="flex items-center gap-2">
                {summaryToast === 'saved' && (
                  <span className="text-xs text-accent flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Résumé sauvegardé
                  </span>
                )}
                <Button
                  size="sm"
                  onClick={() => void handleSaveSummary()}
                  loading={savingSummary}
                  disabled={savingSummary || !aiSummary}
                >
                  <Save size={14} />
                  Sauvegarder le résumé
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

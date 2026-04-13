'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  Dumbbell,
  FileText,
  Linkedin,
  Mail,
  BookOpen,
  Loader2,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Library,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { cn, formatDateShort } from '@/lib/utils';
import { billingApi } from '@/lib/api/billing';
import { UsageIndicator } from '@/components/shared/usage-indicator';

type ContentType = 'linkedin' | 'newsletter' | 'blog';
type ExerciseType = 'breathing' | 'journaling' | 'exposure' | 'mindfulness' | 'cognitive';
type ToneType = 'professional' | 'warm' | 'educational';
type ActiveTab = 'exercise' | 'content' | 'library';

const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: typeof Linkedin; description: string }> = {
  linkedin: {
    label: 'Post LinkedIn',
    icon: Linkedin,
    description: 'Article court et engageant pour votre réseau professionnel',
  },
  newsletter: {
    label: 'Newsletter',
    icon: Mail,
    description: 'Article informatif pour vos patients et abonnés',
  },
  blog: {
    label: 'Article de blog',
    icon: BookOpen,
    description: 'Article SEO long-format sur la psychologie',
  },
};

const EXERCISE_TYPE_CONFIG: Record<ExerciseType, { label: string; description: string }> = {
  breathing: { label: 'Respiration', description: 'Exercices de cohérence cardiaque et respiration consciente' },
  journaling: { label: 'Journal de pensées', description: 'Rédaction structurée pour identifier et restructurer les pensées' },
  exposure: { label: 'Exposition progressive', description: 'Thérapie d\'exposition graduelle pour les phobies et angoisses' },
  mindfulness: { label: 'Pleine conscience', description: 'Méditation et ancrage dans le moment présent' },
  cognitive: { label: 'Restructuration cognitive', description: 'Identifier et challenger les schémas de pensée négatifs' },
};

const TONE_CONFIG: Record<ToneType, { label: string; description: string }> = {
  professional: { label: 'Professionnel', description: 'Expert et précis' },
  warm: { label: 'Chaleureux', description: 'Proche et bienveillant' },
  educational: { label: 'Pédagogique', description: 'Clair et accessible' },
};

interface GeneratedExercise {
  title: string;
  description: string;
  instructions: string[];
  duration: string;
  frequency: string;
  disclaimer: string;
}

interface SavedContent {
  id: string;
  type: string;
  theme: string;
  tone: string;
  content: string;
  createdAt: string;
}

export function AiAssistantContent() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ActiveTab>('exercise');

  const { data: usage } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => billingApi.getUsage(session?.accessToken ?? ''),
    enabled: !!session?.accessToken,
    staleTime: 60_000,
  });

  // Exercice
  const [exerciseType, setExerciseType] = useState<ExerciseType>('breathing');
  const [theme, setTheme] = useState('');
  const [patientContext, setPatientContext] = useState('');
  const [generatingExercise, setGeneratingExercise] = useState(false);
  const [generatedExercise, setGeneratedExercise] = useState<GeneratedExercise | null>(null);
  const [exerciseError, setExerciseError] = useState('');

  // Contenu marketing
  const [contentType, setContentType] = useState<ContentType>('linkedin');
  const [contentTheme, setContentTheme] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentError, setContentError] = useState('');

  // Sauvegarde
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Bibliothèque
  const [libraryContents, setLibraryContents] = useState<SavedContent[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Copier
  const [copiedExercise, setCopiedExercise] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedLibraryId, setCopiedLibraryId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'library') void loadLibrary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleGenerateExercise = async () => {
    if (!session?.accessToken || !theme.trim()) return;
    setGeneratingExercise(true);
    setExerciseError('');
    setGeneratedExercise(null);
    try {
      const result = await apiClient.post<GeneratedExercise>(
        '/ai/generate-exercise',
        {
          exerciseType,
          theme: theme.trim(),
          patientContext: patientContext.trim() || 'Pas de contexte supplémentaire',
        },
        session.accessToken,
      );
      setGeneratedExercise(result);
    } catch (err) {
      setExerciseError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setGeneratingExercise(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!session?.accessToken || !contentTheme.trim()) return;
    setGeneratingContent(true);
    setContentError('');
    setGeneratedContent('');

    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    try {
      const response = await fetch(`${API}/api/v1/ai/stream-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ type: contentType, theme: contentTheme.trim(), tone }),
      });

      if (!response.ok || !response.body) throw new Error('Erreur serveur');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.text) {
              accumulated += parsed.text;
              setGeneratedContent(accumulated);
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch (err) {
      setContentError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleSaveContent = async () => {
    if (!session?.accessToken || !generatedContent) return;
    setSaving(true);
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    try {
      await fetch(`${API}/api/v1/ai/content-library`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          type: contentType,
          theme: contentTheme.trim(),
          tone,
          content: generatedContent,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  const loadLibrary = async () => {
    if (!session?.accessToken) return;
    setLoadingLibrary(true);
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    try {
      const res = await fetch(`${API}/api/v1/ai/content-library`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json() as SavedContent[];
      setLibraryContents(data);
    } catch {
      /* silent */
    } finally {
      setLoadingLibrary(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!session?.accessToken) return;
    const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    await fetch(`${API}/api/v1/ai/content-library/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    setLibraryContents(prev => prev.filter(c => c.id !== id));
  };

  const copyExercise = async () => {
    if (!generatedExercise) return;
    const text = [
      `# ${generatedExercise.title}`,
      '',
      generatedExercise.description,
      '',
      '## Instructions',
      ...generatedExercise.instructions.map((s, i) => `${i + 1}. ${s}`),
      '',
      `Durée : ${generatedExercise.duration}`,
      `Fréquence : ${generatedExercise.frequency}`,
    ].join('\n');
    await navigator.clipboard.writeText(text);
    setCopiedExercise(true);
    setTimeout(() => setCopiedExercise(false), 2000);
  };

  const copyContent = async () => {
    if (!generatedContent) return;
    await navigator.clipboard.writeText(generatedContent);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const copyLibraryContent = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedLibraryId(id);
    setTimeout(() => setCopiedLibraryId(null), 2000);
  };

  const formatDate = (iso: string) => formatDateShort(iso);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* En-tête */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-accent" aria-hidden />
          <h1 className="text-2xl font-bold text-foreground">Assistant IA</h1>
        </div>
        <p className="text-muted-foreground">
          Générez des exercices thérapeutiques et du contenu professionnel
        </p>
        {usage && (
          <div className="mt-2">
            <UsageIndicator label="Credits IA ce mois" used={usage.ai.used} limit={usage.ai.limit} />
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
        <strong>Outil d&apos;aide uniquement.</strong> Ces contenus sont générés par IA et doivent être
        validés par votre expertise clinique. Aucune donnée patient n&apos;est transmise à l&apos;IA.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('exercise')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'exercise'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Dumbbell size={16} />
          Exercice thérapeutique
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'content'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <FileText size={16} />
          Contenu marketing
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'library'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          <Library size={16} />
          Bibliothèque
        </button>
      </div>

      {/* Tab — Exercice */}
      {activeTab === 'exercise' && (
        <div className="space-y-6">
          {/* Type d'exercice */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Type d&apos;exercice</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {(Object.entries(EXERCISE_TYPE_CONFIG) as [ExerciseType, typeof EXERCISE_TYPE_CONFIG[ExerciseType]][]).map(
                ([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setExerciseType(type)}
                    className={cn(
                      'text-left p-3 rounded-xl border transition-colors',
                      exerciseType === type
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30 hover:bg-surface',
                    )}
                  >
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{config.description}</p>
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Thème */}
          <Textarea
            label="Thématique thérapeutique"
            placeholder="Ex: gestion de l'anxiété sociale, améliorer la confiance en soi, dépression légère..."
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            hint="Soyez spécifique pour un exercice plus adapté"
          />

          {/* Contexte patient (anonymisé) */}
          <Textarea
            label="Contexte patient anonymisé (optionnel)"
            placeholder="Ex: adulte 35 ans, travailleur, premiers épisodes anxieux, bon ancrage social... (JAMAIS de nom ni données identifiantes)"
            value={patientContext}
            onChange={(e) => setPatientContext(e.target.value)}
            hint="Ce contexte anonymisé aide l'IA à personnaliser l'exercice — ne jamais inclure de données identifiantes"
          />

          <Button
            onClick={() => void handleGenerateExercise()}
            disabled={!theme.trim() || generatingExercise}
            className="w-full sm:w-auto"
          >
            {generatingExercise ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Générer l&apos;exercice
              </>
            )}
          </Button>

          {exerciseError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {exerciseError}
            </div>
          )}

          {/* Résultat exercice */}
          {generatedExercise && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-accent/20">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  <span className="text-sm font-medium text-foreground">{generatedExercise.title}</span>
                </div>
                <button
                  onClick={() => void copyExercise()}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedExercise ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                  {copiedExercise ? 'Copié' : 'Copier'}
                </button>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{generatedExercise.description}</p>

                {generatedExercise.instructions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Instructions</p>
                    <ol className="space-y-1.5">
                      {generatedExercise.instructions.map((step, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-medium">
                            {i + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    <strong className="text-foreground">Durée :</strong> {generatedExercise.duration}
                  </span>
                  <span>
                    <strong className="text-foreground">Fréquence :</strong> {generatedExercise.frequency}
                  </span>
                </div>

                {generatedExercise.disclaimer && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">{generatedExercise.disclaimer}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab — Contenu marketing */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Type de contenu */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Type de contenu</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.entries(CONTENT_TYPE_CONFIG) as [ContentType, typeof CONTENT_TYPE_CONFIG[ContentType]][]).map(
                ([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => setContentType(type)}
                      className={cn(
                        'text-left p-3 rounded-xl border transition-colors flex items-start gap-3',
                        contentType === type
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/30 hover:bg-surface',
                      )}
                    >
                      <Icon size={18} className="flex-shrink-0 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{config.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Sélecteur de ton */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Ton de la rédaction</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(TONE_CONFIG) as [ToneType, typeof TONE_CONFIG[ToneType]][]).map(
                ([toneKey, config]) => (
                  <button
                    key={toneKey}
                    onClick={() => setTone(toneKey)}
                    className={cn(
                      'flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-colors',
                      tone === toneKey
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/30 hover:bg-surface',
                    )}
                  >
                    <span className="text-sm font-medium text-foreground">{config.label}</span>
                    <span className="text-xs text-muted-foreground">{config.description}</span>
                  </button>
                ),
              )}
            </div>
          </div>

          <Textarea
            label="Thème de l'article"
            placeholder="Ex: la gestion du burn-out, les bienfaits de la thérapie cognitivo-comportementale, surmonter la phobie sociale..."
            value={contentTheme}
            onChange={(e) => setContentTheme(e.target.value)}
            hint="Aucune donnée patient ne sera incluse — thèmes généraux uniquement"
          />

          <Button
            onClick={() => void handleGenerateContent()}
            disabled={!contentTheme.trim() || generatingContent}
            className="w-full sm:w-auto"
          >
            {generatingContent ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Générer le contenu
              </>
            )}
          </Button>

          {contentError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {contentError}
            </div>
          )}

          {/* Résultat contenu */}
          {generatedContent && (
            <div className="rounded-xl border border-primary/20 bg-surface overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = CONTENT_TYPE_CONFIG[contentType].icon;
                    return <Icon size={16} className="text-primary" />;
                  })()}
                  <span className="text-sm font-medium text-foreground">
                    {CONTENT_TYPE_CONFIG[contentType].label} généré
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void copyContent()}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copiedContent ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
                    {copiedContent ? 'Copié' : 'Copier'}
                  </button>
                  <button
                    onClick={() => void handleSaveContent()}
                    disabled={saving}
                    className={cn(
                      'flex items-center gap-1 text-xs transition-colors',
                      saved
                        ? 'text-accent'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {saving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saved ? (
                      <BookmarkCheck size={14} className="text-accent" />
                    ) : (
                      <Bookmark size={14} />
                    )}
                    {saved ? 'Sauvegardé' : 'Sauvegarder'}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {generatedContent}
                </pre>
              </div>
            </div>
          )}

          {/* Alerte RGPD */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            <strong>RGPD :</strong> Ce contenu est généré sans aucune donnée patient.
            Vérifiez que votre contenu ne mentionne aucun patient identifiable avant publication.
          </div>
        </div>
      )}

      {/* Tab — Bibliothèque */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          {loadingLibrary ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border border-border p-4 space-y-2 animate-pulse">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : libraryContents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Library size={40} className="text-muted-foreground mb-4 opacity-40" />
              <p className="text-sm text-muted-foreground">
                Aucun contenu sauvegardé. Générez votre premier contenu marketing !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {libraryContents.map(item => {
                const typeConfig = CONTENT_TYPE_CONFIG[item.type as ContentType];
                const toneConfig = TONE_CONFIG[item.tone as ToneType];
                const isExpanded = expandedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-surface overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {typeConfig ? typeConfig.label : item.type} — {item.theme}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {toneConfig ? toneConfig.label : item.tone} · {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void copyLibraryContent(item.id, item.content);
                          }}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors p-1"
                        >
                          {copiedLibraryId === item.id ? (
                            <Check size={14} className="text-accent" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteContent(item.id);
                          }}
                          className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-3">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                          {item.content}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

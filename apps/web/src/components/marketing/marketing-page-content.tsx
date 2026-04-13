'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
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
import { cn, formatDateShort } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────────

type ContentType = 'linkedin' | 'newsletter' | 'blog';
type ToneType = 'professional' | 'warm' | 'educational';

interface SavedContent {
  id: string;
  type: string;
  theme: string;
  tone: string;
  content: string;
  createdAt: string;
}

// ─── Config ─────────────────────────────────────────────────────────────────────

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

const TONE_CONFIG: Record<ToneType, { label: string; description: string }> = {
  professional: { label: 'Professionnel', description: 'Expert et précis' },
  warm: { label: 'Chaleureux', description: 'Proche et bienveillant' },
  educational: { label: 'Pédagogique', description: 'Clair et accessible' },
};

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ─── Component ──────────────────────────────────────────────────────────────────

export function MarketingPageContent() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Generator state
  const [contentType, setContentType] = useState<ContentType>('linkedin');
  const [contentTheme, setContentTheme] = useState('');
  const [tone, setTone] = useState<ToneType>('professional');
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentError, setContentError] = useState('');

  // Copy / save state
  const [copiedContent, setCopiedContent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedLibraryId, setCopiedLibraryId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ─── Library query ──────────────────────────────────────────────────────────

  const {
    data: libraryContents = [],
    isLoading: loadingLibrary,
  } = useQuery<SavedContent[]>({
    queryKey: ['content-library'],
    queryFn: async () => {
      if (!session?.accessToken) return [];
      const res = await fetch(`${API}/api/v1/ai/content-library`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error('Erreur chargement bibliothèque');
      return res.json() as Promise<SavedContent[]>;
    },
    enabled: !!session?.accessToken,
  });

  // ─── Save mutation ──────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session?.accessToken || !generatedContent) return;
      const res = await fetch(`${API}/api/v1/ai/content-library`, {
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
      if (!res.ok) throw new Error('Erreur sauvegarde');
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      void queryClient.invalidateQueries({ queryKey: ['content-library'] });
    },
  });

  // ─── Delete mutation ────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!session?.accessToken) return;
      const res = await fetch(`${API}/api/v1/ai/content-library/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!res.ok) throw new Error('Erreur suppression');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content-library'] });
    },
  });

  // ─── SSE streaming generation ───────────────────────────────────────────────

  const handleGenerateContent = useCallback(async () => {
    if (!session?.accessToken || !contentTheme.trim()) return;
    setGeneratingContent(true);
    setContentError('');
    setGeneratedContent('');

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
  }, [session?.accessToken, contentTheme, contentType, tone]);

  // ─── Copy helpers ───────────────────────────────────────────────────────────

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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-accent" aria-hidden />
          <h1 className="text-2xl font-bold text-foreground">Marketing IA</h1>
        </div>
        <p className="text-muted-foreground">
          Générez du contenu professionnel pour développer votre visibilité
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
        <strong>Outil d&apos;aide uniquement.</strong> Ces contenus sont générés par IA et doivent être
        validés par votre expertise clinique. Aucune donnée patient n&apos;est transmise à l&apos;IA.
      </div>

      {/* ─── Generator Section ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Form */}
        <div className="space-y-6">
          {/* Content type selector */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Type de contenu</p>
            <div className="grid grid-cols-1 gap-2">
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

          {/* Tone selector */}
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

          {/* Theme textarea */}
          <Textarea
            label="Thème de l'article"
            placeholder="Ex: la gestion du burn-out, les bienfaits de la thérapie cognitivo-comportementale, surmonter la phobie sociale..."
            value={contentTheme}
            onChange={(e) => setContentTheme(e.target.value)}
            hint="Aucune donnée patient ne sera incluse — thèmes généraux uniquement"
          />

          {/* Generate button */}
          <Button
            onClick={() => void handleGenerateContent()}
            disabled={!contentTheme.trim() || generatingContent}
            className="w-full sm:w-auto"
          >
            {generatingContent ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Générer le contenu
              </>
            )}
          </Button>
        </div>

        {/* Right column: Output */}
        <div className="space-y-4">
          {/* Error */}
          {contentError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {contentError}
            </div>
          )}

          {/* Generated content */}
          {generatedContent ? (
            <div className="rounded-xl border border-primary/20 bg-surface overflow-hidden shadow-sm">
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
                    onClick={() => void saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className={cn(
                      'flex items-center gap-1 text-xs transition-colors',
                      saved
                        ? 'text-accent'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {saveMutation.isPending ? (
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
              <div className="p-4 max-h-[500px] overflow-y-auto">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {generatedContent}
                </pre>
              </div>
            </div>
          ) : !generatingContent && !contentError ? (
            <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles size={24} className="text-primary" aria-hidden />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Prêt à générer
                </p>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Choisissez un type de contenu, un ton, saisissez votre thème puis cliquez sur Générer
                </p>
              </div>
            </div>
          ) : generatingContent ? (
            <div className="rounded-xl border border-primary/20 bg-surface overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Loader2 size={16} className="text-primary animate-spin" />
                <span className="text-sm font-medium text-foreground">Génération en cours...</span>
              </div>
              <div className="p-4">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {generatedContent}
                </pre>
                <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse rounded-sm ml-0.5" />
              </div>
            </div>
          ) : null}

          {/* RGPD notice */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            <strong>RGPD :</strong> Ce contenu est généré sans aucune donnée patient.
            Vérifiez que votre contenu ne mentionne aucun patient identifiable avant publication.
          </div>
        </div>
      </div>

      {/* ─── Library Section ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Library size={18} className="text-muted-foreground" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">Bibliothèque</h2>
          {libraryContents.length > 0 && (
            <span className="text-xs text-muted-foreground bg-surface rounded-full px-2 py-0.5 border border-border">
              {libraryContents.length}
            </span>
          )}
        </div>

        {loadingLibrary ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border bg-white p-4 space-y-2 animate-pulse shadow-sm">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : libraryContents.length === 0 ? (
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Library size={40} className="text-muted-foreground mb-4 opacity-40" />
              <p className="text-sm text-muted-foreground">
                Aucun contenu sauvegardé. Générez votre premier contenu marketing !
              </p>
            </div>
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
                  className="rounded-xl border border-border bg-white overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {typeConfig && (() => {
                          const Icon = typeConfig.icon;
                          return (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                              <Icon size={12} />
                              {typeConfig.label}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.theme}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {toneConfig ? toneConfig.label : item.tone} · {formatDateShort(item.createdAt)}
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
                          void deleteMutation.mutate(item.id);
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
    </div>
  );
}

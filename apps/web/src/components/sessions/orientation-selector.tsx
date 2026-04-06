'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  noteTemplatesApi,
  type TherapyOrientation,
  type TemplateSection,
  type NoteTemplate,
  ORIENTATION_LABELS,
  ORIENTATION_COLORS,
} from '@/lib/api/note-templates';

// ─── Constants ────────────────────────────────────────────────────────────────

const ORIENTATIONS: TherapyOrientation[] = [
  'TCC',
  'PSYCHODYNAMIQUE',
  'SYSTEMIQUE',
  'ACT',
  'AUTRE',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrientationSelectorProps {
  orientation: TherapyOrientation | null;
  onOrientationChange: (o: TherapyOrientation) => void;
  selectedTemplateId: string | null;
  onTemplateSelect: (id: string, sections: TemplateSection[]) => void;
  token: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OrientationSelector({
  orientation,
  onOrientationChange,
  selectedTemplateId,
  onTemplateSelect,
  token,
}: OrientationSelectorProps) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Charger les templates quand l'orientation change
  useEffect(() => {
    if (!orientation) {
      setTemplates([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    noteTemplatesApi
      .getTemplates(token, orientation)
      .then((data) => {
        if (!cancelled) {
          setTemplates(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Impossible de charger les templates pour cette orientation.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orientation, token]);

  return (
    <div className="space-y-3">
      {/* Pills orientation */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Orientation thérapeutique">
        {ORIENTATIONS.map((o) => {
          const colors = ORIENTATION_COLORS[o];
          const isSelected = orientation === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onOrientationChange(o)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-all min-h-[36px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isSelected
                  ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-current`
                  : 'bg-white border-border text-muted-foreground hover:bg-surface',
              )}
              aria-pressed={isSelected}
            >
              {ORIENTATION_LABELS[o]}
            </button>
          );
        })}
      </div>

      {/* Liste de templates */}
      {orientation && (
        <div className="space-y-2">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              Chargement des templates...
            </div>
          )}

          {error && !loading && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          {!loading && !error && templates.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              Aucun template disponible pour cette orientation.
            </p>
          )}

          {!loading && !error && templates.length > 0 && (
            <div className="space-y-1.5">
              {templates.map((tpl) => {
                const colors = ORIENTATION_COLORS[tpl.orientation];
                const isChosen = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onTemplateSelect(tpl.id, tpl.sections)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      isChosen
                        ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ${colors.text}`
                        : 'bg-white border-border hover:bg-surface',
                    )}
                    aria-pressed={isChosen}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('font-medium', isChosen ? colors.text : 'text-foreground')}>
                            {tpl.name}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                              tpl.isSystem
                                ? 'bg-primary/10 text-primary'
                                : 'bg-accent/10 text-accent',
                            )}
                          >
                            {tpl.isSystem ? 'Système' : 'Perso'}
                          </span>
                        </div>
                        {tpl.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {tpl.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tpl.sections.length} section{tpl.sections.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      {isChosen && (
                        <CheckCircle2
                          size={16}
                          className={cn('flex-shrink-0 mt-0.5', colors.text)}
                          aria-hidden
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

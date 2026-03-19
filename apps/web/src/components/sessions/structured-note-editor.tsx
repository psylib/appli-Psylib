'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { TemplateSection } from '@/lib/api/note-templates';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StructuredNoteEditorProps {
  sections: TemplateSection[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  readOnly?: boolean;
}

// ─── Auto-resize hook ─────────────────────────────────────────────────────────

function useAutoResize(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [ref, value]);
}

// ─── Single section textarea ──────────────────────────────────────────────────

interface SectionFieldProps {
  section: TemplateSection;
  value: string;
  onChange: (val: string) => void;
  readOnly: boolean;
}

function SectionField({ section, value, onChange, readOnly }: SectionFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useAutoResize(ref, value);

  const wordCount = value.trim()
    ? value.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const textareaId = `section-${section.id}`;

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label htmlFor={textareaId} className="flex items-center gap-1 text-sm font-semibold text-foreground">
        {section.title}
        {section.required && (
          <span className="text-destructive" aria-hidden="true" title="Champ requis">
            *
          </span>
        )}
      </label>

      {/* Textarea */}
      <textarea
        id={textareaId}
        ref={ref}
        value={value}
        onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder={readOnly ? '' : section.placeholder}
        aria-required={section.required}
        className={cn(
          'w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground',
          'placeholder:text-muted-foreground resize-none overflow-hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          section.required ? 'min-h-[120px]' : 'min-h-[80px]',
          readOnly && 'bg-surface cursor-default',
        )}
      />

      {/* Word count */}
      {!readOnly && (
        <p className="text-xs text-muted-foreground text-right pr-1">
          {wordCount > 0 ? `${wordCount} mot${wordCount > 1 ? 's' : ''}` : ''}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StructuredNoteEditor({
  sections,
  values,
  onChange,
  readOnly = false,
}: StructuredNoteEditorProps) {
  const handleFieldChange = (sectionId: string, val: string) => {
    onChange({ ...values, [sectionId]: val });
  };

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Ce template ne contient aucune section.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <SectionField
          key={section.id}
          section={section}
          value={values[section.id] ?? ''}
          onChange={(val) => handleFieldChange(section.id, val)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Pencil, Trash2, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  noteTemplatesApi,
  type NoteTemplate,
  type TherapyOrientation,
  type TemplateSection,
  type CreateTemplateData,
  ORIENTATION_LABELS,
  ORIENTATION_COLORS,
} from '@/lib/api/note-templates';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_ORIENTATIONS: TherapyOrientation[] = [
  'TCC',
  'PSYCHODYNAMIQUE',
  'SYSTEMIQUE',
  'ACT',
  'AUTRE',
];

type FilterTab = 'ALL' | TherapyOrientation;

// ─── Empty section factory ─────────────────────────────────────────────────────

function newSection(): TemplateSection {
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    placeholder: '',
    required: false,
  };
}

// ─── Template form state ──────────────────────────────────────────────────────

interface TemplateFormState {
  orientation: TherapyOrientation;
  name: string;
  description: string;
  sections: TemplateSection[];
}

function defaultFormState(): TemplateFormState {
  return {
    orientation: 'TCC',
    name: '',
    description: '',
    sections: [newSection()],
  };
}

// ─── Template Modal ───────────────────────────────────────────────────────────

interface TemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateTemplateData) => Promise<void>;
  initial?: NoteTemplate | null;
}

function TemplateModal({ open, onClose, onSave, initial }: TemplateModalProps) {
  const [form, setForm] = useState<TemplateFormState>(defaultFormState);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          orientation: initial.orientation,
          name: initial.name,
          description: initial.description ?? '',
          sections: initial.sections.length > 0 ? initial.sections : [newSection()],
        });
      } else {
        setForm(defaultFormState());
      }
      setFormError(null);
    }
  }, [open, initial]);

  const handleSectionChange = (
    idx: number,
    field: keyof TemplateSection,
    value: string | boolean,
  ) => {
    setForm((prev) => {
      const sections = [...prev.sections];
      sections[idx] = { ...sections[idx], [field]: value } as TemplateSection;
      return { ...prev, sections };
    });
  };

  const addSection = () => {
    setForm((prev) => ({ ...prev, sections: [...prev.sections, newSection()] }));
  };

  const removeSection = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Le nom du template est requis.');
      return;
    }
    if (form.sections.some((s) => !s.title.trim())) {
      setFormError('Chaque section doit avoir un titre.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        orientation: form.orientation,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        sections: form.sections,
      });
      onClose();
    } catch {
      setFormError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? 'Modifier le template' : 'Nouveau template'}
      className="max-w-2xl"
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Orientation */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Orientation thérapeutique</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir une orientation">
            {ALL_ORIENTATIONS.map((o) => {
              const colors = ORIENTATION_COLORS[o];
              const isSelected = form.orientation === o;
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, orientation: o }))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
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
        </div>

        {/* Nom */}
        <Input
          label="Nom du template"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Séance TCC standard"
          required
        />

        {/* Description */}
        <Textarea
          label="Description (optionnelle)"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Décrivez brièvement l'usage de ce template..."
          className="min-h-[80px]"
        />

        {/* Sections */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Sections</p>
          {form.sections.map((section, idx) => (
            <div
              key={section.id}
              className="border border-border rounded-lg p-3 space-y-2 bg-surface/50"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Section {idx + 1}
                </span>
                {form.sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                    aria-label={`Supprimer la section ${idx + 1}`}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                )}
              </div>
              <Input
                label="Titre de la section"
                value={section.title}
                onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                placeholder="Ex: Présentation du problème"
                required
              />
              <Input
                label="Placeholder (texte d'aide)"
                value={section.placeholder}
                onChange={(e) => handleSectionChange(idx, 'placeholder', e.target.value)}
                placeholder="Ex: Décrivez la plainte principale du patient..."
              />
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={section.required}
                  onChange={(e) => handleSectionChange(idx, 'required', e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-foreground">Section obligatoire</span>
              </label>
            </div>
          ))}

          <button
            type="button"
            onClick={addSection}
            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium py-1"
          >
            <Plus size={15} aria-hidden />
            Ajouter une section
          </button>
        </div>

        {/* Error */}
        {formError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} aria-hidden />
            {formError}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" loading={saving}>
            {initial ? 'Enregistrer' : 'Créer le template'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Template Card ────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: NoteTemplate;
  onEdit: (tpl: NoteTemplate) => void;
  onDelete: (tpl: NoteTemplate) => void;
}

function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const colors = ORIENTATION_COLORS[template.orientation];

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardContent className="p-4 flex flex-col gap-3 h-full">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
                colors.bg,
                colors.text,
                colors.border,
              )}
            >
              {ORIENTATION_LABELS[template.orientation]}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                template.isSystem
                  ? 'bg-primary/10 text-primary'
                  : 'bg-accent/10 text-accent',
              )}
            >
              {template.isSystem ? 'Système' : 'Perso'}
            </span>
          </div>

          {/* Actions — uniquement pour les templates perso */}
          {!template.isSystem ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => onEdit(template)}
                className="p-1.5 rounded hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Modifier ${template.name}`}
              >
                <Pencil size={14} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onDelete(template)}
                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                aria-label={`Supprimer ${template.name}`}
              >
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          ) : (
            <div
              className="flex-shrink-0 text-xs text-muted-foreground italic"
              title="Template officiel — non modifiable"
            >
              officiel
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm text-foreground leading-tight">{template.name}</h3>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
            {template.description}
          </p>
        )}

        {/* Sections count */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
          <FileText size={12} aria-hidden />
          {template.sections.length} section{template.sections.length > 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

interface DeleteConfirmProps {
  open: boolean;
  templateName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

function DeleteConfirmDialog({
  open,
  templateName,
  onConfirm,
  onCancel,
  deleting,
}: DeleteConfirmProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Supprimer le template"
      description={`Êtes-vous sûr de vouloir supprimer "${templateName}" ? Cette action est irréversible.`}
    >
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={deleting}>
          Annuler
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          loading={deleting}
        >
          Supprimer
        </Button>
      </div>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NoteTemplatesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);

  // Delete state
  const [deletingTemplate, setDeletingTemplate] = useState<NoteTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchTemplates = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setPageError(null);
    try {
      const data = await noteTemplatesApi.getTemplates(token);
      setTemplates(data);
    } catch {
      setPageError('Impossible de charger les templates. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleCreate = async (data: CreateTemplateData) => {
    const created = await noteTemplatesApi.createTemplate(token, data);
    setTemplates((prev) => [created, ...prev]);
  };

  const handleUpdate = async (data: CreateTemplateData) => {
    if (!editingTemplate) return;
    const updated = await noteTemplatesApi.updateTemplate(token, editingTemplate.id, data);
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    setDeleting(true);
    try {
      await noteTemplatesApi.deleteTemplate(token, deletingTemplate.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplate.id));
      setDeletingTemplate(null);
    } catch {
      // Keep dialog open on error
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditingTemplate(null);
    setModalOpen(true);
  };

  const openEdit = (tpl: NoteTemplate) => {
    setEditingTemplate(tpl);
    setModalOpen(true);
  };

  // ─── Filtered templates ──────────────────────────────────────────────────────

  const filteredTemplates =
    activeFilter === 'ALL'
      ? templates
      : templates.filter((t) => t.orientation === activeFilter);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates de notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Structurez vos notes cliniques selon votre approche thérapeutique
          </p>
        </div>
        <Button onClick={openCreate} disabled={!token}>
          <Plus size={16} aria-hidden />
          Nouveau template
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par orientation">
        {(['ALL', ...ALL_ORIENTATIONS] as FilterTab[]).map((tab) => {
          const isActive = activeFilter === tab;
          const colors = tab !== 'ALL' ? ORIENTATION_COLORS[tab] : null;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-all min-h-[36px]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive && colors
                  ? `${colors.bg} ${colors.text} ${colors.border}`
                  : isActive
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-white border-border text-muted-foreground hover:bg-surface',
              )}
              aria-pressed={isActive}
            >
              {tab === 'ALL' ? 'Tous' : ORIENTATION_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
          <Loader2 size={20} className="animate-spin" aria-hidden />
          <span>Chargement des templates...</span>
        </div>
      )}

      {pageError && !loading && (
        <div className="flex items-center gap-3 text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertCircle size={18} aria-hidden />
          <div>
            <p className="text-sm font-medium">{pageError}</p>
            <button
              type="button"
              onClick={() => void fetchTemplates()}
              className="text-xs underline mt-0.5 hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {!loading && !pageError && filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FileText size={40} className="text-muted-foreground/40" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {activeFilter === 'ALL'
              ? 'Aucun template disponible. Créez votre premier template.'
              : `Aucun template pour l'orientation ${ORIENTATION_LABELS[activeFilter]}.`}
          </p>
          {activeFilter === 'ALL' && (
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} aria-hidden />
              Créer un template
            </Button>
          )}
        </div>
      )}

      {!loading && !pageError && filteredTemplates.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onEdit={openEdit}
              onDelete={setDeletingTemplate}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <TemplateModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={editingTemplate ? handleUpdate : handleCreate}
        initial={editingTemplate}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deletingTemplate}
        templateName={deletingTemplate?.name ?? ''}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeletingTemplate(null)}
        deleting={deleting}
      />
    </div>
  );
}

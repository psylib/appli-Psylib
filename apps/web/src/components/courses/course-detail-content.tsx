'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowLeft,
  GraduationCap,
  Plus,
  Video,
  FileText,
  GripVertical,
  Users,
  Euro,
  Globe,
  EyeOff,
  Loader2,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { coursesApi, type CourseModule } from '@/lib/api/courses';

// ---------------------------------------------------------------------------
// Add module inline form
// ---------------------------------------------------------------------------

interface AddModuleFormProps {
  courseId: string;
  token: string;
  onAdded: () => void;
  onCancel: () => void;
}

function AddModuleForm({ courseId, token, onAdded, onCancel }: AddModuleFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'text'>('video');
  const [videoUrl, setVideoUrl] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      coursesApi.addModule(
        courseId,
        {
          title: title.trim(),
          type,
          ...(type === 'video' ? { videoUrl: videoUrl.trim() } : { content: content.trim() }),
        },
        token,
      ),
    onSuccess: () => {
      onAdded();
    },
    onError: (err: Error) => {
      setError(err.message ?? 'Erreur lors de la creation');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Le titre est requis');
      return;
    }
    setError('');
    mutation.mutate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
    >
      <p className="text-sm font-medium text-foreground">Nouveau module</p>

      {/* Type selector */}
      <div className="flex gap-2">
        {(['video', 'text'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              type === t
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-white text-muted-foreground hover:border-primary/40',
            )}
          >
            {t === 'video' ? <Video size={12} /> : <FileText size={12} />}
            {t === 'video' ? 'Video' : 'Texte'}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre du module"
        autoFocus
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        required
      />

      {/* Video URL */}
      {type === 'video' && (
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="URL de la video (ex: https://...)"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
      )}

      {/* Text content */}
      {type === 'text' && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenu textuel du module..."
          rows={3}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
        />
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-white transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Ajout...
            </>
          ) : (
            <>
              <Plus size={12} />
              Ajouter
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sortable module item (edit, delete, drag-drop)
// ---------------------------------------------------------------------------

interface SortableModuleItemProps {
  module: CourseModule;
  index: number;
  courseId: string;
  token: string;
  onUpdated: () => void;
}

function SortableModuleItem({ module, index, courseId, token, onUpdated }: SortableModuleItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(module.title);
  const [editVideoUrl, setEditVideoUrl] = useState(module.videoUrl ?? '');
  const [editContent, setEditContent] = useState(module.content ?? '');
  const [error, setError] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      coursesApi.updateModule(
        courseId,
        module.id,
        {
          title: editTitle.trim(),
          ...(module.type === 'video'
            ? { videoUrl: editVideoUrl.trim() }
            : { content: editContent.trim() }),
        },
        token,
      ),
    onSuccess: () => {
      setIsEditing(false);
      setError('');
      onUpdated();
    },
    onError: (err: Error) => {
      setError(err.message ?? 'Erreur lors de la mise a jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => coursesApi.deleteModule(courseId, module.id, token),
    onSuccess: () => {
      onUpdated();
    },
    onError: (err: Error) => {
      setError(err.message ?? 'Erreur lors de la suppression');
    },
  });

  const handleSave = () => {
    if (!editTitle.trim()) {
      setError('Le titre est requis');
      return;
    }
    setError('');
    updateMutation.mutate();
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      deleteMutation.mutate();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(module.title);
    setEditVideoUrl(module.videoUrl ?? '');
    setEditContent(module.content ?? '');
    setError('');
  };

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Modifier le module {index + 1}
        </p>

        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Titre du module"
          autoFocus
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />

        {module.type === 'video' && (
          <input
            type="url"
            value={editVideoUrl}
            onChange={(e) => setEditVideoUrl(e.target.value)}
            placeholder="URL de la video"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
          />
        )}

        {module.type === 'text' && (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Contenu textuel du module..."
            rows={3}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
          />
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-white transition-colors"
          >
            <X size={12} />
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={12} />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-white p-4 hover:border-primary/20 transition-colors',
        isDragging && 'opacity-50 shadow-lg',
      )}
    >
      {/* Drag handle */}
      <div
        className="flex-shrink-0 text-muted-foreground/40 cursor-grab active:cursor-grabbing touch-none"
        title="Glisser pour reorganiser"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </div>

      {/* Order number */}
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface text-xs font-semibold text-muted-foreground flex items-center justify-center">
        {index + 1}
      </span>

      {/* Type icon */}
      <div className="flex-shrink-0">
        {module.type === 'video' ? (
          <div className="p-1.5 rounded-lg bg-violet-50">
            <Video size={14} className="text-violet-600" />
          </div>
        ) : (
          <div className="p-1.5 rounded-lg bg-blue-50">
            <FileText size={14} className="text-blue-600" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{module.title}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {module.type === 'video' ? 'Video' : 'Texte'}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          title="Modifier"
          aria-label={`Modifier le module ${module.title}`}
        >
          <Pencil size={14} />
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="px-2 py-1 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Confirmer'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:bg-surface transition-colors"
            >
              Annuler
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Supprimer"
            aria-label={`Supprimer le module ${module.title}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-slate-100 rounded-lg" />
        <div className="h-7 bg-slate-100 rounded w-64" />
        <div className="ml-auto flex gap-2">
          <div className="h-9 w-24 bg-slate-100 rounded-lg" />
          <div className="h-9 w-28 bg-slate-100 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CourseDetailContentProps {
  courseId: string;
}

export function CourseDetailContent({ courseId }: CourseDetailContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddModule, setShowAddModule] = useState(false);

  const token = session?.accessToken ?? '';

  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => coursesApi.get(courseId, token),
    enabled: !!token && !!courseId,
  });

  const publishMutation = useMutation({
    mutationFn: () => coursesApi.publish(courseId, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses', courseId] });
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { id: string; order: number }[]) =>
      coursesApi.reorderModules(courseId, order, token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courses', courseId] });
    },
  });

  const handleModuleAdded = () => {
    void queryClient.invalidateQueries({ queryKey: ['courses', courseId] });
    setShowAddModule(false);
  };

  const handleModuleUpdated = () => {
    void queryClient.invalidateQueries({ queryKey: ['courses', courseId] });
  };

  const formatEur = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const sortedModules = course?.modules
    ? [...course.modules].sort((a, b) => a.order - b.order)
    : [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedModules.findIndex((m) => m.id === active.id);
    const newIndex = sortedModules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(sortedModules, oldIndex, newIndex);
    const order = reordered.map((m, i) => ({ id: m.id, order: i }));

    reorderMutation.mutate(order);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {isLoading ? (
        <DetailSkeleton />
      ) : !course ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Formation introuvable.</p>
          <button
            onClick={() => router.push('/dashboard/courses')}
            className="text-sm text-primary hover:underline"
          >
            Retour aux formations
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start gap-4 flex-wrap">
            <button
              onClick={() => router.push('/dashboard/courses')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-1"
              aria-label="Retour aux formations"
            >
              <ArrowLeft size={16} />
              Retour
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap size={18} className="text-primary flex-shrink-0" />
                <h1 className="text-xl font-bold text-foreground truncate">{course.title}</h1>
              </div>
              {course.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
              )}
            </div>

            {/* Publish toggle */}
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0',
                course.isPublished
                  ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                  : 'bg-primary text-white hover:bg-primary/90',
              )}
            >
              {publishMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : course.isPublished ? (
                <>
                  <EyeOff size={14} />
                  Depublier
                </>
              ) : (
                <>
                  <Globe size={14} />
                  Publier
                </>
              )}
            </button>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                course.isPublished
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200',
              )}
            >
              {course.isPublished ? (
                <>
                  <CheckCircle2 size={11} />
                  Publiee
                </>
              ) : (
                <>
                  <Clock size={11} />
                  Brouillon
                </>
              )}
            </span>
          </div>

          {/* Stats section */}
          <section aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Statistiques
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Users size={14} />
                  <span className="text-xs">Inscrits</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{course.enrollmentCount}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Euro size={14} />
                  <span className="text-xs">Prix</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatEur(course.price)}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <GraduationCap size={14} />
                  <span className="text-xs">Modules</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{sortedModules.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                  <Euro size={14} />
                  <span className="text-xs text-muted-foreground">Revenus generes</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatEur(course.revenue)}</p>
              </div>
            </div>
          </section>

          {/* Modules section */}
          <section aria-labelledby="modules-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="modules-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Modules ({sortedModules.length})
              </h2>
              {!showAddModule && (
                <button
                  onClick={() => setShowAddModule(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus size={14} />
                  Ajouter un module
                </button>
              )}
            </div>

            {/* Module list */}
            <div className="space-y-2">
              {sortedModules.length === 0 && !showAddModule ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <FileText size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Aucun module pour l&apos;instant. Ajoutez du contenu a votre formation.
                  </p>
                  <button
                    onClick={() => setShowAddModule(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors mx-auto"
                  >
                    <Plus size={14} />
                    Ajouter un module
                  </button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedModules.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedModules.map((mod: CourseModule, i: number) => (
                      <SortableModuleItem
                        key={mod.id}
                        module={mod}
                        index={i}
                        courseId={courseId}
                        token={token}
                        onUpdated={handleModuleUpdated}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}

              {/* Inline add form */}
              {showAddModule && token && (
                <AddModuleForm
                  courseId={courseId}
                  token={token}
                  onAdded={handleModuleAdded}
                  onCancel={() => setShowAddModule(false)}
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Users,
  Euro,
  Pencil,
  X,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { coursesApi, type Course } from '@/lib/api/courses';

// ---------------------------------------------------------------------------
// Create course dialog (modal without external lib)
// ---------------------------------------------------------------------------

interface CreateDialogProps {
  onClose: () => void;
  onCreated: () => void;
  token: string;
}

function CreateCourseDialog({ onClose, onCreated, token }: CreateDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      coursesApi.create(
        { title: title.trim(), description: description.trim(), price: parseFloat(price) || 0 },
        token,
      ),
    onSuccess: () => {
      onCreated();
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message ?? 'Erreur lors de la création');
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
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface text-muted-foreground transition-colors"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        <h2 id="create-dialog-title" className="text-lg font-semibold text-foreground mb-5">
          Créer une formation
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="course-title" className="block text-sm font-medium text-foreground mb-1.5">
              Titre <span className="text-red-500" aria-hidden>*</span>
            </label>
            <input
              id="course-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Gestion du stress et anxiété"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="course-description" className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              id="course-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le contenu et les objectifs de votre formation..."
              rows={3}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="course-price" className="block text-sm font-medium text-foreground mb-1.5">
              Prix (€)
            </label>
            <div className="relative">
              <Euro
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="course-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-border bg-white pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Créer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Course card
// ---------------------------------------------------------------------------

interface CourseCardProps {
  course: Course;
  onEdit: (id: string) => void;
}

function CourseCard({ course, onEdit }: CourseCardProps) {
  const formatEur = (v: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-white rounded-xl border border-border p-5 hover:border-primary/30 transition-colors flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                course.isPublished
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700',
              )}
            >
              {course.isPublished ? (
                <>
                  <CheckCircle2 size={10} />
                  Publié
                </>
              ) : (
                <>
                  <Clock size={10} />
                  Brouillon
                </>
              )}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{course.title}</h3>
        </div>
        <button
          onClick={() => onEdit(course.id)}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Modifier ${course.title}`}
        >
          <Pencil size={15} />
        </button>
      </div>

      {/* Description */}
      {course.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {course.description}
        </p>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Euro size={12} className="text-primary" />
          <span className="font-medium text-foreground">{formatEur(course.price)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users size={12} />
          <span>{course.enrollmentCount} inscrits</span>
        </div>
        {course.revenue > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <span className="text-emerald-600 font-medium">{formatEur(course.revenue)}</span>
            <span>générés</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <GraduationCap size={28} className="text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">
        Aucune formation pour l&apos;instant
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Créez votre première formation en ligne pour monétiser votre expertise et accompagner vos patients.
      </p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus size={16} />
        Créer une formation
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-100 rounded w-16" />
          <div className="h-4 bg-slate-100 rounded w-48" />
        </div>
        <div className="h-8 w-8 bg-slate-100 rounded-lg flex-shrink-0" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-full mb-1" />
      <div className="h-3 bg-slate-100 rounded w-3/4 mb-4" />
      <div className="flex gap-4 pt-2 border-t border-slate-100">
        <div className="h-3 bg-slate-100 rounded w-12" />
        <div className="h-3 bg-slate-100 rounded w-16" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CoursesContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const token = session?.accessToken ?? '';

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(token),
    enabled: !!token,
  });

  const handleCreated = () => {
    void queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/courses/${id}`);
  };

  return (
    <>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap size={20} className="text-primary" aria-hidden />
              <h1 className="text-2xl font-bold text-foreground">Mes formations</h1>
            </div>
            <p className="text-muted-foreground">
              Créez et gérez vos formations en ligne pour monétiser votre expertise
            </p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Créer une formation
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </div>
        ) : !courses || courses.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateDialog(true)} />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {courses.length} formation{courses.length > 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} onEdit={handleEdit} />
              ))}
            </div>

            {/* Info banner */}
            <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <BookOpen size={18} className="text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Conseil : publiez vos formations pour qu&apos;elles soient accessibles à vos patients.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Les formations en brouillon ne sont visibles que par vous. Cliquez sur une formation pour ajouter des modules et la publier.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create dialog */}
      {showCreateDialog && token && (
        <CreateCourseDialog
          token={token}
          onClose={() => setShowCreateDialog(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}

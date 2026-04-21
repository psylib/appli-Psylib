'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SessionNoteEditor } from './session-note-editor';
import { useSession2 } from '@/hooks/use-dashboard';
import { sessionsApi } from '@/lib/api/sessions';
import { formatDateTime } from '@/lib/utils';

export function SessionDetailContent({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { data: authSession } = useSession();
  const queryClient = useQueryClient();
  const { data: session, isLoading } = useSession2(sessionId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    date: '',
    duration: 0,
    type: 'individual' as string,
    rate: '',
    paymentStatus: 'pending' as string,
  });

  const deleteMutation = useMutation({
    mutationFn: () => sessionsApi.delete(sessionId, authSession?.accessToken ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] });
      router.back();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      sessionsApi.update(sessionId, data as Record<string, unknown>, authSession?.accessToken ?? ''),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
      setEditing(false);
    },
  });

  const startEditing = () => {
    if (!session) return;
    setEditForm({
      date: new Date(session.date).toISOString().slice(0, 16),
      duration: session.duration,
      type: session.type,
      rate: session.rate != null ? String(Number(session.rate)) : '',
      paymentStatus: session.paymentStatus,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate({
      date: editForm.date,
      duration: editForm.duration,
      type: editForm.type,
      rate: editForm.rate ? Number(editForm.rate) : null,
      paymentStatus: editForm.paymentStatus,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Séance introuvable</p>
        <Button variant="link" onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Retour">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Séance du {formatDateTime(session.date)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {session.duration} min • {session.type === 'individual' ? 'Individuel' : session.type === 'online' ? 'En ligne' : 'Groupe'}
              {session.rate ? ` • ${Number(session.rate)}€` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil size={14} />
              Modifier
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Inline edit metadata */}
      {editing && (
        <div className="rounded-xl border border-border bg-white shadow-sm p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Modifier les informations</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date et heure</label>
              <input
                type="datetime-local"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Durée (min)</label>
              <input
                type="number"
                min={5}
                max={480}
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                <option value="individual">Individuel</option>
                <option value="online">En ligne</option>
                <option value="group">Groupe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Tarif (€)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={editForm.rate}
                onChange={(e) => setEditForm({ ...editForm, rate: e.target.value })}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Paiement</label>
              <select
                value={editForm.paymentStatus}
                onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
                <option value="free">Gratuit</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              disabled={updateMutation.isPending}
            >
              <X size={14} />
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={saveEdit}
              loading={updateMutation.isPending}
            >
              <Check size={14} />
              Enregistrer
            </Button>
          </div>
          {updateMutation.isError && (
            <p className="text-sm text-destructive" role="alert">
              Erreur lors de la mise à jour
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      {session.tags && session.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {session.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Éditeur de notes */}
      <div className="rounded-xl border border-border bg-white shadow-sm p-6">
        <SessionNoteEditor
          sessionId={sessionId}
          initialNotes={session.notes}
          existingSummary={session.summaryAi}
          existingAiMetadata={session.aiMetadata as Record<string, unknown> | null}
          existingTags={session.tags}
          onSummarySaved={() => {
            void queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
          }}
        />
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Supprimer cette séance ?"
        description="Cette action est irréversible. Les notes et données associées seront définitivement supprimées."
        confirmLabel="Supprimer"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

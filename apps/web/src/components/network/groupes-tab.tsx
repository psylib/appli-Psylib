'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Loader2,
  Plus,
  Users,
  GraduationCap,
  BookOpen,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog } from '@/components/ui/dialog';
import { GroupCard } from '@/components/network/group-card';
import {
  networkApi,
  type NetworkGroup,
  type GroupType,
  type CreateGroupData,
  GROUP_TYPE_LABELS,
  GROUP_TYPE_COLORS,
} from '@/lib/api/network';

// ─── Group type icon ─────────────────────────────────────────────────────────

function GroupTypeIcon({ type, size = 18 }: { type: GroupType; size?: number }) {
  switch (type) {
    case 'supervision':
      return <GraduationCap size={size} aria-hidden />;
    case 'intervision':
      return <Users size={size} aria-hidden />;
    case 'formation':
      return <BookOpen size={size} aria-hidden />;
    default:
      return <MoreHorizontal size={size} aria-hidden />;
  }
}

// ─── Create Group Modal ──────────────────────────────────────────────────────

const GROUP_TYPES: GroupType[] = ['supervision', 'intervision', 'formation', 'autre'];

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (group: NetworkGroup) => void;
  token: string;
}

function CreateGroupModal({ open, onClose, onCreated, token }: CreateGroupModalProps) {
  const [form, setForm] = useState<CreateGroupData>({
    type: 'supervision',
    name: '',
    description: '',
    city: '',
    isPrivate: false,
    maxMembers: 12,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm({ type: 'supervision', name: '', description: '', city: '', isPrivate: false, maxMembers: 12 });
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Le nom du groupe est requis.');
      return;
    }
    setLoading(true);
    try {
      const created = await networkApi.createGroup(token, {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        city: form.city?.trim() || undefined,
      });
      onCreated(created);
      onClose();
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Créer un groupe">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {/* Type */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Type de groupe</p>
          <div className="grid grid-cols-2 gap-2">
            {GROUP_TYPES.map((type) => {
              const colors = GROUP_TYPE_COLORS[type];
              const isSelected = form.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type }))}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-offset-1 ring-current`
                      : 'bg-white border-border text-foreground hover:bg-surface',
                  )}
                  aria-pressed={isSelected}
                >
                  <GroupTypeIcon type={type} size={16} />
                  {GROUP_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label="Nom du groupe"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Groupe supervision TCC Paris"
          required
          maxLength={100}
        />

        <Textarea
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Décrivez l'objectif et le fonctionnement du groupe..."
          className="min-h-[80px]"
          maxLength={500}
        />

        <Input
          label="Ville"
          value={form.city ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
          placeholder="Ex: Paris"
          maxLength={100}
        />

        <Input
          label="Nombre de membres maximum"
          type="number"
          value={String(form.maxMembers ?? 12)}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, maxMembers: parseInt(e.target.value, 10) || 12 }))
          }
          min={2}
          max={50}
        />

        {/* Private toggle */}
        <label className="flex items-center justify-between gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-surface transition-colors">
          <div>
            <p className="text-sm font-medium text-foreground">Groupe privé</p>
            <p className="text-xs text-muted-foreground">Sur invitation uniquement</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.isPrivate}
            onClick={() => setForm((prev) => ({ ...prev, isPrivate: !prev.isPrivate }))}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              form.isPrivate ? 'bg-primary' : 'bg-gray-200',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                form.isPrivate ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} aria-hidden />
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            <Plus size={14} aria-hidden />
            Créer le groupe
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface GroupesTabProps {
  myGroups: NetworkGroup[];
  publicGroups: NetworkGroup[];
  loading: boolean;
  error: string | null;
  currentUserId?: string;
  token: string;
  onRetry: () => void;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
  onCreated: (group: NetworkGroup) => void;
}

export function GroupesTab({
  myGroups,
  publicGroups,
  loading,
  error,
  currentUserId,
  token,
  onRetry,
  onJoin,
  onLeave,
  onCreated,
}: GroupesTabProps) {
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  const myGroupIds = new Set(myGroups.map((g) => g.id));
  const availablePublicGroups = publicGroups.filter((g) => !myGroupIds.has(g.id));

  return (
    <div className="p-6 space-y-6">
      {loading && (
        <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
          <Loader2 size={20} className="animate-spin" aria-hidden />
          <span className="text-sm">Chargement des groupes...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-3 text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertCircle size={18} aria-hidden />
          <div>
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="text-xs underline mt-0.5 hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Mes groupes</h2>
            <Button size="sm" onClick={() => setCreateGroupOpen(true)} className="gap-1.5">
              <Plus size={14} aria-hidden />
              Créer un groupe
            </Button>
          </div>

          {myGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Vous n&apos;êtes membre d&apos;aucun groupe pour l&apos;instant.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isMember
                  onLeave={
                    group.owner.id !== currentUserId
                      ? () => void onLeave(group.id)
                      : undefined
                  }
                />
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-semibold text-foreground">
              Rejoindre un groupe
              {availablePublicGroups.length > 0 && (
                <span className="ml-2 text-muted-foreground font-normal">
                  ({availablePublicGroups.length})
                </span>
              )}
            </h2>

            {availablePublicGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Users size={32} className="text-muted-foreground/40" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Aucun groupe public disponible pour l&apos;instant.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateGroupOpen(true)}
                >
                  Créer le premier groupe
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePublicGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isMember={false}
                    onJoin={() => void onJoin(group.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        token={token}
        onCreated={(group) => {
          onCreated(group);
          setCreateGroupOpen(false);
        }}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search,
  Network,
  Plus,
  AlertCircle,
  Loader2,
  Users,
  Send,
  UserCircle,
  Check,
  X,
  GraduationCap,
  BookOpen,
  MoreHorizontal,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  MapPin,
  Tag,
  Link as LinkIcon,
} from 'lucide-react';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PsyCard } from '@/components/network/psy-card';
import { ReferralModal } from '@/components/network/referral-modal';
import { GroupCard } from '@/components/network/group-card';
import {
  networkApi,
  type NetworkProfile,
  type DirectoryEntry,
  type Referral,
  type NetworkGroup,
  type GroupType,
  type CreateGroupData,
  type UpdateNetworkProfileData,
  REFERRAL_STATUS_LABELS,
  REFERRAL_STATUS_COLORS,
  GROUP_TYPE_LABELS,
  GROUP_TYPE_COLORS,
} from '@/lib/api/network';

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabId = 'annuaire' | 'adressages' | 'groupes';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'annuaire', label: 'Annuaire', icon: Search },
  { id: 'adressages', label: 'Adressages', icon: Send },
  { id: 'groupes', label: 'Groupes', icon: Users },
];

// ─── Directory skeleton ───────────────────────────────────────────────────────

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Referral item ────────────────────────────────────────────────────────────

interface ReferralItemProps {
  referral: Referral;
  direction: 'sent' | 'received';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  loadingId: string | null;
}

function ReferralItem({ referral, direction, onAccept, onDecline, loadingId }: ReferralItemProps) {
  const colors = REFERRAL_STATUS_COLORS[referral.status];
  const label = REFERRAL_STATUS_LABELS[referral.status];
  const psy = direction === 'sent' ? referral.toPsy : referral.fromPsy;
  const isLoading = loadingId === referral.id;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white hover:bg-surface/50 transition-colors">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-primary">
        {psy ? getInitials(psy.name) : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{psy?.name ?? 'Inconnu'}</p>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
              colors.bg,
              colors.text,
              colors.border,
            )}
          >
            {label}
          </span>
        </div>
        {referral.patientInitials && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Patient : {referral.patientInitials}
          </p>
        )}
        {referral.reason && (
          <p className="text-xs text-muted-foreground line-clamp-1">{referral.reason}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(referral.createdAt)}
        </p>
      </div>

      {direction === 'received' && referral.status === 'pending' && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onAccept?.(referral.id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
            aria-label="Accepter"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDecline?.(referral.id)}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
            aria-label="Décliner"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Group type icon ──────────────────────────────────────────────────────────

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

// ─── Create Group Modal ───────────────────────────────────────────────────────

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (group: NetworkGroup) => void;
  token: string;
}

const GROUP_TYPES: GroupType[] = ['supervision', 'intervision', 'formation', 'autre'];

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

        {/* Nom */}
        <Input
          label="Nom du groupe"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Groupe supervision TCC Paris"
          required
          maxLength={100}
        />

        {/* Description */}
        <Textarea
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Décrivez l'objectif et le fonctionnement du groupe..."
          className="min-h-[80px]"
          maxLength={500}
        />

        {/* Ville */}
        <Input
          label="Ville"
          value={form.city ?? ''}
          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
          placeholder="Ex: Paris"
          maxLength={100}
        />

        {/* Membres max */}
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

        {/* Privé */}
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

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertCircle size={14} aria-hidden />
            {error}
          </div>
        )}

        {/* Actions */}
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

// ─── Profile Panel ────────────────────────────────────────────────────────────

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  profile: NetworkProfile | null;
  onSaved: (profile: NetworkProfile) => void;
  token: string;
}

const COMMON_APPROACHES = ['TCC', 'ACT', 'Psychodynamique', 'Systémique', 'EMDR', 'Humaniste', 'Intégrative'];
const COMMON_SPECIALTIES = [
  'Anxiété', 'Dépression', 'Trauma', 'Enfant', 'Adolescent', 'Couple', 'Famille', 'Addiction', 'Phobies', 'TOC',
];

function ProfilePanel({ open, onClose, profile, onSaved, token }: ProfilePanelProps) {
  const [form, setForm] = useState<UpdateNetworkProfileData>({});
  const [approachInput, setApproachInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && profile) {
      setForm({
        isVisible: profile.isVisible,
        city: profile.city ?? '',
        department: profile.department ?? '',
        approaches: [...profile.approaches],
        specialties: [...profile.specialties],
        bio: profile.bio ?? '',
        websiteUrl: profile.websiteUrl ?? '',
        acceptsReferrals: profile.acceptsReferrals,
      });
    } else if (open && !profile) {
      setForm({
        isVisible: false,
        city: '',
        department: '',
        approaches: [],
        specialties: [],
        bio: '',
        websiteUrl: '',
        acceptsReferrals: false,
      });
    }
    setError(null);
  }, [open, profile]);

  const approaches = (form.approaches ?? []) as string[];
  const specialties = (form.specialties ?? []) as string[];

  const toggleApproach = (value: string) => {
    const current = approaches;
    setForm((prev) => ({
      ...prev,
      approaches: current.includes(value)
        ? current.filter((a) => a !== value)
        : [...current, value],
    }));
  };

  const addApproach = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !approaches.includes(trimmed)) {
      setForm((prev) => ({ ...prev, approaches: [...approaches, trimmed] }));
    }
    setApproachInput('');
  };

  const removeApproach = (value: string) => {
    setForm((prev) => ({ ...prev, approaches: approaches.filter((a) => a !== value) }));
  };

  const toggleSpecialty = (value: string) => {
    const current = specialties;
    setForm((prev) => ({
      ...prev,
      specialties: current.includes(value)
        ? current.filter((s) => s !== value)
        : [...current, value],
    }));
  };

  const addSpecialty = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !specialties.includes(trimmed)) {
      setForm((prev) => ({ ...prev, specialties: [...specialties, trimmed] }));
    }
    setSpecialtyInput('');
  };

  const removeSpecialty = (value: string) => {
    setForm((prev) => ({ ...prev, specialties: specialties.filter((s) => s !== value) }));
  };

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const saved = await networkApi.upsertProfile(token, form);
      onSaved(saved);
      onClose();
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Profil réseau">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Mon profil réseau</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Visible dans l&apos;annuaire des psys</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-5 overflow-y-auto">
          {/* Visible toggle */}
          <label className="flex items-center justify-between gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-surface transition-colors">
            <div className="flex items-center gap-2">
              {form.isVisible ? (
                <Eye size={16} className="text-primary" aria-hidden />
              ) : (
                <EyeOff size={16} className="text-muted-foreground" aria-hidden />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">Visible dans l&apos;annuaire</p>
                <p className="text-xs text-muted-foreground">
                  {form.isVisible ? 'Votre profil est public' : 'Votre profil est masqué'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!form.isVisible}
              onClick={() => setForm((prev) => ({ ...prev, isVisible: !prev.isVisible }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                form.isVisible ? 'bg-primary' : 'bg-gray-200',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                  form.isVisible ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </label>

          {/* City + Department */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ville"
              value={(form.city as string) ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="Paris"
            />
            <Input
              label="Département"
              value={(form.department as string) ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              placeholder="75"
            />
          </div>

          {/* Approaches */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Tag size={14} className="text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium text-foreground">Orientations thérapeutiques</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_APPROACHES.map((approach) => (
                <button
                  key={approach}
                  type="button"
                  onClick={() => toggleApproach(approach)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                    approaches.includes(approach)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-white border-border text-muted-foreground hover:bg-surface',
                  )}
                >
                  {approach}
                </button>
              ))}
            </div>
            {/* Custom approach input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={approachInput}
                onChange={(e) => setApproachInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addApproach(approachInput);
                  }
                }}
                placeholder="Autre approche..."
                className="flex-1 h-9 rounded-lg border border-input bg-white px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addApproach(approachInput)}
                className="h-9 px-3"
              >
                <Plus size={14} />
              </Button>
            </div>
            {/* Selected custom approaches not in the common list */}
            {approaches.filter((a) => !COMMON_APPROACHES.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {approaches
                  .filter((a) => !COMMON_APPROACHES.includes(a))
                  .map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/30"
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => removeApproach(a)}
                        className="ml-0.5 hover:text-destructive"
                        aria-label={`Retirer ${a}`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Tag size={14} className="text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium text-foreground">Spécialités</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_SPECIALTIES.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => toggleSpecialty(specialty)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                    specialties.includes(specialty)
                      ? 'bg-accent/10 text-accent border-accent/30'
                      : 'bg-white border-border text-muted-foreground hover:bg-surface',
                  )}
                >
                  {specialty}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSpecialty(specialtyInput);
                  }
                }}
                placeholder="Autre spécialité..."
                className="flex-1 h-9 rounded-lg border border-input bg-white px-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addSpecialty(specialtyInput)}
                className="h-9 px-3"
              >
                <Plus size={14} />
              </Button>
            </div>
            {specialties.filter((s) => !COMMON_SPECIALTIES.includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {specialties
                  .filter((s) => !COMMON_SPECIALTIES.includes(s))
                  .map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent border border-accent/30"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSpecialty(s)}
                        className="ml-0.5 hover:text-destructive"
                        aria-label={`Retirer ${s}`}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Présentation courte</label>
            <Textarea
              value={(form.bio as string) ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Quelques mots sur votre approche et vos patients..."
              className="min-h-[80px]"
              maxLength={500}
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <LinkIcon size={14} className="text-muted-foreground" aria-hidden />
              <label className="text-sm font-medium text-foreground">Site web</label>
            </div>
            <Input
              value={(form.websiteUrl as string) ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, websiteUrl: e.target.value }))}
              placeholder="https://mon-cabinet.fr"
              type="url"
            />
          </div>

          {/* Accepts referrals */}
          <label className="flex items-center justify-between gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-surface transition-colors">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Accepte les adressages</p>
                <p className="text-xs text-muted-foreground">Vos confrères pourront vous adresser des patients</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!form.acceptsReferrals}
              onClick={() => setForm((prev) => ({ ...prev, acceptsReferrals: !prev.acceptsReferrals }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                form.acceptsReferrals ? 'bg-primary' : 'bg-gray-200',
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                  form.acceptsReferrals ? 'translate-x-6' : 'translate-x-1',
                )}
              />
            </button>
          </label>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} aria-hidden />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button loading={loading} onClick={() => void handleSave()}>
            Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [activeTab, setActiveTab] = useState<TabId>('annuaire');

  // ── Profile ──
  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  // ── Directory ──
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterApproach, setFilterApproach] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Referral modal ──
  const [referralTarget, setReferralTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Referrals ──
  const [sentReferrals, setSentReferrals] = useState<Referral[]>([]);
  const [receivedReferrals, setReceivedReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError] = useState<string | null>(null);
  const [loadingReferralId, setLoadingReferralId] = useState<string | null>(null);

  // ── Groups ──
  const [myGroups, setMyGroups] = useState<NetworkGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<NetworkGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  // ─── Fetch directory ────────────────────────────────────────────────────────

  const fetchDirectory = useCallback(async () => {
    if (!token) return;
    setDirectoryLoading(true);
    setDirectoryError(null);
    try {
      const data = await networkApi.getDirectory(token, {
        search: search || undefined,
        city: filterCity || undefined,
        department: filterDepartment || undefined,
        approach: filterApproach || undefined,
        specialty: filterSpecialty || undefined,
      });
      setDirectory(data);
    } catch {
      setDirectoryError("Impossible de charger l'annuaire. Vérifiez votre connexion.");
    } finally {
      setDirectoryLoading(false);
    }
  }, [token, search, filterCity, filterDepartment, filterApproach, filterSpecialty]);

  // ─── Fetch referrals ────────────────────────────────────────────────────────

  const fetchReferrals = useCallback(async () => {
    if (!token) return;
    setReferralsLoading(true);
    setReferralsError(null);
    try {
      const data = await networkApi.getReferrals(token);
      setSentReferrals(data.sent);
      setReceivedReferrals(data.received);
    } catch {
      setReferralsError('Impossible de charger les adressages.');
    } finally {
      setReferralsLoading(false);
    }
  }, [token]);

  // ─── Fetch groups ───────────────────────────────────────────────────────────

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const data = await networkApi.getGroups(token);
      setMyGroups(data.myGroups);
      setPublicGroups(data.publicGroups);
    } catch {
      setGroupsError('Impossible de charger les groupes.');
    } finally {
      setGroupsLoading(false);
    }
  }, [token]);

  // ─── Fetch profile ──────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await networkApi.getProfile(token);
      setProfile(data);
    } catch {
      // Profile may not exist yet — that's fine
    }
  }, [token]);

  // ─── Initial loads ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (token) void fetchProfile();
  }, [fetchProfile, token]);

  useEffect(() => {
    if (activeTab === 'annuaire' && token) void fetchDirectory();
  }, [activeTab, fetchDirectory, token]);

  useEffect(() => {
    if (activeTab === 'adressages' && token) void fetchReferrals();
  }, [activeTab, fetchReferrals, token]);

  useEffect(() => {
    if (activeTab === 'groupes' && token) void fetchGroups();
  }, [activeTab, fetchGroups, token]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleReferralStatusUpdate = async (id: string, status: 'accepted' | 'declined') => {
    setLoadingReferralId(id);
    try {
      const updated = await networkApi.updateReferralStatus(token, id, status);
      setReceivedReferrals((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      // Silent fail — keep current state
    } finally {
      setLoadingReferralId(null);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await networkApi.joinGroup(token, groupId);
      await fetchGroups();
    } catch {
      // Silent fail
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await networkApi.leaveGroup(token, groupId);
      await fetchGroups();
    } catch {
      // Silent fail
    }
  };

  const myGroupIds = new Set(myGroups.map((g) => g.id));
  // Public groups that I haven't joined yet
  const availablePublicGroups = publicGroups.filter((g) => !myGroupIds.has(g.id));

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 border-b border-border bg-white flex items-center justify-between gap-4 flex-wrap flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Network size={22} className="text-primary" aria-hidden />
            <h1 className="text-xl font-bold text-foreground">Réseau Professionnel</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Annuaire des psys, adressages et groupes de pairs
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setProfilePanelOpen(true)}
          className="gap-2"
        >
          <UserCircle size={16} aria-hidden />
          Mon profil réseau
        </Button>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border bg-white flex-shrink-0">
        <nav className="flex gap-0" aria-label="Onglets réseau">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon size={16} aria-hidden />
              {label}
              {id === 'adressages' && (
                receivedReferrals.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="ml-1 h-4 min-w-[16px] rounded-full bg-primary text-white text-xs flex items-center justify-center px-1">
                    {receivedReferrals.filter((r) => r.status === 'pending').length}
                  </span>
                )
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {/* ─── Annuaire ──────────────────────────────────────────────────────── */}
        {activeTab === 'annuaire' && (
          <div className="p-6 space-y-5">
            {/* Search + filters */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    aria-hidden
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void fetchDirectory()}
                    placeholder="Rechercher un psy par nom..."
                    className="w-full h-11 pl-9 pr-4 rounded-lg border border-input bg-white text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2 flex-shrink-0"
                >
                  <ChevronDown
                    size={14}
                    aria-hidden
                    className={cn('transition-transform', showFilters && 'rotate-180')}
                  />
                  Filtres
                </Button>
                <Button onClick={() => void fetchDirectory()} className="flex-shrink-0">
                  Rechercher
                </Button>
              </div>

              {showFilters && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg border border-border bg-surface/50">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin size={11} aria-hidden /> Ville
                    </label>
                    <input
                      type="text"
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      placeholder="Paris..."
                      className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Département</label>
                    <input
                      type="text"
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      placeholder="75..."
                      className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Approche</label>
                    <input
                      type="text"
                      value={filterApproach}
                      onChange={(e) => setFilterApproach(e.target.value)}
                      placeholder="TCC..."
                      className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Spécialité</label>
                    <input
                      type="text"
                      value={filterSpecialty}
                      onChange={(e) => setFilterSpecialty(e.target.value)}
                      placeholder="Anxiété..."
                      className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {directoryLoading && <DirectorySkeleton />}

            {directoryError && !directoryLoading && (
              <div className="flex items-center gap-3 text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle size={18} aria-hidden />
                <div>
                  <p className="text-sm font-medium">{directoryError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchDirectory()}
                    className="text-xs underline mt-0.5 hover:no-underline"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )}

            {!directoryLoading && !directoryError && directory.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Users size={40} className="text-muted-foreground/40" aria-hidden />
                <p className="text-sm text-muted-foreground font-medium">Aucun psy trouvé</p>
                <p className="text-xs text-muted-foreground">
                  Essayez d&apos;élargir vos critères de recherche ou effacez les filtres.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setFilterCity('');
                    setFilterDepartment('');
                    setFilterApproach('');
                    setFilterSpecialty('');
                    void fetchDirectory();
                  }}
                >
                  Effacer les filtres
                </Button>
              </div>
            )}

            {!directoryLoading && !directoryError && directory.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {directory.map((entry) => (
                  <PsyCard
                    key={entry.id}
                    entry={entry}
                    onReferral={(psyId, psyName) => setReferralTarget({ id: psyId, name: psyName })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Adressages ────────────────────────────────────────────────────── */}
        {activeTab === 'adressages' && (
          <div className="p-6 space-y-6">
            {referralsLoading && (
              <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
                <Loader2 size={20} className="animate-spin" aria-hidden />
                <span className="text-sm">Chargement des adressages...</span>
              </div>
            )}

            {referralsError && !referralsLoading && (
              <div className="flex items-center gap-3 text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle size={18} aria-hidden />
                <div>
                  <p className="text-sm font-medium">{referralsError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchReferrals()}
                    className="text-xs underline mt-0.5 hover:no-underline"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )}

            {!referralsLoading && !referralsError && (
              <>
                {/* Received */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-foreground">
                      Adressages reçus
                      {receivedReferrals.length > 0 && (
                        <span className="ml-2 text-muted-foreground font-normal">
                          ({receivedReferrals.length})
                        </span>
                      )}
                    </h2>
                    {receivedReferrals.filter((r) => r.status === 'pending').length > 0 && (
                      <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {receivedReferrals.filter((r) => r.status === 'pending').length} en attente
                      </span>
                    )}
                  </div>
                  {receivedReferrals.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Aucun adressage reçu pour l&apos;instant.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {receivedReferrals.map((referral) => (
                        <ReferralItem
                          key={referral.id}
                          referral={referral}
                          direction="received"
                          onAccept={(id) => void handleReferralStatusUpdate(id, 'accepted')}
                          onDecline={(id) => void handleReferralStatusUpdate(id, 'declined')}
                          loadingId={loadingReferralId}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent */}
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-foreground">
                    Adressages envoyés
                    {sentReferrals.length > 0 && (
                      <span className="ml-2 text-muted-foreground font-normal">
                        ({sentReferrals.length})
                      </span>
                    )}
                  </h2>
                  {sentReferrals.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <Send size={32} className="text-muted-foreground/40" aria-hidden />
                      <p className="text-sm text-muted-foreground">
                        Vous n&apos;avez pas encore envoyé d&apos;adressage.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('annuaire')}
                      >
                        Parcourir l&apos;annuaire
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sentReferrals.map((referral) => (
                        <ReferralItem
                          key={referral.id}
                          referral={referral}
                          direction="sent"
                          loadingId={loadingReferralId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── Groupes ───────────────────────────────────────────────────────── */}
        {activeTab === 'groupes' && (
          <div className="p-6 space-y-6">
            {groupsLoading && (
              <div className="flex items-center gap-3 text-muted-foreground py-12 justify-center">
                <Loader2 size={20} className="animate-spin" aria-hidden />
                <span className="text-sm">Chargement des groupes...</span>
              </div>
            )}

            {groupsError && !groupsLoading && (
              <div className="flex items-center gap-3 text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
                <AlertCircle size={18} aria-hidden />
                <div>
                  <p className="text-sm font-medium">{groupsError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchGroups()}
                    className="text-xs underline mt-0.5 hover:no-underline"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )}

            {!groupsLoading && !groupsError && (
              <>
                {/* Header with create button */}
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Mes groupes</h2>
                  <Button size="sm" onClick={() => setCreateGroupOpen(true)} className="gap-1.5">
                    <Plus size={14} aria-hidden />
                    Créer un groupe
                  </Button>
                </div>

                {/* My groups */}
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
                          group.owner.id !== session?.user?.id
                            ? () => void handleLeaveGroup(group.id)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Available public groups */}
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
                          onJoin={() => void handleJoinGroup(group.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────────── */}

      {referralTarget && (
        <ReferralModal
          psyId={referralTarget.id}
          psyName={referralTarget.name}
          token={token}
          onClose={() => setReferralTarget(null)}
          onSuccess={() => {
            setReferralTarget(null);
            if (activeTab === 'adressages') void fetchReferrals();
          }}
        />
      )}

      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        token={token}
        onCreated={(group) => {
          setMyGroups((prev) => [group, ...prev]);
          setCreateGroupOpen(false);
        }}
      />

      <ProfilePanel
        open={profilePanelOpen}
        onClose={() => setProfilePanelOpen(false)}
        profile={profile}
        token={token}
        onSaved={(saved) => {
          setProfile(saved);
          setProfilePanelOpen(false);
        }}
      />
    </div>
  );
}

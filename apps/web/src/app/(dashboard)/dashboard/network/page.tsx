'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search,
  Network,
  Send,
  Users,
  UserCircle,
  X,
  Eye,
  EyeOff,
  Globe,
  MapPin,
  Tag,
  Plus,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ReferralModal } from '@/components/network/referral-modal';
import { AnnuaireTab } from '@/components/network/annuaire-tab';
import { AdressagesTab } from '@/components/network/adressages-tab';
import { GroupesTab } from '@/components/network/groupes-tab';
import { useNetworkData } from '@/hooks/use-network-data';
import {
  networkApi,
  type NetworkProfile,
  type UpdateNetworkProfileData,
} from '@/lib/api/network';

// ─── Tab type ────────────────────────────────────────────────────────────────

type TabId = 'annuaire' | 'adressages' | 'groupes';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'annuaire', label: 'Annuaire', icon: Search },
  { id: 'adressages', label: 'Adressages', icon: Send },
  { id: 'groupes', label: 'Groupes', icon: Users },
];

// ─── Profile Panel ───────────────────────────────────────────────────────────

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
    setForm((prev) => ({
      ...prev,
      approaches: approaches.includes(value)
        ? approaches.filter((a) => a !== value)
        : [...approaches, value],
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
    setForm((prev) => ({
      ...prev,
      specialties: specialties.includes(value)
        ? specialties.filter((s) => s !== value)
        : [...specialties, value],
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NetworkPage() {
  const { data: session } = useSession();
  const token = session?.accessToken ?? '';

  const [activeTab, setActiveTab] = useState<TabId>('annuaire');
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [referralTarget, setReferralTarget] = useState<{ id: string; name: string } | null>(null);

  const {
    profile, setProfile,
    directory, directoryLoading, directoryError, fetchDirectory,
    sentReferrals, receivedReferrals, referralsLoading, referralsError,
    loadingReferralId, fetchReferrals, handleReferralStatusUpdate,
    myGroups, setMyGroups, publicGroups, groupsLoading, groupsError,
    fetchGroups, handleJoinGroup, handleLeaveGroup,
  } = useNetworkData(token);

  // ── Tab-based lazy loading ──
  useEffect(() => {
    if (activeTab === 'annuaire' && token) {
      void fetchDirectory({ search: '', city: '', department: '', approach: '', specialty: '' });
    }
  }, [activeTab, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'adressages' && token) void fetchReferrals();
  }, [activeTab, fetchReferrals, token]);

  useEffect(() => {
    if (activeTab === 'groupes' && token) void fetchGroups();
  }, [activeTab, fetchGroups, token]);

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
        {activeTab === 'annuaire' && (
          <AnnuaireTab
            directory={directory}
            loading={directoryLoading}
            error={directoryError}
            onSearch={(filters) => void fetchDirectory(filters)}
            onReferral={(psyId, psyName) => setReferralTarget({ id: psyId, name: psyName })}
          />
        )}

        {activeTab === 'adressages' && (
          <AdressagesTab
            sentReferrals={sentReferrals}
            receivedReferrals={receivedReferrals}
            loading={referralsLoading}
            error={referralsError}
            loadingReferralId={loadingReferralId}
            onAccept={(id) => void handleReferralStatusUpdate(id, 'accepted')}
            onDecline={(id) => void handleReferralStatusUpdate(id, 'declined')}
            onRetry={() => void fetchReferrals()}
            onGoToAnnuaire={() => setActiveTab('annuaire')}
          />
        )}

        {activeTab === 'groupes' && (
          <GroupesTab
            myGroups={myGroups}
            publicGroups={publicGroups}
            loading={groupsLoading}
            error={groupsError}
            currentUserId={session?.user?.id}
            token={token}
            onRetry={() => void fetchGroups()}
            onJoin={(id) => void handleJoinGroup(id)}
            onLeave={(id) => void handleLeaveGroup(id)}
            onCreated={(group) => setMyGroups((prev) => [group, ...prev])}
          />
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

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

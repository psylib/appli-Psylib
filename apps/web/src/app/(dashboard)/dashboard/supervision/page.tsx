'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Users, Plus, Loader2, AlertCircle, Calendar, BookOpen,
  Lock, Unlock, ChevronRight, Video, MapPin, Clock,
  FileText, UserCircle, ChevronDown, ChevronUp, X,
} from 'lucide-react';
import { FeatureLock } from '@/components/shared/feature-lock';
import { cn, formatDate, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  supervisionApi,
  type SupervisionGroup, type SupervisionSession, type CaseStudy,
  type GroupType, type SessionStatus,
  GROUP_TYPE_LABELS, GROUP_TYPE_COLORS,
  SESSION_STATUS_LABELS, SESSION_STATUS_COLORS,
} from '@/lib/api/supervision';

// ─── Types locaux ─────────────────────────────────────────────────────────────

type View = 'groups' | 'sessions' | 'cases';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-14 w-14 rounded-full bg-surface flex items-center justify-center mb-4">
        <Icon size={24} className="text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-border p-5 animate-pulse space-y-3">
      <div className="flex justify-between">
        <div className="h-4 bg-surface rounded w-40" />
        <div className="h-5 w-20 bg-surface rounded-full" />
      </div>
      <div className="h-3 bg-surface rounded w-64" />
      <div className="flex gap-4">
        <div className="h-3 bg-surface rounded w-20" />
        <div className="h-3 bg-surface rounded w-20" />
      </div>
    </div>
  );
}

// ─── Modal: Créer groupe ──────────────────────────────────────────────────────

function CreateGroupModal({ token, onCreated, onClose }: {
  token: string;
  onCreated: (g: SupervisionGroup) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ type: 'supervision' as GroupType, name: '', description: '', isPrivate: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const group = await supervisionApi.createGroup(token, {
        type: form.type,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isPrivate: form.isPrivate,
      });
      onCreated(group);
    } catch {
      setError('Erreur lors de la création du groupe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-base font-semibold">Créer un groupe</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Type</label>
            <div className="flex gap-2">
              {(['supervision', 'intervision'] as GroupType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-all',
                    form.type === t
                      ? GROUP_TYPE_COLORS[t] + ' border-current ring-2 ring-offset-1 ring-current/30'
                      : 'border-border text-muted-foreground hover:border-foreground/30',
                  )}
                >
                  {GROUP_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="group-name" className="text-sm font-medium text-foreground block mb-1.5">Nom du groupe</label>
            <Input
              id="group-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Groupe TCC Paris Nord"
              maxLength={100}
              required
            />
          </div>
          <div>
            <label htmlFor="group-desc" className="text-sm font-medium text-foreground block mb-1.5">Description <span className="font-normal text-muted-foreground">(optionnel)</span></label>
            <Textarea
              id="group-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Orientation, fréquence des réunions, thématiques..."
              rows={3}
              maxLength={500}
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary"
            />
            <span className="text-sm text-foreground">Groupe privé (sur invitation)</span>
          </label>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={loading || !form.name.trim()}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
              Créer le groupe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Créer session ─────────────────────────────────────────────────────

function CreateSessionModal({ token, groupId, onCreated, onClose }: {
  token: string;
  groupId: string;
  onCreated: (s: SupervisionSession) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ scheduledAt: '', duration: 90, location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scheduledAt) return;
    setLoading(true);
    setError(null);
    try {
      const session = await supervisionApi.createSession(token, groupId, {
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        duration: form.duration,
        location: form.location.trim() || undefined,
      });
      onCreated(session);
    } catch {
      setError('Erreur lors de la création de la session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-base font-semibold">Planifier une session</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="session-date" className="text-sm font-medium block mb-1.5">Date et heure</label>
            <input
              id="session-date"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <div>
            <label htmlFor="session-duration" className="text-sm font-medium block mb-1.5">Durée (minutes)</label>
            <select
              id="session-duration"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            >
              {[60, 90, 120, 150, 180].map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="session-location" className="text-sm font-medium block mb-1.5">Lieu / lien visio <span className="font-normal text-muted-foreground">(optionnel)</span></label>
            <Input
              id="session-location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="https://meet.google.com/... ou 12 rue des Lilas, Paris"
              maxLength={500}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={loading || !form.scheduledAt}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
              Planifier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Cas clinique ──────────────────────────────────────────────────────

function CreateCaseModal({ token, sessionId, onCreated, onClose }: {
  token: string;
  sessionId: string;
  onCreated: (c: CaseStudy) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ initials: '', ageRange: '', problematic: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.problematic.trim() || !form.content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const cs = await supervisionApi.createCaseStudy(token, {
        sessionId,
        initials: form.initials.trim() || undefined,
        ageRange: form.ageRange.trim() || undefined,
        problematic: form.problematic.trim(),
        content: form.content.trim(),
      });
      onCreated(cs);
    } catch {
      setError('Erreur lors de la soumission du cas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-base font-semibold">Soumettre un cas clinique</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Données anonymisées uniquement — chiffré AES-256</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">Initiales <span className="font-normal text-muted-foreground">(opt.)</span></label>
              <Input
                value={form.initials}
                onChange={(e) => setForm((f) => ({ ...f, initials: e.target.value }))}
                placeholder="P.M."
                maxLength={10}
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Tranche d&apos;âge <span className="font-normal text-muted-foreground">(opt.)</span></label>
              <Input
                value={form.ageRange}
                onChange={(e) => setForm((f) => ({ ...f, ageRange: e.target.value }))}
                placeholder="30-40 ans"
                maxLength={20}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Problématique présentée</label>
            <Input
              value={form.problematic}
              onChange={(e) => setForm((f) => ({ ...f, problematic: e.target.value }))}
              placeholder="Anxiété généralisée, difficultés relationnelles..."
              maxLength={200}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Description du cas</label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Présentez le contexte, l'anamnèse, les hypothèses thérapeutiques..."
              rows={6}
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={loading || !form.problematic.trim() || !form.content.trim()}>
              {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : null}
              Soumettre le cas
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

function SupervisionContent() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken ?? '';

  const [groups, setGroups] = useState<SupervisionGroup[]>([]);
  const [sessions, setSessions] = useState<SupervisionSession[]>([]);
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SupervisionGroup | null>(null);
  const [selectedSession, setSelectedSession] = useState<SupervisionSession | null>(null);

  const [view, setView] = useState<View>('groups');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await supervisionApi.getGroups(token);
      setGroups(data);
    } catch {
      setError('Impossible de charger les groupes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadSessions = useCallback(async (groupId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await supervisionApi.getSessions(token, groupId);
      setSessions(data);
    } catch {
      setError('Impossible de charger les sessions.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadCases = useCallback(async (sessionId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await supervisionApi.getCaseStudies(token, sessionId);
      setCases(data);
    } catch {
      setError('Impossible de charger les cas cliniques.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadGroups(); }, [loadGroups]);

  const openGroup = (group: SupervisionGroup) => {
    setSelectedGroup(group);
    setView('sessions');
    void loadSessions(group.id);
  };

  const openSession = (s: SupervisionSession) => {
    setSelectedSession(s);
    setView('cases');
    void loadCases(s.id);
  };

  const goBack = () => {
    if (view === 'cases') {
      setView('sessions');
      setSelectedSession(null);
    } else {
      setView('groups');
      setSelectedGroup(null);
    }
  };

  // ── Breadcrumb ──────────────────────────────────────────────────────────────

  const breadcrumb = (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
      <button onClick={() => { setView('groups'); setSelectedGroup(null); setSelectedSession(null); }} className="hover:text-foreground transition-colors">
        Supervision
      </button>
      {selectedGroup && (
        <>
          <ChevronRight size={14} />
          <button onClick={() => { setView('sessions'); setSelectedSession(null); }} className="hover:text-foreground transition-colors">
            {selectedGroup.name}
          </button>
        </>
      )}
      {selectedSession && (
        <>
          <ChevronRight size={14} />
          <span className="text-foreground font-medium">
            {new Date(selectedSession.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        </>
      )}
    </div>
  );

  // ── Vue: Groupes ────────────────────────────────────────────────────────────

  if (view === 'groups') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Supervision & Intervision</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Groupes de soutien professionnel entre pairs</p>
          </div>
          <Button onClick={() => setShowCreateGroup(true)}>
            <Plus size={15} className="mr-1.5" /> Créer un groupe
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={15} /> {error}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun groupe"
            description="Créez votre premier groupe de supervision ou d'intervision pour échanger avec vos pairs."
            action={
              <Button onClick={() => setShowCreateGroup(true)}>
                <Plus size={15} className="mr-1.5" /> Créer un groupe
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => openGroup(g)}
                className="text-left bg-white rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border', GROUP_TYPE_COLORS[g.type])}>
                        {GROUP_TYPE_LABELS[g.type]}
                      </span>
                      {g.isPrivate ? (
                        <Lock size={12} className="text-muted-foreground" aria-label="Groupe privé" />
                      ) : (
                        <Unlock size={12} className="text-muted-foreground" aria-label="Groupe public" />
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{g.name}</h3>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
                {g.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{g.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {g._count.members} membre{g._count.members !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {g._count.sessions} session{g._count.sessions !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Animé par {g.owner.name}
                </p>
              </button>
            ))}
          </div>
        )}

        {showCreateGroup && (
          <CreateGroupModal
            token={token}
            onCreated={(g) => { setGroups((prev) => [g, ...prev]); setShowCreateGroup(false); }}
            onClose={() => setShowCreateGroup(false)}
          />
        )}
      </div>
    );
  }

  // ── Vue: Sessions ───────────────────────────────────────────────────────────

  if (view === 'sessions' && selectedGroup) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {breadcrumb}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">{selectedGroup.name}</h2>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border mt-1', GROUP_TYPE_COLORS[selectedGroup.type])}>
              {GROUP_TYPE_LABELS[selectedGroup.type]}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>Retour</Button>
            <Button onClick={() => setShowCreateSession(true)}>
              <Plus size={15} className="mr-1.5" /> Planifier
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <CardSkeleton key={i} />)}</div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Aucune session planifiée"
            description="Planifiez votre première réunion de groupe."
            action={<Button onClick={() => setShowCreateSession(true)}><Plus size={15} className="mr-1.5" /> Planifier une session</Button>}
          />
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s)}
                className="w-full text-left bg-white rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border', SESSION_STATUS_COLORS[s.status])}>
                        {SESSION_STATUS_LABELS[s.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s._count.caseStudies} cas clinique{s._count.caseStudies !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {new Date(s.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={11} /> {s.duration} min</span>
                      {s.location && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          {s.location.startsWith('http') ? <Video size={11} /> : <MapPin size={11} />}
                          {s.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {showCreateSession && (
          <CreateSessionModal
            token={token}
            groupId={selectedGroup.id}
            onCreated={(s) => { setSessions((prev) => [s, ...prev]); setShowCreateSession(false); }}
            onClose={() => setShowCreateSession(false)}
          />
        )}
      </div>
    );
  }

  // ── Vue: Cas cliniques ──────────────────────────────────────────────────────

  if (view === 'cases' && selectedSession) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {breadcrumb}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Session du {new Date(selectedSession.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock size={13} /> {selectedSession.duration} min</span>
              {selectedSession.location && (
                <span className="flex items-center gap-1">
                  {selectedSession.location.startsWith('http') ? <Video size={13} /> : <MapPin size={13} />}
                  {selectedSession.location}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>Retour</Button>
            <Button onClick={() => setShowCreateCase(true)}>
              <Plus size={15} className="mr-1.5" /> Soumettre un cas
            </Button>
          </div>
        </div>

        {selectedSession.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5"><FileText size={12} /> Notes de session</p>
            <p className="text-sm text-amber-800 whitespace-pre-wrap">{selectedSession.notes}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <CardSkeleton key={i} />)}</div>
        ) : cases.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Aucun cas clinique"
            description="Soumettez un cas anonymisé pour discussion en groupe."
            action={<Button onClick={() => setShowCreateCase(true)}><Plus size={15} className="mr-1.5" /> Soumettre un cas</Button>}
          />
        ) : (
          <div className="space-y-4">
            {cases.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-7 w-7 rounded-full bg-surface flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                          {getInitials(c.presenter.name)}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {c.presenter.name}
                          {c.initials && <> · Cas <strong>{c.initials}</strong></>}
                          {c.ageRange && <> · {c.ageRange}</>}
                        </span>
                      </div>
                      <p className="font-semibold text-foreground">{c.problematic}</p>
                    </div>
                    {expandedCase === c.id ? (
                      <ChevronUp size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
                {expandedCase === c.id && (
                  <div className="px-5 pb-5 border-t border-border pt-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{c.content}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      Soumis le {formatDate(c.createdAt)} · Chiffré AES-256-GCM
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showCreateCase && (
          <CreateCaseModal
            token={token}
            sessionId={selectedSession.id}
            onCreated={(c) => { setCases((prev) => [...prev, c]); setShowCreateCase(false); }}
            onClose={() => setShowCreateCase(false)}
          />
        )}
      </div>
    );
  }

  return null;
}

export default function SupervisionPage() {
  return (
    <FeatureLock
      requiredPlan="pro"
      featureName="Supervision & Intervision"
      featureDescription="Rejoignez des groupes de pairs pour partager des cas cliniques anonymisés et progresser ensemble."
      icon={Users}
    >
      <SupervisionContent />
    </FeatureLock>
  );
}

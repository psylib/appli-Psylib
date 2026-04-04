'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ClipboardList,
  Clock,
  Mail,
  Phone,
  Send,
  Trash2,
  CheckCircle2,
  Calendar as CalendarIcon,
  StickyNote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useToast } from '@/components/ui/toast';
import {
  waitlistApi,
  type WaitlistEntry,
  type WaitlistUrgency,
  type WaitlistStatus,
} from '@/lib/api/waitlist';
import { formatDate } from '@/lib/utils';

const URGENCY_LABELS: Record<WaitlistUrgency, { label: string; className: string }> = {
  high: { label: 'Urgent', className: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Moyen', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Faible', className: 'bg-surface text-muted-foreground border-border' },
};

const STATUS_LABELS: Record<WaitlistStatus, { label: string; variant: 'default' | 'success' | 'secondary' | 'warning' | 'outline' }> = {
  waiting: { label: 'En attente', variant: 'warning' },
  contacted: { label: 'Contacté', variant: 'default' },
  scheduled: { label: 'Planifié', variant: 'success' },
  removed: { label: 'Retiré', variant: 'outline' },
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export function WaitlistContent() {
  const { data: session } = useSession();
  const { success, error: showError } = useToast();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState<WaitlistUrgency | ''>('');
  const [statusFilter, setStatusFilter] = useState<WaitlistStatus | ''>('waiting');
  const [processing, setProcessing] = useState<string | null>(null);
  const [proposeOpen, setProposeOpen] = useState<string | null>(null);
  const [slotDate, setSlotDate] = useState('');

  const token = session?.accessToken ?? '';

  const fetchEntries = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await waitlistApi.getAll(token);
      setEntries(data);
    } catch {
      showError('Impossible de charger la liste d\'attente');
    } finally {
      setIsLoading(false);
    }
  }, [token, showError]);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (urgencyFilter && e.urgency !== urgencyFilter) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      return true;
    });
  }, [entries, urgencyFilter, statusFilter]);

  const handleMarkContacted = async (id: string) => {
    setProcessing(id);
    try {
      await waitlistApi.updateStatus(id, 'contacted', token);
      success('Marqué comme contacté');
      void fetchEntries();
    } catch {
      showError('Action échouée');
    } finally {
      setProcessing(null);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Retirer ${name} de la liste d'attente ?`)) return;
    setProcessing(id);
    try {
      await waitlistApi.remove(id, token);
      success('Patient retiré de la liste');
      void fetchEntries();
    } catch {
      showError('Suppression échouée');
    } finally {
      setProcessing(null);
    }
  };

  const handleProposeSlot = async (id: string) => {
    if (!slotDate) {
      showError('Choisis une date et une heure');
      return;
    }
    setProcessing(id);
    try {
      await waitlistApi.proposeSlot(id, new Date(slotDate).toISOString(), token);
      success('Créneau proposé — email envoyé');
      setProposeOpen(null);
      setSlotDate('');
      void fetchEntries();
    } catch {
      showError('Envoi échoué');
    } finally {
      setProcessing(null);
    }
  };

  const formatPreferredSlots = (slots: WaitlistEntry['preferredSlots']) => {
    if (!slots) return null;
    const parts: string[] = [];
    if (slots.mornings) parts.push('Matin');
    if (slots.afternoons) parts.push('Après-midi');
    if (slots.preferredDays?.length) {
      const days = slots.preferredDays.map((d) => DAY_LABELS[d]).filter(Boolean).join(', ');
      if (days) parts.push(days);
    }
    return parts.length ? parts.join(' · ') : null;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liste d'attente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? '…' : `${filtered.length} patient${filtered.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Statut :</span>
          {(['waiting', 'contacted', 'scheduled', ''] as const).map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
                statusFilter === s
                  ? 'bg-primary text-white'
                  : 'bg-surface text-muted-foreground hover:bg-border'
              }`}
            >
              {s === '' ? 'Tous' : STATUS_LABELS[s].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Urgence :</span>
          {(['', 'high', 'medium', 'low'] as const).map((u) => (
            <button
              key={u || 'all'}
              onClick={() => setUrgencyFilter(u)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
                urgencyFilter === u
                  ? 'bg-primary text-white'
                  : 'bg-surface text-muted-foreground hover:bg-border'
              }`}
            >
              {u === '' ? 'Toutes' : URGENCY_LABELS[u].label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
        ) : !filtered.length ? (
          <EmptyState
            icon={ClipboardList}
            title="Aucun patient en attente"
            description={
              statusFilter || urgencyFilter
                ? 'Aucun résultat pour ces filtres'
                : 'Votre liste d\'attente est vide. Les patients peuvent s\'inscrire depuis votre page de réservation publique.'
            }
          />
        ) : (
          <ul role="list">
            {filtered.map((entry, i) => {
              const urgency = URGENCY_LABELS[entry.urgency];
              const statusCfg = STATUS_LABELS[entry.status];
              const slots = formatPreferredSlots(entry.preferredSlots);
              const isProcessing = processing === entry.id;

              return (
                <li key={entry.id} className={i < filtered.length - 1 ? 'border-b border-border' : ''}>
                  <div className="p-4 hover:bg-surface/50 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Nom + badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{entry.patientName}</p>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${urgency.className}`}
                          >
                            {urgency.label}
                          </span>
                          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                          {entry.consultationType && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarIcon size={12} aria-hidden />
                              {entry.consultationType.name}
                            </span>
                          )}
                        </div>

                        {/* Contact */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Mail size={12} aria-hidden /> {entry.patientEmail}
                          </span>
                          {entry.patientPhone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={12} aria-hidden /> {entry.patientPhone}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} aria-hidden /> Inscrit le {formatDate(entry.createdAt)}
                          </span>
                        </div>

                        {/* Préférences + note */}
                        {slots && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Préférences :</span> {slots}
                          </p>
                        )}
                        {entry.note && (
                          <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
                            <StickyNote size={12} className="mt-0.5 flex-shrink-0" aria-hidden />
                            <span className="italic">{entry.note}</span>
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.status !== 'removed' && entry.status !== 'scheduled' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                              onClick={() => {
                                setProposeOpen(proposeOpen === entry.id ? null : entry.id);
                                setSlotDate('');
                              }}
                            >
                              <Send size={14} />
                              Proposer un créneau
                            </Button>
                            {entry.status === 'waiting' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => void handleMarkContacted(entry.id)}
                              >
                                <CheckCircle2 size={14} />
                                Marquer contacté
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isProcessing}
                          onClick={() => void handleRemove(entry.id, entry.patientName)}
                          aria-label="Retirer"
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Propose slot inline form */}
                    {proposeOpen === entry.id && (
                      <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3 flex-wrap">
                        <label className="text-xs font-medium text-foreground">
                          Date et heure du créneau proposé :
                        </label>
                        <input
                          type="datetime-local"
                          value={slotDate}
                          onChange={(e) => setSlotDate(e.target.value)}
                          className="h-9 rounded-lg border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <Button
                          size="sm"
                          disabled={isProcessing || !slotDate}
                          onClick={() => void handleProposeSlot(entry.id)}
                        >
                          Envoyer la proposition
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setProposeOpen(null);
                            setSlotDate('');
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

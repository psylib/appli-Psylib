'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  X,
  Save,
  MapPin,
  Video,
  Home,
  Globe,
} from 'lucide-react';
import {
  consultationTypesApi,
  type ConsultationType,
  type CreateConsultationTypeData,
  type ConsultationModalityValue,
} from '@/lib/api/consultation-types';

const PRESET_COLORS = [
  '#3D52A0',
  '#0D9488',
  '#7C3AED',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#6366F1',
  '#10B981',
  '#8B5CF6',
  '#F97316',
];

const MODALITY_OPTIONS: { value: ConsultationModalityValue; label: string; icon: typeof MapPin }[] = [
  { value: 'any', label: 'Toutes modalites', icon: Globe },
  { value: 'in_person', label: 'En cabinet', icon: MapPin },
  { value: 'online', label: 'En ligne (visio)', icon: Video },
  { value: 'home_visit', label: 'A domicile', icon: Home },
];

const PAYMENT_MODE_OPTIONS = [
  { value: '', label: 'Heriter des parametres generaux' },
  { value: 'online', label: 'Paiement en ligne uniquement' },
  { value: 'on_site', label: 'Paiement sur place uniquement' },
  { value: 'both', label: 'En ligne et sur place' },
];

interface FormState {
  name: string;
  duration: number;
  rate: number;
  color: string;
  category: 'standard' | 'mon_soutien_psy';
  isPublic: boolean;
  modality: ConsultationModalityValue;
  location: string;
  instructions: string;
  allowedPaymentModes: string;
  cancellationDelay: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  duration: 50,
  rate: 60,
  color: '#3D52A0',
  category: 'standard',
  isPublic: true,
  modality: 'any',
  location: '',
  instructions: '',
  allowedPaymentModes: '',
  cancellationDelay: '',
};

export function ConsultationTypesSettings({ token: tokenProp }: { token?: string }) {
  const { data: session, status } = useSession();
  const { success, error: toastError } = useToast();
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);

  const token = tokenProp || session?.accessToken || '';

  const loadTypes = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await consultationTypesApi.getAll(token);
      setTypes(data);
    } catch {
      toastError('Impossible de charger les types de consultation.');
    } finally {
      setLoading(false);
    }
  }, [token, toastError]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) { setLoading(false); return; }
    void loadTypes();
  }, [loadTypes, status, token]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (ct: ConsultationType) => {
    setForm({
      name: ct.name,
      duration: ct.duration,
      rate: Number(ct.rate),
      color: ct.color,
      category: ct.category,
      isPublic: ct.isPublic,
      modality: ct.modality || 'any',
      location: ct.location || '',
      instructions: ct.instructions || '',
      allowedPaymentModes: ct.allowedPaymentModes || '',
      cancellationDelay: ct.cancellationDelay != null ? String(ct.cancellationDelay) : '',
    });
    setEditingId(ct.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.name.trim()) return;

    setSaving(true);
    const payload: CreateConsultationTypeData = {
      name: form.name,
      duration: form.duration,
      rate: form.rate,
      color: form.color,
      category: form.category,
      isPublic: form.isPublic,
      modality: form.modality,
      location: form.location || undefined,
      instructions: form.instructions || undefined,
      allowedPaymentModes: form.allowedPaymentModes || undefined,
      cancellationDelay: form.cancellationDelay ? parseInt(form.cancellationDelay) : undefined,
    };
    try {
      if (editingId) {
        await consultationTypesApi.update(editingId, {
          ...payload,
          cancellationDelay: form.cancellationDelay ? parseInt(form.cancellationDelay) : null,
          allowedPaymentModes: form.allowedPaymentModes || null,
        }, token);
        success('Type de consultation modifie.');
      } else {
        await consultationTypesApi.create(payload, token);
        success('Type de consultation cree.');
      }
      resetForm();
      await loadTypes();
    } catch {
      toastError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!token) return;
    try {
      await consultationTypesApi.deactivate(id, token);
      success('Type de consultation desactive.');
      setConfirmDeactivate(null);
      await loadTypes();
    } catch {
      toastError('Erreur lors de la desactivation.');
    }
  };

  // Lock rate to 50 for MSP category
  const handleCategoryChange = (category: 'standard' | 'mon_soutien_psy') => {
    setForm((prev) => ({
      ...prev,
      category,
      rate: category === 'mon_soutien_psy' ? 50 : prev.rate,
    }));
  };

  const activeTypes = types.filter((t) => t.isActive);
  const inactiveTypes = types.filter((t) => !t.isActive);

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-foreground">Motifs de consultation</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Definissez les types de consultation proposes lors de la prise de rendez-vous.
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setEditingId(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un motif
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Inline form */}
          {showForm && (
            <form onSubmit={(e) => void handleSubmit(e)} className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">
                  {editingId ? 'Modifier le motif' : 'Nouveau motif de consultation'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1 rounded hover:bg-white/50 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="grid gap-3">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nom du motif
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Consultation individuelle"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Duree (minutes)
                    </label>
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                      min={5}
                      max={240}
                      step={5}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Tarif (EUR)
                    </label>
                    <input
                      type="number"
                      value={form.rate}
                      onChange={(e) => setForm((prev) => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                      min={0}
                      step={1}
                      required
                      disabled={form.category === 'mon_soutien_psy'}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-muted-foreground"
                    />
                    {form.category === 'mon_soutien_psy' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tarif fixe a 50 EUR pour Mon Soutien Psy
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Categorie
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => handleCategoryChange(e.target.value as 'standard' | 'mon_soutien_psy')}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="standard">Standard</option>
                      <option value="mon_soutien_psy">Mon Soutien Psy</option>
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Couleur
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${
                            form.color === c ? 'border-foreground scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Couleur ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Public toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      form.isPublic ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.isPublic ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-foreground">
                    Visible sur la page de prise de RDV publique
                  </span>
                </div>

                {/* Separator */}
                <div className="border-t border-border pt-3 mt-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Parametres avances
                  </p>
                </div>

                {/* Modality */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Modalite
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODALITY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, modality: opt.value }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                            form.modality === opt.value
                              ? 'border-primary bg-primary/5 text-primary font-medium'
                              : 'border-border bg-white text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Location (shown for in_person and home_visit) */}
                {(form.modality === 'in_person' || form.modality === 'home_visit' || form.modality === 'any') && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Lieu (optionnel)
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Ex: Cabinet 12 rue de la Paix, Nancy"
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                )}

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Consignes pour le patient (optionnel)
                  </label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Ex: Merci d'arriver 10 minutes avant votre rendez-vous."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Payment modes */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Moyens de paiement
                    </label>
                    <select
                      value={form.allowedPaymentModes}
                      onChange={(e) => setForm((prev) => ({ ...prev, allowedPaymentModes: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      {PAYMENT_MODE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cancellation delay */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Delai d&apos;annulation
                    </label>
                    <select
                      value={form.cancellationDelay}
                      onChange={(e) => setForm((prev) => ({ ...prev, cancellationDelay: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    >
                      <option value="">Parametres generaux</option>
                      <option value="12">12 heures</option>
                      <option value="24">24 heures</option>
                      <option value="48">48 heures</option>
                      <option value="72">72 heures</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Form actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingId ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {/* Active types list */}
          {activeTypes.length === 0 && !showForm ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                Aucun motif de consultation configure.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajoutez des motifs pour les proposer lors de la prise de rendez-vous en ligne.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTypes.map((ct) => (
                <div
                  key={ct.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white hover:border-primary/20 transition-colors group"
                >
                  {/* Color dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ct.color }}
                  />

                  {/* Name */}
                  <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                    {ct.name}
                  </span>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ct.category === 'mon_soutien_psy' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        MSP
                      </span>
                    )}
                    {ct.modality && ct.modality !== 'any' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        {ct.modality === 'online' && <Video className="w-3 h-3" />}
                        {ct.modality === 'in_person' && <MapPin className="w-3 h-3" />}
                        {ct.modality === 'home_visit' && <Home className="w-3 h-3" />}
                        {ct.modality === 'online' ? 'Visio' : ct.modality === 'in_person' ? 'Cabinet' : 'Domicile'}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {ct.duration}min
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface text-muted-foreground">
                      {Number(ct.rate)}EUR
                    </span>
                    {ct.isPublic ? (
                      <Eye className="w-3.5 h-3.5 text-accent" aria-label="Visible publiquement" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-muted-foreground" aria-label="Prive" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(ct)}
                      className="p-1.5 rounded-md hover:bg-surface transition-colors"
                      aria-label={`Modifier ${ct.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {confirmDeactivate === ct.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleDeactivate(ct.id)}
                          className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeactivate(null)}
                          className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeactivate(ct.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 transition-colors"
                        aria-label={`Desactiver ${ct.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inactive types */}
          {inactiveTypes.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Desactives
              </p>
              <div className="space-y-1">
                {inactiveTypes.map((ct) => (
                  <div
                    key={ct.id}
                    className="flex items-center gap-3 p-2 rounded-lg opacity-50"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ct.color }}
                    />
                    <span className="text-sm text-muted-foreground line-through flex-1">
                      {ct.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {ct.duration}min / {Number(ct.rate)}EUR
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

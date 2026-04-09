'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import { psychologistApi } from '@/lib/api/psychologist';
import { Loader2, Save, Bell, Mail, MessageSquare, Info } from 'lucide-react';

const DELAY_OPTIONS = [
  { value: 1, label: '1 heure avant' },
  { value: 2, label: '2 heures avant' },
  { value: 6, label: '6 heures avant' },
  { value: 12, label: '12 heures avant' },
  { value: 24, label: '24 heures avant' },
  { value: 48, label: '48 heures avant' },
  { value: 72, label: '72 heures avant' },
];

const TEMPLATE_VARIABLES = [
  { key: '{patient_name}', label: 'Nom du patient' },
  { key: '{psy_name}', label: 'Votre nom' },
  { key: '{date}', label: 'Date du RDV' },
  { key: '{heure}', label: 'Heure du RDV' },
  { key: '{duree}', label: 'Duree (min)' },
  { key: '{motif}', label: 'Motif de consultation' },
];

const DEFAULT_TEMPLATE =
  'Bonjour {patient_name},\n\nCeci est un rappel pour votre rendez-vous avec {psy_name} le {date} a {heure} ({motif}, {duree} minutes).\n\nA bientot !';

const PREVIEW_VALUES: Record<string, string> = {
  '{patient_name}': 'Marie Dupont',
  '{psy_name}': 'Dr. Martin',
  '{date}': 'mardi 15 avril',
  '{heure}': '14:30',
  '{duree}': '50',
  '{motif}': 'Consultation individuelle',
};

export function ReminderSettings({ token: tokenProp }: { token?: string }) {
  const { data: session, status } = useSession();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [delay, setDelay] = useState(24);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);

  const token = tokenProp || session?.accessToken || '';

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) { setLoading(false); return; }
    psychologistApi
      .getProfile(token)
      .then((profile) => {
        setEmailEnabled(profile.reminderEmailEnabled);
        setSmsEnabled(profile.reminderSmsEnabled);
        setDelay(profile.reminderDelay);
        setTemplate(profile.reminderTemplate ?? DEFAULT_TEMPLATE);
      })
      .catch(() => {
        toastError('Impossible de charger les parametres de rappels.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, status, toastError]);

  const previewMessage = useMemo(() => {
    let msg = template;
    for (const [key, value] of Object.entries(PREVIEW_VALUES)) {
      msg = msg.replaceAll(key, value);
    }
    return msg;
  }, [template]);

  const insertVariable = (variable: string) => {
    setTemplate((prev) => prev + variable);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await psychologistApi.updateProfile(
        {
          reminderEmailEnabled: emailEnabled,
          reminderSmsEnabled: smsEnabled,
          reminderDelay: delay,
          reminderTemplate: template,
        },
        token,
      );
      success('Parametres de rappels sauvegardes.');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toastError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-5">
      <div>
        <h2 className="text-base font-medium text-foreground flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Rappels de rendez-vous
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configurez les rappels automatiques envoyes a vos patients avant chaque rendez-vous.
        </p>
      </div>

      {/* Channels */}
      <div className="space-y-3">
        {/* Email */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium text-foreground">Rappels par email</span>
              <p className="text-xs text-muted-foreground">Un email est envoye au patient avant son RDV</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmailEnabled(!emailEnabled)}
            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
              emailEnabled ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                emailEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* SMS */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-border opacity-60">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <div>
              <span className="text-sm font-medium text-foreground">Rappels par SMS</span>
              <p className="text-xs text-muted-foreground">
                Bientot disponible
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground bg-surface px-2 py-0.5 rounded-full">
              Prochainement
            </span>
            <button
              type="button"
              disabled
              className="relative w-10 h-5 rounded-full bg-gray-200 flex-shrink-0 cursor-not-allowed"
            >
              <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow" />
            </button>
          </div>
        </div>
      </div>

      {/* Delay */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Delai d&apos;envoi du rappel
        </label>
        <select
          value={delay}
          onChange={(e) => setDelay(parseInt(e.target.value))}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          {DELAY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Template */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Message personnalise
        </label>

        {/* Variable chips */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TEMPLATE_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/5 text-xs font-mono text-primary hover:bg-primary/10 transition-colors border border-primary/10"
              title={`Inserer ${v.label}`}
            >
              {v.key}
            </button>
          ))}
        </div>

        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y font-mono"
          placeholder="Entrez votre message de rappel personnalise..."
        />
      </div>

      {/* Preview toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Info className="w-3.5 h-3.5" />
          {showPreview ? 'Masquer' : 'Voir'} l&apos;apercu du message
        </button>

        {showPreview && (
          <div className="mt-2 p-3 rounded-lg bg-surface border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Apercu
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {previewMessage}
            </p>
          </div>
        )}
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? 'Sauvegarde !' : 'Sauvegarder les rappels'}
      </button>
    </div>
  );
}

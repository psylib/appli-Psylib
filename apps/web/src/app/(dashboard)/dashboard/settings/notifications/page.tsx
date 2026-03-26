'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Bell, Mail, Smartphone, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notificationsApi, type NotificationPreferences } from '@/lib/api/notifications';

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
}

const NOTIF_TYPES: { id: string; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'session_reminder', label: 'Rappels de séance', description: 'Rappel avant chaque rendez-vous programmé', icon: Calendar },
  { id: 'patient_message', label: 'Messages patients', description: 'Notification quand un patient vous envoie un message', icon: Mail },
  { id: 'mood_alert', label: 'Alertes humeur', description: 'Alerte quand un patient signale une humeur basse', icon: Bell },
  { id: 'ai_complete', label: 'Résumés IA terminés', description: 'Notification quand un résumé de séance est prêt', icon: Sparkles },
  { id: 'payment', label: 'Paiements', description: 'Confirmations de paiement et factures', icon: Smartphone },
];

const DEFAULT_PREFS: NotificationPreferences = {
  session_reminder: { email: true, push: true },
  patient_message: { email: true, push: true },
  mood_alert: { email: true, push: true },
  ai_complete: { email: false, push: true },
  payment: { email: true, push: false },
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  const [settings, setSettings] = useState<NotifSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const prefs = await notificationsApi.getPreferences(token);
        const merged = NOTIF_TYPES.map((t) => ({
          ...t,
          email: (prefs as NotificationPreferences)[t.id]?.email ?? DEFAULT_PREFS[t.id]!.email,
          push: (prefs as NotificationPreferences)[t.id]?.push ?? DEFAULT_PREFS[t.id]!.push,
        }));
        setSettings(merged);
      } catch {
        setSettings(NOTIF_TYPES.map((t) => ({ ...t, ...DEFAULT_PREFS[t.id]! })));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const toggle = (id: string, channel: 'email' | 'push') => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [channel]: !s[channel] } : s)),
    );
    setSaved(false);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const prefs: NotificationPreferences = {};
      for (const s of settings) {
        prefs[s.id] = { email: s.email, push: s.push };
      }
      await notificationsApi.savePreferences(prefs, token);
      setSaved(true);
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/settings"
          className="p-2 rounded-lg hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez comment vous souhaitez être notifié.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr,80px,80px] items-center gap-2 px-6 py-3 border-b border-border bg-surface/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Type
          </span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
            Email
          </span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
            Push
          </span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          settings.map((setting) => {
            const Icon = setting.icon;
            return (
              <div
                key={setting.id}
                className="grid grid-cols-[1fr,80px,80px] items-center gap-2 px-6 py-4 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={16} className="text-primary flex-shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{setting.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{setting.description}</p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={setting.email}
                    aria-label={`${setting.label} par email`}
                    onClick={() => toggle(setting.id, 'email')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.email ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.email ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={setting.push}
                    aria-label={`${setting.label} push`}
                    onClick={() => toggle(setting.id, 'push')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.push ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-accent">Préférences enregistrées</span>}
        {error && <span className="text-sm text-destructive">{error}</span>}
        <Button onClick={() => void handleSave()} loading={saving} disabled={loading}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

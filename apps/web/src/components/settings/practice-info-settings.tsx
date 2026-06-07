'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { psychologistApi } from '@/lib/api/psychologist';
import { MapPin, Euro, Phone, Save, Clock, MessageSquareText, Bell } from 'lucide-react';

interface PracticeInfoSettingsProps {
  token?: string;
}

export function PracticeInfoSettings({ token: tokenProp }: PracticeInfoSettingsProps) {
  const { data: session, status } = useSession();
  const { success, error: toastError } = useToast();
  const token = tokenProp || session?.accessToken || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [sessionRate, setSessionRate] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [minBreakMinutes, setMinBreakMinutes] = useState('0');
  const [bookingConfirmationMessage, setBookingConfirmationMessage] = useState('');
  const [earlierSlotEnabled, setEarlierSlotEnabled] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) { setLoading(false); return; }
    psychologistApi
      .getProfile(token)
      .then((profile) => {
        setAddress(profile.address ?? '');
        setPhone(profile.phone ?? '');
        setSessionRate(profile.defaultSessionRate != null ? String(profile.defaultSessionRate) : '');
        setSessionDuration(profile.defaultSessionDuration != null ? String(profile.defaultSessionDuration) : '');
        setMinBreakMinutes(profile.minBreakMinutes != null ? String(profile.minBreakMinutes) : '0');
        setBookingConfirmationMessage(profile.bookingConfirmationMessage ?? '');
        setEarlierSlotEnabled(profile.earlierSlotEnabled ?? true);
      })
      .catch(() => {
        toastError('Impossible de charger les informations du cabinet.');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status]);

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await psychologistApi.updateProfile({
        address: address || undefined,
        phone: phone || undefined,
        defaultSessionRate: sessionRate ? Number(sessionRate) : undefined,
        defaultSessionDuration: sessionDuration ? Number(sessionDuration) : undefined,
        minBreakMinutes: Number(minBreakMinutes) || 0,
        bookingConfirmationMessage: bookingConfirmationMessage || undefined,
        earlierSlotEnabled,
      }, token);
      success('Informations du cabinet enregistrées');
      setDirty(false);
    } catch {
      toastError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 animate-pulse space-y-4">
        <div className="h-5 w-40 bg-surface rounded" />
        <div className="h-10 bg-surface rounded" />
        <div className="h-10 bg-surface rounded" />
      </div>
    );
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';

  return (
    <>
      {/* Adresse du cabinet */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          <h2 className="text-base font-medium text-foreground">Adresse du cabinet</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Adresse complète
          </label>
          <input
            type="text"
            placeholder="12 rue de la Paix, 75001 Paris"
            value={address}
            onChange={handleChange(setAddress)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Tarifs */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Euro size={18} className="text-primary" />
          <h2 className="text-base font-medium text-foreground">Tarifs</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Tarif de consultation (EUR)
            </label>
            <input
              type="number"
              placeholder="60"
              min={0}
              value={sessionRate}
              onChange={handleChange(setSessionRate)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Durée de séance par défaut (min)
            </label>
            <input
              type="number"
              placeholder="50"
              min={15}
              step={5}
              value={sessionDuration}
              onChange={handleChange(setSessionDuration)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Pause entre RDV */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h2 className="text-base font-medium text-foreground">Pause entre les rendez-vous</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Temps de pause minimum entre chaque consultation
          </label>
          <select
            value={minBreakMinutes}
            onChange={(e) => { setMinBreakMinutes(e.target.value); setDirty(true); }}
            className={inputClass}
          >
            <option value="0">Pas de pause (dos-a-dos)</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1.5">
            Ce temps sera automatiquement reserve entre deux rendez-vous consecutifs dans votre agenda.
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Phone size={18} className="text-primary" />
          <h2 className="text-base font-medium text-foreground">Informations de contact</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1.5">
            Téléphone
          </label>
          <input
            type="tel"
            placeholder="+33 6 00 00 00 00"
            value={phone}
            onChange={handleChange(setPhone)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Message de confirmation de RDV */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquareText size={18} className="text-primary" />
          <h2 className="text-base font-medium text-foreground">Message de confirmation de rendez-vous</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ce message sera affiché aux patients après la prise de rendez-vous. Vous pouvez y inclure des consignes de préparation, votre politique d&apos;annulation, etc.
        </p>
        <textarea
          placeholder={"Ex: Merci de prévoir d'arriver 5 minutes avant votre rendez-vous.\nEn cas d'annulation moins de 24h à l'avance, la séance pourra être facturée.\nN'hésitez pas à noter vos questions ou sujets à aborder."}
          value={bookingConfirmationMessage}
          onChange={(e) => { setBookingConfirmationMessage(e.target.value); setDirty(true); }}
          rows={4}
          className={`${inputClass} resize-none`}
        />
        <p className="text-xs text-muted-foreground">
          Si vide, un message par défaut sera affiché. Vous pouvez aussi définir des consignes spécifiques par type de consultation.
        </p>
      </div>

      {/* Alertes place plus tôt */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h2 className="text-base font-medium text-foreground">Alertes « place plus tôt »</h2>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <span className="text-sm font-medium text-foreground">
              Alertes « place plus tôt »
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Proposer aux patients d&apos;être prévenus si un créneau se libère avant leur rendez-vous.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEarlierSlotEnabled((v) => !v); setDirty(true); }}
            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
              earlierSlotEnabled ? 'bg-primary' : 'bg-gray-200'
            }`}
            aria-pressed={earlierSlotEnabled}
            aria-label="Activer les alertes place plus tôt"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                earlierSlotEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Bouton enregistrer */}
      {dirty && (
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} />
            Enregistrer
          </Button>
        </div>
      )}
    </>
  );
}

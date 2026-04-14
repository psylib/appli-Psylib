'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { psychologistApi } from '@/lib/api/psychologist';
import { MapPin, Euro, Phone, Save } from 'lucide-react';

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

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import { psychologistApi } from '@/lib/api/psychologist';
import { Button } from '@/components/ui/button';
import { Save, Loader2, UserX } from 'lucide-react';

export function NoShowBillingSettings() {
  const { data: session, status } = useSession();
  const { success, error: toastError } = useToast();
  const token = session?.accessToken || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [fee, setFee] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) { setLoading(false); return; }
    psychologistApi
      .getProfile(token)
      .then((profile) => {
        setEnabled(profile.noShowBillingEnabled ?? false);
        setFee(profile.noShowFee != null ? String(profile.noShowFee) : '');
      })
      .catch(() => {
        toastError('Impossible de charger les parametres.');
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await psychologistApi.updateProfile({
        noShowBillingEnabled: enabled,
        noShowFee: fee ? Number(fee) : undefined,
      }, token);
      success('Parametres d\'absence enregistres.');
      setDirty(false);
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
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <UserX className="w-4 h-4 text-muted-foreground" />
          Facturation des absences
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Facturez automatiquement les patients qui ne se presentent pas a leur rendez-vous.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border">
        <div>
          <p className="text-sm font-medium text-foreground">
            Facturer les absences
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Une facture sera automatiquement creee lorsque vous marquez un rendez-vous comme &quot;Absent&quot;.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => { setEnabled(!enabled); setDirty(true); }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
            enabled ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Fee amount (shown only if enabled) */}
      {enabled && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Montant a facturer (EUR)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={fee}
            onChange={(e) => { setFee(e.target.value); setDirty(true); }}
            placeholder="Laisser vide = tarif de la seance"
            className="flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Si vide, le tarif de la seance (ou du type de consultation) sera utilise.
          </p>
        </div>
      )}

      {/* Save */}
      {dirty && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} loading={saving}>
            <Save size={16} />
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}

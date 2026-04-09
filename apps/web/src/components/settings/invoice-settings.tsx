'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import { psychologistApi } from '@/lib/api/psychologist';
import { Loader2, FileText } from 'lucide-react';

export function InvoiceSettings({ token: tokenProp }: { token?: string }) {
  const { data: session, status } = useSession();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [autoInvoiceEmail, setAutoInvoiceEmail] = useState(true);
  const [togglingInvoice, setTogglingInvoice] = useState(false);
  const [togglingEmail, setTogglingEmail] = useState(false);

  const token = tokenProp || session?.accessToken || '';

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) { setLoading(false); return; }
    psychologistApi
      .getProfile(token)
      .then((profile) => {
        setAutoInvoice(profile.autoInvoice);
        setAutoInvoiceEmail(profile.autoInvoiceEmail);
      })
      .catch(() => {
        // Profile may not be fully loaded — keep defaults
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, status]);

  const handleToggleAutoInvoice = async () => {
    if (!token) return;
    const newValue = !autoInvoice;
    setTogglingInvoice(true);
    try {
      await psychologistApi.updateProfile(
        { autoInvoice: newValue, ...(newValue === false ? { autoInvoiceEmail: false } : {}) },
        token,
      );
      setAutoInvoice(newValue);
      if (!newValue) setAutoInvoiceEmail(false);
      success(
        newValue
          ? 'Facturation automatique activee.'
          : 'Facturation automatique desactivee.',
      );
    } catch {
      toastError('Erreur lors de la mise a jour.');
    } finally {
      setTogglingInvoice(false);
    }
  };

  const handleToggleAutoInvoiceEmail = async () => {
    if (!token) return;
    const newValue = !autoInvoiceEmail;
    setTogglingEmail(true);
    try {
      await psychologistApi.updateProfile({ autoInvoiceEmail: newValue }, token);
      setAutoInvoiceEmail(newValue);
      success(
        newValue
          ? 'Envoi automatique par email active.'
          : 'Envoi automatique par email desactive.',
      );
    } catch {
      toastError('Erreur lors de la mise a jour.');
    } finally {
      setTogglingEmail(false);
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
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div>
        <h2 className="text-base font-medium text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          Facturation automatique
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configuration de la generation automatique de factures apres chaque seance.
        </p>
      </div>

      {/* Toggle: auto-invoice */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border">
        <div>
          <span className="text-sm font-medium text-foreground">
            Generer une facture automatiquement
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Une facture brouillon est cree des qu&apos;une seance est terminee ou un paiement Stripe confirme.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {togglingInvoice && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <button
            type="button"
            onClick={() => void handleToggleAutoInvoice()}
            disabled={togglingInvoice}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              autoInvoice ? 'bg-primary' : 'bg-gray-200'
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                autoInvoice ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Toggle: auto-invoice email — only visible when auto-invoice is enabled */}
      {autoInvoice && (
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <div>
            <span className="text-sm font-medium text-foreground">
              Envoyer la facture par email automatiquement
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              La facture est envoyee par email au patient des que le paiement Stripe est confirme.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {togglingEmail && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            <button
              type="button"
              onClick={() => void handleToggleAutoInvoiceEmail()}
              disabled={togglingEmail}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                autoInvoiceEmail ? 'bg-primary' : 'bg-gray-200'
              } disabled:opacity-50`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  autoInvoiceEmail ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

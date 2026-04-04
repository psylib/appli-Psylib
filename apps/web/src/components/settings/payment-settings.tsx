'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import { apiClient } from '@/lib/api/client';
import { psychologistApi } from '@/lib/api/psychologist';
import {
  Loader2,
  CreditCard,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ConnectStatus {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  allowOnlinePayment: boolean;
  stripeOnboardingComplete: boolean;
}

export function PaymentSettings() {
  const { data: session } = useSession();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [allowPayment, setAllowPayment] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const token = session?.accessToken ?? '';

  useEffect(() => {
    if (!token) return;
    apiClient
      .get<ConnectStatus>('/billing/connect/status', token)
      .then((data) => {
        setStatus(data);
        setAllowPayment(data.allowOnlinePayment);
      })
      .catch(() => {
        toastError('Impossible de charger le statut de paiement.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, toastError]);

  const handleConnect = async () => {
    if (!token) return;
    setConnecting(true);
    try {
      const { url } = await apiClient.post<{ url: string }>(
        '/billing/connect/onboard',
        {},
        token,
      );
      window.location.href = url;
    } catch {
      toastError('Erreur lors de la connexion a Stripe.');
      setConnecting(false);
    }
  };

  const handleTogglePayment = async () => {
    if (!token) return;
    const newValue = !allowPayment;
    setToggling(true);
    try {
      await psychologistApi.updateProfile(
        { allowOnlinePayment: newValue },
        token,
      );
      setAllowPayment(newValue);
      success(
        newValue
          ? 'Paiement en ligne active.'
          : 'Paiement en ligne desactive.',
      );
    } catch {
      toastError('Erreur lors de la mise a jour.');
    } finally {
      setToggling(false);
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

  const isConnected = status?.hasAccount && status?.chargesEnabled && status?.detailsSubmitted;
  const isPending = status?.hasAccount && !status?.chargesEnabled;

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div>
        <h2 className="text-base font-medium text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Paiement en ligne
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Permettez a vos patients de regler leurs consultations en ligne via Stripe.
        </p>
      </div>

      {/* Status */}
      {isConnected ? (
        <>
          {/* Connected state */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/10">
            <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-medium text-accent">Compte Stripe connecte</span>
              <p className="text-xs text-muted-foreground">
                Vous pouvez recevoir des paiements en ligne.
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
              Actif
            </span>
          </div>

          {/* Toggle online payment */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <span className="text-sm font-medium text-foreground">
                Autoriser le paiement en ligne lors de la prise de RDV
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Les patients pourront regler directement lors de la reservation en ligne.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {toggling && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              <button
                type="button"
                onClick={() => void handleTogglePayment()}
                disabled={toggling}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  allowPayment ? 'bg-primary' : 'bg-gray-200'
                } disabled:opacity-50`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    allowPayment ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Link to Stripe dashboard */}
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Acceder a mon tableau de bord Stripe
          </a>
        </>
      ) : isPending ? (
        <>
          {/* Pending state */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-medium text-amber-700">Configuration en cours</span>
              <p className="text-xs text-amber-600">
                Votre compte Stripe est cree mais la verification n&apos;est pas terminee.
                Completez votre profil Stripe pour commencer a recevoir des paiements.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Reprendre la configuration Stripe
          </button>
        </>
      ) : (
        <>
          {/* Not connected state */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-surface border border-border">
            <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">
                Aucun compte de paiement configure
              </span>
              <p className="text-xs text-muted-foreground">
                Connectez votre compte Stripe pour accepter les paiements en ligne de vos patients.
                La configuration prend environ 5 minutes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Configurer Stripe Connect
          </button>

          <p className="text-xs text-muted-foreground">
            Stripe est un service de paiement securise utilise par des millions de professionnels.
            Vos paiements sont verses directement sur votre compte bancaire.
          </p>
        </>
      )}
    </div>
  );
}

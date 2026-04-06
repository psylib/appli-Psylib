'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Calendar,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Home,
  Clock,
  User,
  RefreshCw,
} from 'lucide-react';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

interface CancelInfo {
  appointmentId: string;
  scheduledAt: string;
  duration: number;
  psychologistName: string;
  patientName: string;
  alreadyCancelled: boolean;
  withinDelay: boolean;
  canAutoRefund: boolean;
  hoursUntil: number;
  cancellationDelay: number;
}

interface CancelResult {
  success: boolean;
  alreadyCancelled: boolean;
  refunded: boolean;
  withinDelay: boolean;
}

type PageState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'info'; data: CancelInfo }
  | { kind: 'cancelled'; result: CancelResult };

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function CancelAppointmentPage() {
  const params = useParams();
  const token = params['token'] as string;

  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE}/api/v1/appointments/cancel/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('not_found');
          throw new Error('fetch_error');
        }
        return res.json() as Promise<CancelInfo>;
      })
      .then((data) => setState({ kind: 'info', data }))
      .catch((err: Error) => {
        const msg =
          err.message === 'not_found'
            ? 'Lien invalide ou expiré. Ce lien ne correspond à aucun rendez-vous.'
            : 'Une erreur est survenue. Veuillez réessayer ou contacter votre praticien.';
        setState({ kind: 'error', message: msg });
      });
  }, [token]);

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/appointments/cancel/${token}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('cancel_error');
      const result = (await res.json()) as CancelResult;
      setState({ kind: 'cancelled', result });
    } catch {
      setState({
        kind: 'error',
        message: 'L\'annulation a échoué. Veuillez réessayer ou contacter votre praticien.',
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-[#3D52A0] font-bold text-lg">
            PsyLib
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">
          {/* Loading */}
          {state.kind === 'loading' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F1F0F9] mb-6">
                <RefreshCw size={28} className="text-[#3D52A0] animate-spin" aria-hidden />
              </div>
              <div className="space-y-3">
                <div className="h-6 bg-[#F1F0F9] rounded-full w-3/4 mx-auto animate-pulse" />
                <div className="h-4 bg-[#F1F0F9] rounded-full w-1/2 mx-auto animate-pulse" />
              </div>
              <div className="mt-8 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-3">
                <div className="h-4 bg-[#F1F0F9] rounded-full w-full animate-pulse" />
                <div className="h-4 bg-[#F1F0F9] rounded-full w-5/6 animate-pulse" />
                <div className="h-4 bg-[#F1F0F9] rounded-full w-4/6 animate-pulse" />
              </div>
            </div>
          )}

          {/* Error */}
          {state.kind === 'error' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                  <XCircle size={36} className="text-red-500" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold text-[#1E1B4B] leading-snug">
                  Lien invalide ou expiré
                </h1>
                <p className="mt-3 text-base text-gray-500 leading-relaxed">
                  {state.message}
                </p>
              </div>
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F1F0F9] text-[#1E1B4B] text-sm font-semibold hover:bg-[#E8E6F8] transition-colors"
                >
                  <Home size={16} aria-hidden />
                  Retour à l&apos;accueil
                </Link>
              </div>
            </>
          )}

          {/* Info — appointment details + cancel action */}
          {state.kind === 'info' && (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    state.data.alreadyCancelled
                      ? 'bg-gray-100'
                      : state.data.withinDelay
                        ? 'bg-[#3D52A0]/10'
                        : 'bg-amber-50'
                  }`}
                >
                  {state.data.alreadyCancelled ? (
                    <XCircle size={36} className="text-gray-400" aria-hidden />
                  ) : state.data.withinDelay ? (
                    <Calendar size={36} className="text-[#3D52A0]" aria-hidden />
                  ) : (
                    <AlertTriangle size={36} className="text-amber-500" aria-hidden />
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1E1B4B] leading-snug">
                  {state.data.alreadyCancelled
                    ? 'Rendez-vous déjà annulé'
                    : 'Annuler votre rendez-vous'}
                </h1>
                {state.data.alreadyCancelled && (
                  <p className="mt-3 text-base text-gray-500">
                    Ce rendez-vous a déjà été annulé.
                  </p>
                )}
              </div>

              {/* Already cancelled info */}
              {state.data.alreadyCancelled && (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 mb-6 flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">
                      Ce rendez-vous a déjà été annulé
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Aucune action supplémentaire n&apos;est nécessaire. Si vous souhaitez
                      reprendre un rendez-vous, contactez votre praticien.
                    </p>
                  </div>
                </div>
              )}

              {/* Appointment details card */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-5 shadow-sm">
                <p className="text-sm font-semibold text-[#1E1B4B] mb-4">
                  Détails du rendez-vous
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#3D52A0] flex-shrink-0" aria-hidden />
                    <span className="text-sm text-gray-700 capitalize">
                      {formatDate(state.data.scheduledAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#3D52A0] flex-shrink-0" aria-hidden />
                    <span className="text-sm text-gray-700">
                      {formatTime(state.data.scheduledAt)} · {state.data.duration} minutes
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-[#3D52A0] flex-shrink-0" aria-hidden />
                    <span className="text-sm text-gray-700">
                      {state.data.psychologistName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Refund / delay banner — only if not already cancelled */}
              {!state.data.alreadyCancelled && (
                <>
                  {state.data.withinDelay && state.data.canAutoRefund && (
                    <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 mb-5 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 mb-1">
                          Remboursement automatique
                        </p>
                        <p className="text-sm text-emerald-700 leading-relaxed">
                          Vous annulez dans les délais ({state.data.cancellationDelay}h avant le
                          rendez-vous). Votre paiement sera remboursé automatiquement.
                        </p>
                      </div>
                    </div>
                  )}

                  {state.data.withinDelay && !state.data.canAutoRefund && (
                    <div className="bg-[#F8F7FF] rounded-2xl border border-[#E5E7EB] p-5 mb-5 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#3D52A0] flex-shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-[#1E1B4B] mb-1">
                          Annulation possible
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Vous pouvez annuler ce rendez-vous. Contactez votre praticien
                          directement pour toute question de remboursement.
                        </p>
                      </div>
                    </div>
                  )}

                  {!state.data.withinDelay && (
                    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 mb-5 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-amber-800 mb-1">
                          Annulation tardive
                        </p>
                        <p className="text-sm text-amber-700 leading-relaxed">
                          Ce rendez-vous est dans moins de {state.data.cancellationDelay} heures.
                          Aucun remboursement automatique ne sera effectué. Vous pouvez tout de même
                          annuler — contactez votre praticien pour toute question.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cancel button */}
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-[#3D52A0] text-white text-sm font-semibold hover:bg-[#2D3F7C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-4 shadow-sm"
                  >
                    {cancelling ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" aria-hidden />
                        Annulation en cours…
                      </>
                    ) : (
                      <>
                        <XCircle size={16} aria-hidden />
                        Confirmer l&apos;annulation
                      </>
                    )}
                  </button>

                  <Link
                    href="/"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#F1F0F9] text-[#1E1B4B] text-sm font-semibold hover:bg-[#E8E6F8] transition-colors"
                  >
                    <Home size={16} aria-hidden />
                    Ne pas annuler — retour à l&apos;accueil
                  </Link>
                </>
              )}

              {/* Already cancelled: only home button */}
              {state.data.alreadyCancelled && (
                <div className="flex justify-center mt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F1F0F9] text-[#1E1B4B] text-sm font-semibold hover:bg-[#E8E6F8] transition-colors"
                  >
                    <Home size={16} aria-hidden />
                    Retour à l&apos;accueil
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Cancelled success */}
          {state.kind === 'cancelled' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0D9488]/10 mb-4">
                  <CheckCircle2 size={36} className="text-[#0D9488]" aria-hidden />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1E1B4B] leading-snug">
                  Rendez-vous annulé
                </h1>
                <p className="mt-3 text-base text-gray-500">
                  Votre rendez-vous a bien été annulé.
                </p>
              </div>

              {/* Refund status */}
              {state.result.refunded ? (
                <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 mb-6 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 mb-1">
                      Remboursement initié
                    </p>
                    <p className="text-sm text-emerald-700 leading-relaxed">
                      Votre remboursement a été initié automatiquement. Il apparaîtra sur votre
                      relevé bancaire sous 3 à 5 jours ouvrés.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F8F7FF] rounded-2xl border border-[#E5E7EB] p-5 mb-6 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#3D52A0] flex-shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-[#1E1B4B] mb-1">
                      Annulation enregistrée
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Votre annulation a été prise en compte. Pour toute question concernant un
                      éventuel remboursement, contactez votre praticien directement.
                    </p>
                  </div>
                </div>
              )}

              {/* What's next */}
              <div className="bg-white rounded-2xl border-l-4 border-l-[#3D52A0] border border-[#E5E7EB] p-6 mb-6 shadow-sm">
                <p className="text-sm font-semibold text-[#1E1B4B] mb-1">
                  Et maintenant ?
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Un email de confirmation d&apos;annulation vous a été envoyé. Si vous souhaitez
                  reprendre un suivi, n&apos;hésitez pas à reprendre contact avec votre praticien.
                </p>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#F1F0F9] text-[#1E1B4B] text-sm font-semibold hover:bg-[#E8E6F8] transition-colors"
                >
                  <Home size={16} aria-hidden />
                  Retour à l&apos;accueil
                </Link>
              </div>
            </>
          )}

          {/* Footer trust line */}
          {state.kind !== 'loading' && (
            <p className="text-center text-xs text-gray-400 mt-8">
              Données confidentielles · Hébergées en France (HDS) · PsyLib
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

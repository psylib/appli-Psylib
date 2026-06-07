'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, CheckCircle2, RefreshCw, XCircle, Home, Clock } from 'lucide-react';
import { fetchRebook, moveRebook, type RebookInfo } from '@/lib/api/rebook';

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RebookPage() {
  const params = useParams();
  const token = params['token'] as string;

  const [info, setInfo] = useState<RebookInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchRebook(token)
      .then(setInfo)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function pick(slot: string) {
    if (moving !== null) return;
    setMoving(slot);
    setError(null);
    try {
      const res = await moveRebook(token, slot);
      setDone(res.scheduledAt);
    } catch (e) {
      setError((e as Error).message);
      // Reload slots — the one we tried may have just been taken
      fetchRebook(token)
        .then(setInfo)
        .catch(() => {});
    } finally {
      setMoving(null);
    }
  }

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

          {/* Loading skeleton */}
          {loading && (
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

          {/* Error loading */}
          {!loading && error && !done && !info && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                  <XCircle size={36} className="text-red-500" aria-hidden />
                </div>
                <h1 className="text-2xl font-bold text-[#1E1B4B] leading-snug">
                  Lien invalide ou expiré
                </h1>
                <p className="mt-3 text-base text-gray-500 leading-relaxed">{error}</p>
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

          {/* Success confirmation */}
          {done && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0D9488]/10 mb-4">
                  <CheckCircle2 size={36} className="text-[#0D9488]" aria-hidden />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1E1B4B] leading-snug">
                  Rendez-vous avancé !
                </h1>
                <p className="mt-3 text-base text-gray-500">
                  Votre rendez-vous a été déplacé avec succès.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 mb-6 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 mb-1">
                    Nouveau créneau confirmé
                  </p>
                  <p className="text-sm text-emerald-700 leading-relaxed capitalize">
                    {fmt(done)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-l-4 border-l-[#3D52A0] border border-[#E5E7EB] p-6 mb-6 shadow-sm">
                <p className="text-sm font-semibold text-[#1E1B4B] mb-1">Et maintenant ?</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Un email de confirmation vous a été envoyé avec les détails de votre nouveau
                  rendez-vous.
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

          {/* Main content: slots */}
          {!loading && !done && info && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3D52A0]/10 mb-4">
                  <Calendar size={36} className="text-[#3D52A0]" aria-hidden />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1E1B4B] leading-snug">
                  Avancer mon rendez-vous
                </h1>
              </div>

              {/* Current appointment card */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mb-5 shadow-sm">
                <p className="text-sm font-semibold text-[#1E1B4B] mb-4">Rendez-vous actuel</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#3D52A0] flex-shrink-0" aria-hidden />
                    <span className="text-sm text-gray-700 capitalize">
                      {fmt(info.currentDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#3D52A0] flex-shrink-0" aria-hidden />
                    <span className="text-sm text-gray-700">{info.psychologistName}</span>
                  </div>
                </div>
              </div>

              {/* Inline error (slot taken, retry) */}
              {error && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* No earlier slots */}
              {info.slots.length === 0 ? (
                <div className="bg-[#F8F7FF] rounded-2xl border border-[#E5E7EB] p-6 flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#3D52A0] flex-shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-[#1E1B4B] mb-1">
                      Aucun créneau plus tôt disponible
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Il n&apos;y a pas de place disponible avant votre rendez-vous pour le moment.
                      Vous conservez votre rendez-vous actuel et serez prévenu si une place se libère.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#1E1B4B] mb-3">
                    Créneaux plus tôt disponibles :
                  </p>
                  <ul className="space-y-2">
                    {info.slots.map((s) => (
                      <li key={s}>
                        <button
                          onClick={() => pick(s)}
                          disabled={moving !== null}
                          className="w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left text-sm text-[#1E1B4B] hover:border-[#3D52A0] hover:bg-[#F1F0F9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors capitalize"
                        >
                          {moving === s ? (
                            <span className="flex items-center gap-2">
                              <RefreshCw size={14} className="animate-spin" aria-hidden />
                              Déplacement en cours…
                            </span>
                          ) : (
                            fmt(s)
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}

          {/* Footer trust line */}
          {!loading && (
            <p className="text-center text-xs text-gray-400 mt-8">
              Données confidentielles · Hébergées en France (HDS) · PsyLib
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

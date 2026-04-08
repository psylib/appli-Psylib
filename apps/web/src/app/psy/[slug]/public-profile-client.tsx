'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Clock, Euro, Star, ChevronLeft, ChevronRight, X, Loader2, ShieldCheck, Video, Lock } from 'lucide-react';
import { publicBookingApi } from '@/lib/api/public-booking';
import type { PublicPsyProfile, ConsultationType } from '@/lib/api/public-booking';
import { ConsultationTypePicker } from '@/components/booking/consultation-type-picker';
import { PaymentChoice } from '@/components/booking/payment-choice';
import { WaitlistSignup } from '@/components/booking/waitlist-signup';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APPROACH_COLORS: Record<string, string> = {
  TCC: 'bg-blue-100 text-blue-700',
  ACT: 'bg-teal-100 text-teal-700',
  PSYCHODYNAMIQUE: 'bg-violet-100 text-violet-700',
  SYSTEMIQUE: 'bg-amber-100 text-amber-700',
  AUTRE: 'bg-gray-100 text-gray-600',
};

function formatDate(date: Date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Slot picker ──────────────────────────────────────────────────────────────

function SlotPicker({
  slug,
  consultationTypeId,
  onSelect,
}: {
  slug: string;
  consultationTypeId?: string;
  onSelect: (slot: Date) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = addDays(today, weekOffset * 7);
  const weekEnd = addDays(weekStart, 13); // 2 weeks at a time

  useEffect(() => {
    setLoading(true);
    publicBookingApi
      .getSlots(slug, weekStart.toISOString(), weekEnd.toISOString(), consultationTypeId)
      .then((data) => setSlots(data.slots.map((s) => new Date(s))))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, weekOffset, consultationTypeId]);

  // Group by day
  const byDay: Record<string, Date[]> = {};
  for (const slot of slots) {
    const key = slot.toDateString();
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(slot);
  }

  const days: Array<{ date: Date; slots: Date[] }> = [];
  const cursor = new Date(weekStart);
  for (let i = 0; i < 14; i++) {
    const key = cursor.toDateString();
    if (byDay[key] && byDay[key]!.length > 0) {
      days.push({ date: new Date(cursor), slots: byDay[key]! });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
          disabled={weekOffset === 0}
          className="p-2 rounded-lg border border-border hover:bg-surface disabled:opacity-30 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-muted-foreground">
          {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} —{' '}
          {weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
        </span>
        <button
          onClick={() => setWeekOffset((w) => Math.min(1, w + 1))}
          disabled={weekOffset >= 1}
          className="p-2 rounded-lg border border-border hover:bg-surface disabled:opacity-30 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : days.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          Aucun créneau disponible sur cette période.
        </p>
      ) : (
        <div className="space-y-4">
          {days.map(({ date, slots: daySlots }) => (
            <div key={date.toDateString()}>
              <p className="text-sm font-medium text-foreground mb-2 capitalize">
                {formatDate(date)}
              </p>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <button
                    key={slot.toISOString()}
                    onClick={() => {
                      setSelectedSlot(slot);
                      onSelect(slot);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      selectedSlot?.toISOString() === slot.toISOString()
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-border text-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────

function BookingModal({
  slot,
  slug,
  duration,
  consultationType,
  acceptsOnlinePayment,
  offersVisio,
  onClose,
  onSuccess,
}: {
  slot: Date;
  slug: string;
  duration: number;
  consultationType?: ConsultationType;
  acceptsOnlinePayment?: boolean;
  offersVisio?: boolean;
  onClose: () => void;
  onSuccess: (appointmentId: string, checkoutUrl?: string) => void;
}) {
  const [form, setForm] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    reason: '',
  });
  const [payOnline, setPayOnline] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rate = consultationType?.rate ?? 0;
  const showPaymentChoice = acceptsOnlinePayment && rate > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await publicBookingApi.book(slug, {
        patientName: form.patientName,
        patientEmail: form.patientEmail,
        patientPhone: form.patientPhone,
        scheduledAt: slot.toISOString(),
        reason: form.reason || undefined,
        consultationTypeId: consultationType?.id,
        payOnline: showPaymentChoice ? payOnline : undefined,
        isOnline: offersVisio ? isOnline : undefined,
      });
      onSuccess(result.appointmentId, result.checkoutUrl);
    } catch (err) {
      setError((err as Error).message ?? 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface transition"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold text-foreground mb-1">Confirmer la demande</h2>

        {/* Consultation type info */}
        {consultationType ? (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: consultationType.color || '#3D52A0' }}
            />
            <span className="font-medium text-foreground">{consultationType.name}</span>
            <span className="text-muted-foreground">·</span>
            <span>{consultationType.duration} min</span>
            {consultationType.rate > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>{consultationType.rate}€</span>
              </>
            )}
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground mb-5">
          {slot.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à{' '}
          {formatTime(slot)} · {duration} min
        </p>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.patientName}
              onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
              placeholder="Marie Dupont"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="email"
              value={form.patientEmail}
              onChange={(e) => setForm((f) => ({ ...f, patientEmail: e.target.value }))}
              placeholder="marie@exemple.fr"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="tel"
              value={form.patientPhone}
              onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
              placeholder="+33 6 00 00 00 00"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Motif de consultation (optionnel)
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Anxiété, stress, dépression..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          {/* Visio / Cabinet choice */}
          {offersVisio && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-sky-50 border border-sky-200">
              <Video className="w-5 h-5 text-sky-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Mode de consultation</p>
                <p className="text-xs text-muted-foreground">Ce praticien propose aussi des séances en visio</p>
              </div>
              <div className="flex rounded-lg border border-sky-200 overflow-hidden text-sm">
                <button
                  type="button"
                  onClick={() => setIsOnline(false)}
                  className={`px-3 py-1.5 font-medium transition ${
                    !isOnline ? 'bg-white text-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:bg-sky-100'
                  }`}
                >
                  Au cabinet
                </button>
                <button
                  type="button"
                  onClick={() => setIsOnline(true)}
                  className={`px-3 py-1.5 font-medium transition ${
                    isOnline ? 'bg-sky-600 text-white' : 'bg-transparent text-muted-foreground hover:bg-sky-100'
                  }`}
                >
                  En visio
                </button>
              </div>
            </div>
          )}

          {/* Payment choice */}
          {showPaymentChoice && (
            <PaymentChoice
              payOnline={payOnline}
              onToggle={setPayOnline}
              rate={rate}
            />
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {showPaymentChoice && payOnline
              ? `Payer ${rate}€ et réserver`
              : 'Envoyer ma demande'}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            {showPaymentChoice && payOnline
              ? 'Paiement sécurisé par Stripe · Vous serez redirigé(e) pour finaliser'
              : 'Aucun compte requis · Votre demande sera confirmée par le praticien'}
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PublicProfileClient({ profile }: { profile: PublicPsyProfile }) {
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  const hasConsultationTypes = profile.consultationTypes && profile.consultationTypes.length > 0;
  const selectedType = hasConsultationTypes
    ? profile.consultationTypes!.find((t) => t.id === selectedTypeId) ?? null
    : null;

  // Determine effective duration: from selected consultation type, or default
  const effectiveDuration = selectedType?.duration ?? profile.defaultSessionDuration;

  const handleSuccess = (appointmentId: string, checkoutUrl?: string) => {
    if (checkoutUrl) {
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } else {
      router.push(`/psy/${profile.slug}/confirmation?id=${appointmentId}`);
    }
  };

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Whether slot selection should be shown (either no consultation types, or one is selected)
  const showSlotPicker = !hasConsultationTypes || selectedTypeId !== null;

  return (
    <div className="min-h-screen bg-[#F8F7FF]">
      {/* Header minimal */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="text-[#3D52A0] font-bold text-lg">PsyLib</a>
          <a
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Connexion praticien
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profil hero */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {initials}
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
              {profile.specialization && (
                <p className="text-primary font-medium mt-0.5">{profile.specialization}</p>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {profile.city}
                  </span>
                )}
                {profile.defaultSessionRate && (
                  <span className="flex items-center gap-1">
                    <Euro className="w-3.5 h-3.5" /> {profile.defaultSessionRate}€ / séance
                  </span>
                )}
                {profile.defaultSessionDuration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {profile.defaultSessionDuration} min
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {profile.phone}
                  </span>
                )}
              </div>

              {profile.adeliNumber && (
                <p className="text-xs text-muted-foreground mt-2">
                  N° ADELI : {profile.adeliNumber}
                </p>
              )}

              {/* Badges Mon Soutien Psy / Visio */}
              {(profile.acceptsMonSoutienPsy || profile.offersVisio) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.acceptsMonSoutienPsy && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Mon Soutien Psy (SS)
                    </span>
                  )}
                  {profile.offersVisio && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      <Video className="w-3.5 h-3.5" />
                      Séances en visio disponibles
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mon Soutien Psy info block */}
          {profile.acceptsMonSoutienPsy && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Dispositif Mon Soutien Psy</strong> — 12 séances remboursées par la Sécurité sociale, sur prescription de votre médecin généraliste. Accessible dès 3 ans, sans avance de frais.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">À propos</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Approches */}
        {profile.approaches.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Approches thérapeutiques
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.approaches.map((a) => (
                <span
                  key={a}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    APPROACH_COLORS[a] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Spécialités */}
        {profile.specialties.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Spécialités</h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-surface text-foreground border border-border"
                >
                  <Star className="w-3 h-3 text-primary" /> {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prise de RDV */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">
            Prendre rendez-vous
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            {hasConsultationTypes
              ? 'Choisissez un type de consultation, puis sélectionnez un créneau'
              : 'Sélectionnez un créneau · Aucun compte requis'}
          </p>

          {/* Confidentialité */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[#F8F7FF] rounded-lg px-3 py-2 mb-5">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Vos données sont confidentielles et hébergées en France (HDS). Aucune information ne sera partagée sans votre consentement.</span>
          </div>

          {/* Step 1: Consultation type picker */}
          {hasConsultationTypes && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#3D52A0] text-white text-xs font-bold flex items-center justify-center">1</span>
                Type de consultation
              </h3>
              <ConsultationTypePicker
                types={profile.consultationTypes!}
                selected={selectedTypeId}
                onSelect={(id) => {
                  setSelectedTypeId(id);
                  // Reset slot when changing type (duration may differ)
                  setSelectedSlot(null);
                }}
              />
            </div>
          )}

          {/* Step 2: Slot picker */}
          {showSlotPicker && (
            <div>
              {hasConsultationTypes && (
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#3D52A0] text-white text-xs font-bold flex items-center justify-center">2</span>
                  Choisissez un créneau
                  {selectedType && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({selectedType.duration} min)
                    </span>
                  )}
                </h3>
              )}
              <SlotPicker
                slug={profile.slug}
                consultationTypeId={selectedTypeId ?? undefined}
                onSelect={setSelectedSlot}
              />
            </div>
          )}

          {/* Hint when type not yet selected */}
          {hasConsultationTypes && !selectedTypeId && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Sélectionnez un type de consultation pour voir les créneaux disponibles.
            </div>
          )}

          {/* Waitlist signup — fallback for when no slot fits */}
          {showSlotPicker && (
            <div className="mt-5">
              <WaitlistSignup
                slug={profile.slug}
                consultationTypeId={selectedTypeId ?? undefined}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Profil géré via{' '}
            <a href="/" className="text-primary hover:underline">
              PsyLib
            </a>{' '}
            · Données hébergées en France (HDS conforme)
          </p>
        </div>
      </main>

      {/* Booking modal */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          slug={profile.slug}
          duration={effectiveDuration}
          consultationType={selectedType ?? undefined}
          acceptsOnlinePayment={profile.acceptsOnlinePayment}
          offersVisio={profile.offersVisio}
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

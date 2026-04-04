'use client';

import { useState } from 'react';
import { ClipboardList, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { waitlistApi, type WaitlistUrgency } from '@/lib/api/waitlist';

interface WaitlistSignupProps {
  slug: string;
  consultationTypeId?: string;
  defaultOpen?: boolean;
}

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
];

export function WaitlistSignup({ slug, consultationTypeId, defaultOpen = false }: WaitlistSignupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    urgency: 'low' as WaitlistUrgency,
    mornings: false,
    afternoons: false,
    preferredDays: [] as number[],
    note: '',
  });

  const toggleDay = (d: number) => {
    setForm((f) => ({
      ...f,
      preferredDays: f.preferredDays.includes(d)
        ? f.preferredDays.filter((x) => x !== d)
        : [...f.preferredDays, d],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await waitlistApi.createPublic(slug, {
        patientName: form.patientName,
        patientEmail: form.patientEmail,
        patientPhone: form.patientPhone || undefined,
        consultationTypeId,
        urgency: form.urgency,
        preferredSlots: {
          mornings: form.mornings,
          afternoons: form.afternoons,
          preferredDays: form.preferredDays,
        },
        note: form.note || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message ?? 'Inscription échouée');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
        <p className="text-sm font-medium text-emerald-900">
          Vous êtes inscrit(e) sur la liste d'attente
        </p>
        <p className="text-xs text-emerald-700 mt-1">
          Vous recevrez un email dès qu'un créneau se libère.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-surface transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-4 h-4 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Pas de créneau qui convient ?
            </p>
            <p className="text-xs text-muted-foreground">
              Inscrivez-vous sur la liste d'attente
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={18} className="text-muted-foreground flex-shrink-0" aria-hidden />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" aria-hidden />
        )}
      </button>

      {open && (
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="p-4 pt-0 space-y-3 border-t border-border"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
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
              <label className="block text-xs font-medium text-foreground mb-1">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.patientPhone}
                onChange={(e) => setForm((f) => ({ ...f, patientPhone: e.target.value }))}
                placeholder="+33 6 00 00 00 00"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Urgence</label>
              <select
                value={form.urgency}
                onChange={(e) => setForm((f) => ({ ...f, urgency: e.target.value as WaitlistUrgency }))}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="low">Pas urgent</option>
                <option value="medium">Moyen</option>
                <option value="high">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-2">Préférences de créneaux</p>
            <div className="flex items-center gap-4 mb-2">
              <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.mornings}
                  onChange={(e) => setForm((f) => ({ ...f, mornings: e.target.checked }))}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                Matin
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.afternoons}
                  onChange={(e) => setForm((f) => ({ ...f, afternoons: e.target.checked }))}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                Après-midi
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d) => {
                const active = form.preferredDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      active
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-border text-foreground hover:border-primary'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Message (optionnel)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Informations complémentaires..."
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            M'inscrire sur la liste d'attente
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            Vos coordonnées sont confidentielles · Stockées en France (HDS)
          </p>
        </form>
      )}
    </div>
  );
}

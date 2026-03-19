'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, ChevronDown, ChevronUp, ArrowLeft, Loader2,
  AlertCircle, Video, CreditCard, ShieldCheck,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MatchResult {
  id: string;
  city?: string;
  department?: string;
  approaches: string[];
  specialties: string[];
  languages: string[];
  acceptsReferrals: boolean;
  acceptsMonPsy: boolean;
  offersVisio: boolean;
  bio?: string;
  matchScore: number;
  psychologist: { id: string; name: string; slug: string; specialization?: string };
}

interface SearchForm {
  chips: string[];
  freeText: string;
  approachKey: string;
  city: string;
  monPsy: boolean;
  visio: boolean;
}

// ─── Chips d'amorce ────────────────────────────────────────────────────────────

const SITUATION_CHIPS = [
  "Je me sens débordé(e)",
  "J'ai du mal à dormir",
  "Je traverse une période difficile",
  "Je ressens de l'anxiété",
  "Je vis un deuil",
  "Je veux mieux me connaître",
  "Je souffre de traumatismes",
  "Je traverse une dépression",
  "J'ai des problèmes relationnels",
  "Je veux arrêter une addiction",
];

// ─── Approches patient-friendly ───────────────────────────────────────────────

interface ApproachOption {
  key: string;
  label: string;
  description: string;
  technicalNames: string[];
  color: string;
  selectedColor: string;
}

const APPROACH_OPTIONS: ApproachOption[] = [
  {
    key: 'pratique',
    label: 'Exercices pratiques & outils concrets',
    description: 'Je veux des techniques applicables au quotidien',
    technicalNames: ['TCC', 'ACT', 'EMDR'],
    color: 'border-blue-200 text-blue-800',
    selectedColor: 'bg-blue-50 border-blue-400 text-blue-900',
  },
  {
    key: 'histoire',
    label: 'Explorer mon histoire & mes émotions profondes',
    description: 'Je veux comprendre pourquoi je réagis ainsi',
    technicalNames: ['Psychodynamique', 'Analytique', 'Psychanalyse'],
    color: 'border-purple-200 text-purple-800',
    selectedColor: 'bg-purple-50 border-purple-400 text-purple-900',
  },
  {
    key: 'relations',
    label: 'Travailler sur mes relations & mon contexte',
    description: 'Mes problèmes viennent souvent des autres',
    technicalNames: ['Systémique', 'Familiale', 'Couples'],
    color: 'border-teal-200 text-teal-800',
    selectedColor: 'bg-teal-50 border-teal-400 text-teal-900',
  },
  {
    key: 'hypnose',
    label: 'Hypnose thérapeutique',
    description: 'Je suis intéressé(e) par l\'hypnose comme outil thérapeutique',
    technicalNames: ['Hypnose', 'Hypnothérapie', 'EMDR'],
    color: 'border-amber-200 text-amber-800',
    selectedColor: 'bg-amber-50 border-amber-400 text-amber-900',
  },
  {
    key: 'trauma',
    label: 'Trauma & EMDR',
    description: 'Je cherche un(e) spécialiste du trauma ou des séquelles d\'événements difficiles',
    technicalNames: ['EMDR', 'Psychotraumatologie', 'Trauma', 'ISTDP'],
    color: 'border-rose-200 text-rose-800',
    selectedColor: 'bg-rose-50 border-rose-400 text-rose-900',
  },
  {
    key: 'aucune',
    label: 'Je ne sais pas encore — guidez-moi',
    description: 'Je découvre la thérapie et je n\'ai pas de préférence',
    technicalNames: [],
    color: 'border-gray-200 text-gray-700',
    selectedColor: 'bg-gray-50 border-gray-400 text-gray-800',
  },
];

// ─── Badge couleurs approches (page résultats) ────────────────────────────────

const APPROACH_BADGE: Record<string, string> = {
  TCC: 'bg-blue-50 text-blue-700 border-blue-200',
  ACT: 'bg-teal-50 text-teal-700 border-teal-200',
  EMDR: 'bg-rose-50 text-rose-700 border-rose-200',
  Psychodynamique: 'bg-purple-50 text-purple-700 border-purple-200',
  Analytique: 'bg-purple-50 text-purple-700 border-purple-200',
  Psychanalyse: 'bg-purple-50 text-purple-700 border-purple-200',
  Systémique: 'bg-teal-50 text-teal-700 border-teal-200',
  Hypnose: 'bg-amber-50 text-amber-700 border-amber-200',
  Hypnothérapie: 'bg-amber-50 text-amber-700 border-amber-200',
  Psychotraumatologie: 'bg-rose-50 text-rose-700 border-rose-200',
};

// ─── Avatar ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
];

function getAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-[#F1F0F9] flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#F1F0F9] rounded w-40" />
          <div className="h-3 bg-[#F1F0F9] rounded w-24" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-[#F1F0F9] rounded w-32" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 w-14 bg-[#F1F0F9] rounded-full" />
          <div className="h-6 w-20 bg-[#F1F0F9] rounded-full" />
        </div>
        <div className="h-3 bg-[#F1F0F9] rounded w-full mt-2" />
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: MatchResult }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const name = result.psychologist.name;
  const avatarColor = getAvatarColor(name);
  const initials = getInitials(name);
  const bioTruncated = result.bio && result.bio.length > 200;
  const displayBio = result.bio && !bioExpanded && bioTruncated
    ? result.bio.slice(0, 200) + '…'
    : result.bio;

  const percent = Math.min(100, Math.max(0, Math.round(result.matchScore * 100)));

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div
          className={`h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${avatarColor}`}
          aria-hidden
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-playfair text-base font-semibold text-[#1E1B4B] leading-tight">
            {name}
          </h3>
          {result.psychologist.specialization && (
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {result.psychologist.specialization}
            </p>
          )}
          {/* Badges MonPsy / Visio */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {result.acceptsMonPsy && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
                <ShieldCheck size={11} aria-hidden />
                Remboursé SS — MonPsy
              </span>
            )}
            {result.offersVisio && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium">
                <Video size={11} aria-hidden />
                Séances en visio
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      {(result.city ?? result.department) && (
        <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
          <MapPin size={13} aria-hidden className="flex-shrink-0" />
          <span>{[result.city, result.department].filter(Boolean).join(' — ')}</span>
        </div>
      )}

      {/* Approaches */}
      {result.approaches.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.approaches.map((a) => (
            <span
              key={a}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                APPROACH_BADGE[a] ?? 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Specialties */}
      {result.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {result.specialties.map((s) => (
            <span key={s} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-[#F1F0F9] text-[#1E1B4B]">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Bio */}
      {result.bio && (
        <div className="mt-3">
          <p className="text-sm text-gray-500 leading-relaxed">{displayBio}</p>
          {bioTruncated && (
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="mt-1 flex items-center gap-1 text-xs text-[#3D52A0] hover:underline"
            >
              {bioExpanded ? <><ChevronUp size={12} /> Réduire</> : <><ChevronDown size={12} /> Lire plus</>}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-[#F1F0F9]">
        <div className="flex items-center gap-3">
          {result.acceptsReferrals ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Disponible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" aria-hidden />
              Liste d&apos;attente
            </span>
          )}
          <span className="text-xs text-gray-400">{percent}% compatible</span>
        </div>

        <Link
          href={`/psy/${result.psychologist.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3D52A0] text-white text-sm font-medium hover:bg-[#2d3f7c] transition-colors"
        >
          Voir le profil
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FindPsyContent() {
  const [step, setStep] = useState<'form' | 'results'>('form');
  const [form, setForm] = useState<SearchForm>({
    chips: [],
    freeText: '',
    approachKey: '',
    city: '',
    monPsy: false,
    visio: false,
  });
  const [results, setResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleChip = (chip: string) =>
    setForm((prev) => ({
      ...prev,
      chips: prev.chips.includes(chip)
        ? prev.chips.filter((c) => c !== chip)
        : [...prev.chips, chip],
    }));

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiBase = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
      const params = new URLSearchParams();

      // Combine chips + freeText as problematics
      const allText = [...form.chips, form.freeText.trim()].filter(Boolean).join(', ');
      if (allText) params.set('problematics', allText);

      // Map approach key to technical names
      const selected = APPROACH_OPTIONS.find((o) => o.key === form.approachKey);
      if (selected && selected.key !== 'aucune' && selected.technicalNames.length > 0) {
        selected.technicalNames.forEach((a) => params.append('approaches[]', a));
      }

      if (form.city.trim()) {
        const val = form.city.trim();
        if (/^\d{1,2}$|^2[AB]$/i.test(val)) params.set('department', val);
        else params.set('city', val);
      }

      if (form.monPsy) params.set('monPsy', 'true');
      if (form.visio) params.set('visio', 'true');

      const res = await fetch(`${apiBase}/api/v1/public/psy/match?${params.toString()}`);
      if (!res.ok) throw new Error('Erreur lors de la recherche. Veuillez réessayer.');

      const data = (await res.json()) as MatchResult[];
      setResults(data);
      setStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 1 — Form ──────────────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E1B4B] leading-tight tracking-tight">
              Trouvez le psychologue<br className="hidden sm:block" /> qui vous correspond
            </h1>
            <p className="mt-4 text-base md:text-lg text-gray-500 leading-relaxed">
              Répondez à quelques questions pour trouver le praticien adapté à votre situation.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-8 space-y-8">

            {/* ── Situation chips ──────────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#1E1B4B]">
                Comment vous sentez-vous en ce moment ?
                <span className="ml-1 text-xs font-normal text-gray-400">
                  Choisissez ce qui résonne (optionnel)
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {SITUATION_CHIPS.map((chip) => {
                  const sel = form.chips.includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-all ${
                        sel
                          ? 'bg-[#3D52A0] text-white border-[#3D52A0]'
                          : 'bg-white text-gray-600 border-[#E5E7EB] hover:border-[#3D52A0] hover:text-[#3D52A0]'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-1">
                <label htmlFor="freeText" className="block text-xs text-gray-400">
                  Autre chose à ajouter ? (optionnel)
                </label>
                <textarea
                  id="freeText"
                  rows={2}
                  value={form.freeText}
                  onChange={(e) => setForm((prev) => ({ ...prev, freeText: e.target.value }))}
                  placeholder="Ex : j'ai du mal depuis la naissance de mon enfant..."
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7FF] px-4 py-2.5 text-sm text-[#1E1B4B] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/30 focus:border-[#3D52A0] transition resize-none"
                />
              </div>
            </div>

            {/* ── Approach ─────────────────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#1E1B4B]">
                Quel style de suivi vous attire ?
                <span className="ml-1 text-xs font-normal text-gray-400">(optionnel)</span>
              </p>
              <div className="space-y-2">
                {APPROACH_OPTIONS.map((opt) => {
                  const sel = form.approachKey === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          approachKey: prev.approachKey === opt.key ? '' : opt.key,
                        }))
                      }
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        sel
                          ? `${opt.selectedColor} shadow-sm`
                          : 'bg-white border-[#E5E7EB] hover:border-[#3D52A0]/40'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[#1E1B4B]">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 italic">{opt.description}</p>
                      {sel && opt.technicalNames.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Correspond à : {opt.technicalNames.join(', ')}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── City ─────────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-semibold text-[#1E1B4B]">
                Votre ville ou code postal
              </label>
              <div className="relative">
                <MapPin
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  aria-hidden
                />
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Paris, Lyon, Nancy, 75000..."
                  className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F7FF] pl-10 pr-4 py-3 text-sm text-[#1E1B4B] placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3D52A0]/30 focus:border-[#3D52A0] transition"
                />
              </div>
            </div>

            {/* ── Options avancées ─────────────────────────────────────────── */}
            <div className="space-y-3 rounded-xl bg-[#F8F7FF] border border-[#E5E7EB] px-5 py-4">
              <p className="text-sm font-semibold text-[#1E1B4B]">Options</p>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={form.monPsy}
                    onChange={(e) => setForm((prev) => ({ ...prev, monPsy: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    form.monPsy ? 'bg-[#3D52A0] border-[#3D52A0]' : 'bg-white border-[#D1D5DB] group-hover:border-[#3D52A0]'
                  }`}>
                    {form.monPsy && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E1B4B] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-green-600" aria-hidden />
                    Dispositif MonPsy
                    <span className="text-xs font-normal bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Remboursé SS</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Uniquement les psys conventionnés au dispositif Mon soutien psy (8 séances remboursées par la Sécurité sociale sur prescription médicale)
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={form.visio}
                    onChange={(e) => setForm((prev) => ({ ...prev, visio: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    form.visio ? 'bg-[#3D52A0] border-[#3D52A0]' : 'bg-white border-[#D1D5DB] group-hover:border-[#3D52A0]'
                  }`}>
                    {form.visio && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1E1B4B] flex items-center gap-1.5">
                    <Video size={14} className="text-sky-600" aria-hidden />
                    Séances en visioconférence
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Je souhaite pouvoir faire mes séances en ligne depuis chez moi
                  </p>
                </div>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" aria-hidden />
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#3D52A0] text-white text-base font-semibold hover:bg-[#2d3f7c] transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" aria-hidden />Recherche en cours…</>
              ) : (
                <><Search size={18} aria-hidden />Trouver mon psy</>
              )}
            </button>

            <p className="text-center text-xs text-gray-400">
              Service gratuit et confidentiel · Aucun compte requis pour rechercher
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── Step 2 — Results ───────────────────────────────────────────────────────

  const selectedApproach = APPROACH_OPTIONS.find((o) => o.key === form.approachKey);

  return (
    <section className="py-12 md:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back + headline */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => { setStep('form'); setResults([]); }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#1E1B4B] transition-colors mb-4"
          >
            <ArrowLeft size={15} aria-hidden />
            Revenir à la recherche
          </button>

          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-[#1E1B4B]">
            {results.length === 0
              ? 'Aucun résultat'
              : `${results.length} psychologue${results.length > 1 ? 's' : ''} correspondent à votre recherche`}
          </h2>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400">
            {form.city && (
              <span className="flex items-center gap-1">
                <MapPin size={13} aria-hidden /> {form.city}
              </span>
            )}
            {selectedApproach && selectedApproach.key !== 'aucune' && (
              <><span>·</span><span>{selectedApproach.label}</span></>
            )}
            {form.monPsy && (
              <><span>·</span>
              <span className="text-green-600 flex items-center gap-1">
                <ShieldCheck size={13} aria-hidden /> MonPsy
              </span></>
            )}
            {form.visio && (
              <><span>·</span>
              <span className="text-sky-600 flex items-center gap-1">
                <Video size={13} aria-hidden /> Visio
              </span></>
            )}
          </div>
        </div>

        {/* Empty state */}
        {results.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-10 text-center">
            <div className="h-14 w-14 rounded-full bg-[#F1F0F9] flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" aria-hidden />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-[#1E1B4B] mb-2">
              Aucun psychologue trouvé
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
              Essayez d&apos;élargir vos critères : retirez l&apos;approche thérapeutique ou élargissez
              la zone géographique.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#1E1B4B] text-[#1E1B4B] text-sm font-medium hover:bg-[#1E1B4B] hover:text-white transition-colors"
              >
                Modifier les critères
              </button>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#3D52A0] text-white text-sm font-medium hover:bg-[#2d3f7c] transition-colors"
              >
                Contacter PsyLib
              </Link>
            </div>
          </div>
        )}

        {/* Results list */}
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}

            {/* MonPsy info banner si filtre actif */}
            {form.monPsy && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex gap-3">
                  <ShieldCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-green-800 mb-1">
                      Dispositif Mon soutien psy
                    </p>
                    <p className="text-xs text-green-700 leading-relaxed">
                      Ce dispositif permet de bénéficier de <strong>8 séances remboursées par an</strong> chez
                      un psychologue conventionné, sur prescription de votre médecin traitant. Le ticket modérateur
                      reste à votre charge (ou pris en charge par votre mutuelle). Votre médecin doit vous
                      adresser un <strong>courrier d&apos;orientation</strong> avant la première séance.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            <div className="mt-8 bg-[#F1F0F9] rounded-2xl border border-[#3D52A0]/20 p-6 text-center">
              <p className="text-sm font-medium text-[#1E1B4B] mb-1">
                Vous n&apos;avez pas trouvé le bon profil ?
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Notre équipe peut vous orienter vers un praticien adapté à votre situation.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#3D52A0] text-white text-sm font-medium hover:bg-[#2d3f7c] transition-colors"
              >
                Créer un compte pour être accompagné
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

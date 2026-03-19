'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Calculator, TrendingUp, Euro, AlertCircle,
  ChevronDown, ChevronUp, Download, ArrowRight, Info,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Inputs {
  sessionsPerWeek: number;
  sessionRate: number;
  vacationWeeks: number;
  regime: 'micro_bnc' | 'declaration_controlee';
  hasRoom: boolean;
  roomRent: number;
  hasAssistant: boolean;
  assistantCost: number;
  otherCharges: number;
}

interface Results {
  caAnnuel: number;
  caMensuel: number;
  // Charges
  urssafRate: number;
  urssaf: number;
  csgCrds: number;
  impotEstime: number;
  chargesDeductibles: number;
  totalCharges: number;
  // Net
  netAnnuel: number;
  netMensuel: number;
  netParSemaine: number;
  tauxCharges: number;
  // Seuils
  isAboveMicroSeuil: boolean;
}

// ─── Taux 2026 ─────────────────────────────────────────────────────────────────

const URSSAF_MICRO_RATE = 0.221; // BNC micro : 22,1% sur CA
const SEUIL_MICRO_BNC = 77700; // Seuil micro-BNC 2026
const IMPOT_FORFAIT_MICRO = 0.34; // abattement 34%, imposé sur 66% (approx)

function computeResults(inputs: Inputs): Results {
  const workingWeeks = 52 - inputs.vacationWeeks;
  const caAnnuel = inputs.sessionsPerWeek * inputs.sessionRate * workingWeeks;
  const caMensuel = caAnnuel / 12;

  const chargesDeductibles =
    (inputs.hasRoom ? inputs.roomRent * 12 : 0) +
    (inputs.hasAssistant ? inputs.assistantCost * 12 : 0) +
    inputs.otherCharges;

  let urssaf = 0;
  let csgCrds = 0;
  let impotEstime = 0;
  let totalCharges = 0;

  if (inputs.regime === 'micro_bnc') {
    // Micro-BNC : URSSAF = 22,1% du CA + versement libératoire impôt ≈ 2,2% optionnel
    // On suppose pas de versement libératoire (majorité des cas)
    urssaf = caAnnuel * URSSAF_MICRO_RATE;
    csgCrds = 0; // inclus dans l'URSSAF micro
    // Impôt : abattement 34% → base imposable = 66% du CA
    const baseImposable = caAnnuel * 0.66;
    // Tranche simplifiée : 0% < 11294€, 11% jusqu'à 28797€, 30% jusqu'à 82341€
    if (baseImposable <= 11294) {
      impotEstime = 0;
    } else if (baseImposable <= 28797) {
      impotEstime = (baseImposable - 11294) * 0.11;
    } else if (baseImposable <= 82341) {
      impotEstime = (28797 - 11294) * 0.11 + (baseImposable - 28797) * 0.30;
    } else {
      impotEstime = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (baseImposable - 82341) * 0.41;
    }
    totalCharges = urssaf + impotEstime;
  } else {
    // Déclaration contrôlée : URSSAF sur bénéfice net
    const beneficeNet = caAnnuel - chargesDeductibles;
    urssaf = Math.max(0, beneficeNet) * 0.40; // ~40% sur bénéfice net (retraite + maladie)
    csgCrds = Math.max(0, beneficeNet) * 0.097;
    // Impôt sur revenu (barème progressif sur bénéfice - charges sociales)
    const baseImposable = Math.max(0, beneficeNet - urssaf - csgCrds);
    if (baseImposable <= 11294) {
      impotEstime = 0;
    } else if (baseImposable <= 28797) {
      impotEstime = (baseImposable - 11294) * 0.11;
    } else if (baseImposable <= 82341) {
      impotEstime = (28797 - 11294) * 0.11 + (baseImposable - 28797) * 0.30;
    } else {
      impotEstime = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (baseImposable - 82341) * 0.41;
    }
    totalCharges = urssaf + csgCrds + impotEstime + chargesDeductibles;
  }

  const netAnnuel = caAnnuel - totalCharges;
  const netMensuel = netAnnuel / 12;
  const netParSemaine = netAnnuel / workingWeeks;
  const tauxCharges = caAnnuel > 0 ? (totalCharges / caAnnuel) * 100 : 0;

  return {
    caAnnuel, caMensuel, urssafRate: inputs.regime === 'micro_bnc' ? URSSAF_MICRO_RATE : 0.40,
    urssaf, csgCrds, impotEstime, chargesDeductibles,
    totalCharges, netAnnuel, netMensuel, netParSemaine,
    tauxCharges, isAboveMicroSeuil: caAnnuel > SEUIL_MICRO_BNC,
  };
}

// ─── Formatters ────────────────────────────────────────────────────────────────

function eur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function pct(n: number) {
  return `${Math.round(n)} %`;
}

// ─── Slider ────────────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, onChange, format, tooltip }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  tooltip?: string;
}) {
  const [showTip, setShowTip] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          {label}
          {tooltip && (
            <button
              type="button"
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
              onClick={() => setShowTip((v) => !v)}
              className="relative"
              aria-label="Info"
            >
              <Info size={13} className="text-gray-400" />
              {showTip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-10 shadow-lg">
                  {tooltip}
                </div>
              )}
            </button>
          )}
        </label>
        <span className="text-sm font-bold text-blue-600 tabular-nums">{format(value)}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-gray-200 cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

// ─── Result bar ────────────────────────────────────────────────────────────────

function ResultBar({ label, amount, color, pct: p }: { label: string; amount: number; color: string; pct: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold tabular-nums">{eur(amount)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(100, p)}%` }} />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function RevenueCalculator() {
  const [inputs, setInputs] = useState<Inputs>({
    sessionsPerWeek: 20,
    sessionRate: 80,
    vacationWeeks: 5,
    regime: 'micro_bnc',
    hasRoom: false,
    roomRent: 500,
    hasAssistant: false,
    assistantCost: 300,
    otherCharges: 1200,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const results = useMemo(() => computeResults(inputs), [inputs]);

  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  return (
    <>
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-800 transition-colors">Accueil</Link>
          <span>›</span>
          <Link href="/outils" className="hover:text-gray-800 transition-colors">Outils</Link>
          <span>›</span>
          <span className="text-gray-800 font-medium">Calculateur revenus</span>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Calculator size={14} />
            Outil gratuit — mis à jour 2026
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Simulez vos revenus de psychologue libéral
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Estimez votre chiffre d&apos;affaires, vos charges (URSSAF, impôts) et votre revenu net mensuel en quelques secondes.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* ── Inputs ── */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
              <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                Activité clinique
              </h2>

              <Slider
                label="Séances par semaine"
                value={inputs.sessionsPerWeek}
                min={5}
                max={40}
                step={1}
                onChange={(v) => set('sessionsPerWeek', v)}
                format={(v) => `${v} séances`}
                tooltip="Nombre moyen de séances facturées par semaine de travail"
              />
              <Slider
                label="Tarif par séance"
                value={inputs.sessionRate}
                min={50}
                max={200}
                step={5}
                onChange={(v) => set('sessionRate', v)}
                format={(v) => `${v} €`}
                tooltip="Tarif moyen en France : 70-120€. Paris : 90-150€"
              />
              <Slider
                label="Semaines de congés par an"
                value={inputs.vacationWeeks}
                min={0}
                max={12}
                step={1}
                onChange={(v) => set('vacationWeeks', v)}
                format={(v) => `${v} sem.`}
                tooltip="Vacances, formation, arrêts. Moyenne : 5-7 semaines"
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                <Euro size={16} className="text-blue-500" />
                Régime fiscal
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'micro_bnc', label: 'Micro-BNC', desc: `Jusqu'à ${eur(SEUIL_MICRO_BNC)}/an` },
                  { value: 'declaration_controlee', label: 'Déclaration contrôlée', desc: 'Charges réelles déductibles' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('regime', r.value as Inputs['regime'])}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      inputs.regime === r.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900">{r.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>

              {results.isAboveMicroSeuil && inputs.regime === 'micro_bnc' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  Votre CA estimé dépasse le seuil micro-BNC ({eur(SEUIL_MICRO_BNC)}). Vous serez basculé automatiquement en déclaration contrôlée.
                </div>
              )}
            </div>

            {/* Charges avancées */}
            {inputs.regime === 'declaration_controlee' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full flex items-center justify-between p-6 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center gap-2"><Euro size={16} className="text-blue-500" /> Charges déductibles</span>
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showAdvanced && (
                  <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-4">
                    <label className="flex items-center justify-between cursor-pointer select-none">
                      <span className="text-sm font-medium text-gray-700">Location cabinet</span>
                      <input
                        type="checkbox"
                        checked={inputs.hasRoom}
                        onChange={(e) => set('hasRoom', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                    </label>
                    {inputs.hasRoom && (
                      <Slider
                        label="Loyer mensuel cabinet"
                        value={inputs.roomRent}
                        min={100}
                        max={2000}
                        step={50}
                        onChange={(v) => set('roomRent', v)}
                        format={(v) => `${v} €/mois`}
                      />
                    )}
                    <label className="flex items-center justify-between cursor-pointer select-none">
                      <span className="text-sm font-medium text-gray-700">Secrétariat / assistant</span>
                      <input
                        type="checkbox"
                        checked={inputs.hasAssistant}
                        onChange={(e) => set('hasAssistant', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                    </label>
                    {inputs.hasAssistant && (
                      <Slider
                        label="Coût mensuel secrétariat"
                        value={inputs.assistantCost}
                        min={50}
                        max={1500}
                        step={50}
                        onChange={(v) => set('assistantCost', v)}
                        format={(v) => `${v} €/mois`}
                      />
                    )}
                    <Slider
                      label="Autres charges annuelles"
                      value={inputs.otherCharges}
                      min={0}
                      max={10000}
                      step={100}
                      onChange={(v) => set('otherCharges', v)}
                      format={(v) => `${v} €`}
                      tooltip="Logiciels, formations, téléphone, assurance RC Pro, supervision..."
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Results ── */}
          <div className="space-y-4">
            {/* CA card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <p className="text-blue-200 text-sm font-medium mb-1">Chiffre d&apos;affaires annuel</p>
              <p className="text-4xl font-bold tabular-nums">{eur(results.caAnnuel)}</p>
              <p className="text-blue-200 text-sm mt-1">soit {eur(results.caMensuel)} / mois</p>
              <p className="text-blue-300 text-xs mt-3 border-t border-blue-500 pt-3">
                {inputs.sessionsPerWeek} séances × {inputs.sessionRate}€ × {52 - inputs.vacationWeeks} semaines
              </p>
            </div>

            {/* Net card */}
            <div className="bg-white rounded-2xl border-2 border-green-200 p-6">
              <p className="text-gray-500 text-sm font-medium mb-1">Revenu net estimé</p>
              <p className="text-3xl font-bold text-green-600 tabular-nums">{eur(results.netMensuel)}<span className="text-lg text-gray-400 font-normal"> /mois</span></p>
              <p className="text-gray-500 text-sm mt-1">{eur(results.netAnnuel)} / an · {eur(results.netParSemaine)} / semaine</p>
            </div>

            {/* Détail charges */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm">Répartition</h3>
              <ResultBar
                label="Revenu net"
                amount={Math.max(0, results.netAnnuel)}
                color="bg-green-500"
                pct={results.caAnnuel > 0 ? (Math.max(0, results.netAnnuel) / results.caAnnuel) * 100 : 0}
              />
              <ResultBar
                label={inputs.regime === 'micro_bnc' ? 'Cotisations URSSAF' : 'URSSAF + CSG/CRDS'}
                amount={results.urssaf + results.csgCrds}
                color="bg-orange-400"
                pct={results.caAnnuel > 0 ? ((results.urssaf + results.csgCrds) / results.caAnnuel) * 100 : 0}
              />
              <ResultBar
                label="Impôt sur le revenu (estimé)"
                amount={results.impotEstime}
                color="bg-red-400"
                pct={results.caAnnuel > 0 ? (results.impotEstime / results.caAnnuel) * 100 : 0}
              />
              {inputs.regime === 'declaration_controlee' && results.chargesDeductibles > 0 && (
                <ResultBar
                  label="Charges professionnelles"
                  amount={results.chargesDeductibles}
                  color="bg-gray-300"
                  pct={results.caAnnuel > 0 ? (results.chargesDeductibles / results.caAnnuel) * 100 : 0}
                />
              )}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Taux de charges global</span>
                  <span className="font-semibold">{pct(results.tauxCharges)}</span>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <button
              type="button"
              onClick={() => setShowDisclaimer((v) => !v)}
              className="w-full flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
            >
              <Info size={11} className="flex-shrink-0" />
              <span className="text-left">Simulation indicative. Consulter un expert-comptable.</span>
              {showDisclaimer ? <ChevronUp size={11} className="flex-shrink-0 ml-auto" /> : <ChevronDown size={11} className="flex-shrink-0 ml-auto" />}
            </button>
            {showDisclaimer && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 leading-relaxed">
                Ce simulateur utilise les taux 2026 en vigueur (URSSAF micro-BNC 22,1%, déclaration contrôlée ~40%) et le barème de l&apos;impôt sur le revenu 2025. Les résultats sont des estimations indicatives. De nombreux facteurs peuvent modifier votre situation réelle : déductions spécifiques, situation familiale (quotient familial), versement libératoire de l&apos;impôt, exonérations ACRE... Consultez un expert-comptable spécialisé professions libérales pour un calcul précis.
              </p>
            )}
          </div>
        </div>

        {/* Explications */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Micro-BNC</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Régime simplifié jusqu&apos;à {eur(SEUIL_MICRO_BNC)}/an. Cotisations = 22,1% du CA brut.
              Abattement forfaitaire de 34% pour les charges. Idéal en début d&apos;activité ou faible CA.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Déclaration contrôlée</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Obligatoire au-delà de {eur(SEUIL_MICRO_BNC)}/an. Toutes les charges réelles sont déductibles
              (loyer, logiciel, formation, supervision...). Souvent plus avantageux avec un CA élevé.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Exonération TVA</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Les psychologues sont exonérés de TVA (art. 261-4-1° du CGI) pour leurs actes thérapeutiques.
              Vous ne facturez pas de TVA et ne la récupérez pas sur vos achats.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Combien gagne en moyenne un psychologue libéral en France ?',
                a: "Selon les données DREES, le revenu médian d'un psychologue libéral est d'environ 2 200 à 3 500 € nets/mois, mais il varie énormément selon la localisation (Paris vs province), les spécialités, l'ancienneté et le taux de remplissage du cabinet. Les praticiens les plus expérimentés avec un cabinet plein peuvent dépasser 5 000 €/mois nets.",
              },
              {
                q: 'Faut-il un comptable en tant que psychologue libéral ?',
                a: "En micro-BNC, la comptabilité est très simple (registre des recettes). En déclaration contrôlée, un expert-comptable spécialisé professions libérales est fortement recommandé pour optimiser vos charges déductibles et éviter les erreurs déclaratives.",
              },
              {
                q: 'Comment PsyLib aide-t-il la gestion financière ?',
                a: "PsyLib génère automatiquement les factures conformes (TVA 0%, numéro ADELI obligatoire), exporte les données pour votre comptable, et vous donne une vue en temps réel de vos revenus mensuel/annuel et de votre taux de remplissage.",
              },
            ].map((item, i) => (
              <details key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <summary className="p-5 cursor-pointer font-medium text-gray-900 text-sm hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                  {item.q}
                  <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">PsyLib gère votre administratif à votre place</h2>
          <p className="text-blue-100 mb-6 max-w-xl mx-auto">
            Facturation automatique, suivi des impayés, export comptable — pour vous concentrer sur vos patients.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-colors shadow-sm"
            >
              Essayer gratuitement 14 jours <ArrowRight size={15} />
            </Link>
            <Link
              href="/fonctionnalites/outcome-tracking"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-blue-400 text-white font-medium hover:bg-blue-600 transition-colors"
            >
              Voir toutes les fonctionnalités
            </Link>
          </div>
          <p className="text-blue-300 text-xs mt-4">Sans carte bancaire · Annulable à tout moment</p>
        </div>
      </main>
    </>
  );
}

import { Mic, Sparkles, FileText, Lock, Wand2, Check } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function ScribeMockup() {
  return (
    <div className="bg-white rounded-2xl border border-cream-200 shadow-lg overflow-hidden">
      {/* Recording bar */}
      <div className="bg-gradient-to-r from-terracotta to-terracotta-400 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Mic size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-medium leading-tight">Scribe IA actif</p>
            <p className="text-white/70 text-[11px] font-dm-mono">Consultation enregistrée — 48:12</p>
          </div>
        </div>
        {/* Waveform */}
        <div className="flex items-end gap-0.5 h-6" aria-hidden="true">
          {[8, 16, 11, 22, 14, 19, 9, 24, 13, 18, 7, 20].map((h, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-white/60"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      {/* Transform indicator */}
      <div className="flex items-center justify-center gap-2 py-3 bg-cream-50 border-b border-cream-100">
        <Wand2 size={14} className="text-terracotta" />
        <span className="text-xs text-charcoal-400 font-medium">
          Transcription + note clinique générées automatiquement
        </span>
      </div>

      {/* Generated note */}
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-sage" />
          <span className="text-sm font-semibold text-charcoal">Note de séance — proposition IA</span>
        </div>
        <div className="space-y-2.5">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-charcoal-300 font-medium mb-1">Motif</p>
            <div className="h-2 rounded-full bg-cream-200 w-11/12" />
            <div className="h-2 rounded-full bg-cream-200 w-3/4 mt-1.5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-charcoal-300 font-medium mb-1">Points abordés</p>
            <div className="h-2 rounded-full bg-cream-200 w-full" />
            <div className="h-2 rounded-full bg-cream-200 w-5/6 mt-1.5" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-charcoal-300 font-medium mb-1">Plan de suivi</p>
            <div className="h-2 rounded-full bg-sage-100 w-2/3" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-[11px] text-charcoal-400">
          <Lock size={11} className="text-sage" />
          Transcription chiffrée AES-256 — vous validez avant d&apos;enregistrer
        </div>
      </div>
    </div>
  );
}

export function ScribeSection() {
  return (
    <section id="scribe" className="bg-cream py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Mockup */}
          <ScrollReveal>
            <div className="hidden lg:block">
              <ScribeMockup />
            </div>
          </ScrollReveal>

          {/* Right — Text */}
          <ScrollReveal delay={200}>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-sm font-medium">
                <Sparkles size={14} />
                Nouveau — Plans Pro &amp; Clinic
              </div>

              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                Le scribe IA qui rédige{' '}
                <em className="not-italic text-terracotta">vos notes à votre place</em>
              </h2>

              <p className="text-charcoal-400 text-lg leading-relaxed">
                Activez le Scribe en téléconsultation : l&apos;audio est transcrit, puis une note de
                séance structurée vous est proposée à la fin de l&apos;appel. Vous relisez, ajustez,
                validez. Le temps de rédaction fond — la qualité reste la vôtre.
              </p>

              <ul className="space-y-3">
                {[
                  'Transcription automatique de la consultation visio',
                  'Note clinique structurée proposée — motif, points abordés, plan de suivi',
                  'Vous gardez toujours le dernier mot : rien n’est enregistré sans votre validation',
                  'Consentement patient explicite requis avant toute transcription',
                  'Transcription et note chiffrées AES-256-GCM, hébergées en France (HDS)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-charcoal-500">
                    <Check size={16} className="text-terracotta flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2 pt-2">
                {['Consentement explicite', 'Chiffré AES-256', 'Hébergé HDS France'].map((badge) => (
                  <span
                    key={badge}
                    className="text-xs px-3 py-1.5 rounded-full bg-terracotta-50 text-terracotta-700 border border-terracotta-200 font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

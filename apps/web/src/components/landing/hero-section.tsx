import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main mockup card */}
      <div className="animate-float bg-white rounded-2xl shadow-2xl border border-cream-200 overflow-hidden">
        {/* Top bar */}
        <div className="bg-cream-100 px-4 py-3 flex items-center gap-2 border-b border-cream-200">
          <div className="w-3 h-3 rounded-full bg-terracotta-300" />
          <div className="w-3 h-3 rounded-full bg-sage-300" />
          <div className="w-3 h-3 rounded-full bg-charcoal-200" />
          <span className="ml-2 text-xs text-charcoal-300 font-dm-mono">psylib.eu/dashboard</span>
        </div>

        {/* Dashboard content */}
        <div className="p-4 space-y-3">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Patients', value: '24', color: 'bg-sage-50 text-sage-700' },
              { label: 'Ce mois', value: '38', color: 'bg-terracotta-50 text-terracotta-700' },
              { label: 'PHQ-9 moy.', value: '8.2', color: 'bg-cream-100 text-charcoal-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} rounded-xl p-2 text-center`}>
                <div className="font-dm-mono font-medium text-lg leading-none">{value}</div>
                <div className="text-xs mt-1 opacity-70">{label}</div>
              </div>
            ))}
          </div>

          {/* Outcome chart mockup */}
          <div className="bg-cream-50 rounded-xl p-3">
            <div className="text-xs text-charcoal-400 mb-2">Évolution PHQ-9 — Marie B.</div>
            <svg viewBox="0 0 200 60" className="w-full h-12">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B9E87" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7B9E87" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,50 C20,48 40,42 60,35 C80,28 100,22 120,18 C140,14 160,12 180,8 L180,60 L0,60 Z"
                fill="url(#lineGrad)"
              />
              <path
                d="M0,50 C20,48 40,42 60,35 C80,28 100,22 120,18 C140,14 160,12 180,8"
                fill="none"
                stroke="#7B9E87"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {[
                [0, 50], [60, 35], [120, 18], [180, 8],
              ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="3" fill="#7B9E87" />
              ))}
            </svg>
          </div>

          {/* Patient list mockup */}
          <div className="space-y-2">
            {[
              { initials: 'MB', name: 'Marie B.', tag: 'TCC', color: 'bg-sage-100 text-sage-700' },
              { initials: 'PD', name: 'Pierre D.', tag: 'ACT', color: 'bg-terracotta-100 text-terracotta-700' },
            ].map(({ initials, name, tag, color }) => (
              <div key={name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream-50">
                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-xs font-medium`}>
                  {initials}
                </div>
                <span className="text-sm text-charcoal flex-1">{name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HDS badge */}
      <div className="absolute -bottom-3 -right-3 bg-white rounded-xl shadow-lg border border-sage-200 px-3 py-2 flex items-center gap-2">
        <Shield size={14} className="text-sage-600" />
        <span className="text-xs font-medium text-sage-700">Conformité HDS</span>
      </div>

      {/* Floating stat — Founders urgency */}
      <div className="absolute -top-4 -left-4 bg-terracotta text-white rounded-xl shadow-lg px-3 py-2">
        <div className="font-dm-mono font-medium text-lg leading-none">13/15</div>
        <div className="text-xs opacity-80">places restantes</div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative bg-warm-white pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(123, 158, 135, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(200, 149, 108, 0.1) 0%, transparent 40%)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <ScrollReveal>
            <div className="space-y-6">
              {/* Badge — Founders urgency */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-sm font-medium">
                <CheckCircle2 size={14} />
                Offre Fondateurs — 15 places à tarif gelé à vie
              </div>

              {/* H1 */}
              <h1 className="font-playfair text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal leading-tight tracking-tight">
                L'atelier numérique du{' '}
                <em className="not-italic text-sage">psychologue libéral</em>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-charcoal-400 leading-relaxed max-w-lg">
                Gérez votre cabinet sans la paperasse.{' '}
                <strong className="text-charcoal font-medium">Notes, patients, facturation, IA — tout en un, conforme HDS.</strong>
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/beta"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-terracotta text-white font-medium hover:bg-terracotta-600 transition-colors shadow-sm"
                >
                  Essai gratuit 14 jours
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border-2 border-charcoal text-charcoal font-medium hover:bg-charcoal hover:text-white transition-colors"
                >
                  Essai gratuit 14 jours
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 pt-2">
                {[
                  { value: '15', label: 'places Fondateurs' },
                  { value: '14j', label: 'essai gratuit' },
                  { value: 'HDS', label: 'certifié France' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="font-dm-mono font-medium text-xl text-charcoal">{value}</div>
                    <div className="text-xs text-charcoal-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Right — Mockup */}
          <div className="hidden lg:flex justify-center items-center py-8">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

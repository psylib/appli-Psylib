import { TrendingUp, Award } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function OutcomeChart() {
  const points: [number, number][] = [
    [0, 80], [40, 68], [80, 55], [120, 42], [160, 30], [200, 20],
  ];
  const pathD = points
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`;
      const prev = points[i - 1]!;
      return `C${x - 20},${prev[1]} ${x - 20},${y} ${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-charcoal">PHQ-9 — Marie B.</p>
          <p className="text-xs text-charcoal-300">Dépression — 6 mois de suivi</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-dm-mono font-medium text-sage">-60%</p>
          <p className="text-xs text-charcoal-300">score dépression</p>
        </div>
      </div>

      {/* Chart */}
      <svg viewBox="0 0 200 100" className="w-full h-32">
        <defs>
          <linearGradient id="outcomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7B9E87" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7B9E87" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Y-axis labels */}
        {[0, 27].map((val, i) => (
          <text
            key={val}
            x="0"
            y={i === 0 ? 8 : 95}
            fontSize="6"
            fill="#8E8E93"
            fontFamily="monospace"
          >
            {val}
          </text>
        ))}
        {/* Grid lines */}
        {[25, 50, 75].map((y) => (
          <line key={y} x1="12" y1={y} x2="200" y2={y} stroke="#E4EDE7" strokeWidth="0.5" strokeDasharray="3,3" />
        ))}
        {/* Area fill */}
        <path d={`${pathD} L200,100 L0,100 Z`} fill="url(#outcomeGrad)" />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#7B9E87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#7B9E87" stroke="white" strokeWidth="1.5" />
        ))}
        {/* Severity labels */}
        {[
          { y: 22, label: 'Sévère', color: '#EF4444' },
          { y: 47, label: 'Modéré', color: '#F97316' },
          { y: 72, label: 'Léger', color: '#F59E0B' },
        ].map(({ y, label, color }) => (
          <text key={label} x="14" y={y} fontSize="5" fill={color} opacity="0.7">
            {label}
          </text>
        ))}
      </svg>

      {/* Questionnaires */}
      <div className="flex gap-2 mt-4">
        {['PHQ-9', 'GAD-7', 'CORE-OM'].map((q) => (
          <span
            key={q}
            className="text-xs px-2.5 py-1 rounded-full bg-sage-50 text-sage-700 border border-sage-200 font-dm-mono"
          >
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}

export function OutcomeSection() {
  return (
    <section className="bg-warm-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Chart */}
          <ScrollReveal>
            <OutcomeChart />
          </ScrollReveal>

          {/* Right — Text */}
          <ScrollReveal delay={200}>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta-50 border border-terracotta-200 text-terracotta text-sm font-medium">
                <Award size={14} />
                Première plateforme FR avec Outcome Tracking
              </div>

              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                Mesurez les progrès,{' '}
                <em className="not-italic text-sage">prouvez la valeur</em>
              </h2>

              <p className="text-charcoal-400 text-lg leading-relaxed">
                Intégrez PHQ-9, GAD-7 et CORE-OM directement dans votre pratique. Visualisez l'évolution de chaque patient sur des graphiques cliniques clairs.
              </p>

              <ul className="space-y-3">
                {[
                  'Questionnaires validés scientifiquement',
                  'Passation en salle ou envoyée au patient',
                  'Graphiques d\'évolution automatiques',
                  'Export PDF pour le dossier patient',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-charcoal-500">
                    <TrendingUp size={16} className="text-sage flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

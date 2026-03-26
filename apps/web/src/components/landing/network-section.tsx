import { Search, Send, BookOpen } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const networkFeatures = [
  {
    icon: Search,
    title: 'Annuaire professionnel',
    description: 'Filtrez par spécialité, orientation thérapeutique, ville et disponibilité.',
  },
  {
    icon: Send,
    title: 'Adressage sécurisé',
    description: 'Envoyez un patient à un collègue avec une note d\'orientation chiffrée.',
  },
  {
    icon: BookOpen,
    title: 'Supervision & Intervision',
    description: 'Rejoignez ou créez des groupes de supervision. Sessions en ligne intégrées.',
  },
];

const mockPsys = [
  { initials: 'CM', name: 'Clara M.', spec: 'TCC', ville: 'Paris', color: 'bg-sage-100 text-sage-700' },
  { initials: 'AR', name: 'Antoine R.', spec: 'Systémique', ville: 'Lyon', color: 'bg-terracotta-100 text-terracotta-700' },
  { initials: 'SB', name: 'Sophie B.', spec: 'ACT', ville: 'Bordeaux', color: 'bg-cream-200 text-charcoal-500' },
  { initials: 'PL', name: 'Pierre L.', spec: 'Psychodyn.', ville: 'Marseille', color: 'bg-sage-100 text-sage-700' },
];

export function NetworkSection() {
  return (
    <section className="bg-sage-50/40 py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <ScrollReveal>
            <div className="space-y-6">
              <p className="text-sage text-sm font-medium tracking-widest uppercase">
                Réseau Pro
              </p>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                Votre réseau professionnel{' '}
                <em className="not-italic text-sage">sécurisé</em>
              </h2>
              <p className="text-charcoal-400 text-lg leading-relaxed">
                Trouvez un collègue pour un adressage, rejoignez des groupes d'intervision, collaborez en toute confidentialité. Tout reste confidentiel et chiffré.
              </p>

              <div className="space-y-4">
                {networkFeatures.map(({ icon: Icon, title, description }, i) => (
                  <ScrollReveal key={title} delay={(i + 1) * 120}>
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center">
                        <Icon size={18} className="text-sage-700" />
                      </div>
                      <div>
                        <h3 className="font-medium text-charcoal">{title}</h3>
                        <p className="text-sm text-charcoal-400 mt-0.5">{description}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Right — Network mockup */}
          <ScrollReveal delay={300}>
            <div className="bg-white rounded-2xl border border-sage-200 shadow-sm p-5">
              {/* Search bar mockup */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream-100 border border-cream-200 mb-5">
                <Search size={14} className="text-charcoal-300" />
                <span className="text-sm text-charcoal-300">Psychologue TCC disponible à Paris…</span>
              </div>

              {/* Filters */}
              <div className="flex gap-2 mb-4">
                {['TCC', 'Paris', 'Disponible'].map((f) => (
                  <span
                    key={f}
                    className="text-xs px-3 py-1 rounded-full bg-sage-50 text-sage-700 border border-sage-200"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Psy cards */}
              <div className="space-y-3">
                {mockPsys.map(({ initials, name, spec, ville, color }) => (
                  <div
                    key={name}
                    className="flex items-center gap-3 p-3 rounded-xl border border-cream-200 hover:border-sage-200 hover:bg-sage-50/30 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${color}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal">{name}</p>
                      <p className="text-xs text-charcoal-400">{spec} · {ville}</p>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-sage text-white">
                      Adresser
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

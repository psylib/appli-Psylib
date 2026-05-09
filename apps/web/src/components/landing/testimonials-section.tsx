import { Quote } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const testimonials = [
  {
    quote:
      "J'ai enfin un outil pensé pour ma pratique de psy, pas un logiciel médical générique. Les notes structurées et l'outcome tracking ont changé ma façon de suivre mes patients.",
    name: 'Pauline R.',
    role: 'Psychologue clinicienne',
    location: 'Paris',
    color: 'border-sage-200 bg-sage-50',
    quoteColor: 'text-sage',
  },
  {
    quote:
      "La conformité HDS était un vrai casse-tête. PsyLib gère tout — chiffrement, hébergement certifié, audit. Je me concentre sur mes patients, pas sur la paperasse RGPD.",
    name: 'Claire C.',
    role: 'Psychologue TCC',
    location: 'Lyon',
    color: 'border-terracotta-200 bg-terracotta-50',
    quoteColor: 'text-terracotta',
  },
  {
    quote:
      "L'espace patient avec le mood tracking est une vraie plus-value clinique. Mes patients s'impliquent plus entre les séances, et moi j'ai des données concrètes pour ajuster la prise en charge.",
    name: 'Annaëlle V.',
    role: 'Psychologue libérale',
    location: 'Bordeaux',
    color: 'border-cream-200 bg-cream-100',
    quoteColor: 'text-charcoal-500',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-warm-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">
              Témoignages
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Ils ont adopté PsyLib
            </h2>
            <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
              Des psychologues libéraux qui ont rejoint PsyLib dès sa création.
            </p>
          </div>
        </ScrollReveal>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(({ quote, name, role, location, color, quoteColor }, i) => (
            <ScrollReveal key={name} delay={i * 120}>
              <div className={`rounded-2xl border p-6 ${color} hover:shadow-md transition-shadow flex flex-col h-full`}>
                <Quote size={24} className={`${quoteColor} mb-4 opacity-60`} aria-hidden="true" />
                <blockquote className="text-charcoal-600 text-sm leading-relaxed flex-1 mb-6">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <div className="border-t border-black/5 pt-4">
                  <div className="font-semibold text-charcoal text-sm">{name}</div>
                  <div className="text-charcoal-400 text-xs">
                    {role} — {location}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

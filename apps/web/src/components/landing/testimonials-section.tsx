'use client';

import { Star } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const testimonials = [
  {
    initials: 'MD',
    name: 'Marie D.',
    role: 'Psychologue TCC · Paris',
    quote:
      'J\'ai enfin un outil qui parle le langage clinique. Les templates TCC et l\'outcome tracking ont transformé ma façon de documenter mes séances.',
    color: 'bg-sage-100 text-sage-700',
    rating: 5,
  },
  {
    initials: 'TL',
    name: 'Thomas L.',
    role: 'Psychologue systémique · Lyon',
    quote:
      'L\'outcome tracking a changé ma façon de suivre mes patients. Je peux maintenant montrer objectivement l\'évolution thérapeutique — c\'est précieux.',
    color: 'bg-terracotta-100 text-terracotta-700',
    rating: 5,
  },
  {
    initials: 'SR',
    name: 'Sophie R.',
    role: 'Psychologue ACT · Bordeaux',
    quote:
      'Le réseau pro m\'a permis de trouver un superviseur spécialisé ACT en 2 jours. Ce n\'était pas possible avant avec n\'importe quel autre outil.',
    color: 'bg-cream-200 text-charcoal-600',
    rating: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} étoiles sur 5`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="text-terracotta fill-terracotta" aria-hidden="true" />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();

  return (
    <section className="bg-warm-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        {/* Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">
            Témoignages
          </p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal">
            Ce qu'ils en disent
          </h2>
        </div>

        {/* Illustrative label */}
        <p className="text-center text-sm text-charcoal-400 italic mb-6">
          * Exemples illustratifs de cas d'usage
        </p>

        {/* Testimonials grid */}
        <div
          className="grid md:grid-cols-3 gap-6"
          data-nosnippet
          aria-label="Témoignages illustratifs"
        >
          {testimonials.map(({ initials, name, role, quote, color, rating }, i) => (
            <div
              key={name}
              className={`bg-white rounded-2xl border border-cream-200 p-6 hover:shadow-md transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <Stars count={rating} />
              <blockquote className="mt-4 mb-5 text-charcoal-500 text-sm leading-relaxed italic">
                "{quote}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${color}`}
                  aria-hidden="true"
                >
                  {initials}
                </div>
                <div>
                  <p className="font-medium text-charcoal text-sm">{name}</p>
                  <p className="text-xs text-charcoal-300">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

'use client';

import { XCircle } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const painPoints = [
  {
    tool: 'Doctolib',
    description: 'Agenda uniquement. Zéro outil clinique, zéro outcome tracking, zéro réseau professionnel.',
    price: '129€/mois',
  },
  {
    tool: 'Tableurs Excel',
    description: 'Non sécurisés, non conformes HDS. Une CNIL peut coûter jusqu\'à 20M€ ou 4% du CA.',
    price: 'Gratuit… mais illégal',
  },
  {
    tool: 'Outils US',
    description: 'SimplePractice, Therapy Brands : excellents, mais incompatibles RGPD et non certifiés HDS France.',
    price: '60–120$/mois',
  },
];

export function PainPointsSection() {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();

  return (
    <section className="bg-charcoal py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        {/* Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">
            Le problème
          </p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white">
            Ce que les autres outils ne font pas
          </h2>
        </div>

        {/* Pain points grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {painPoints.map(({ tool, description, price }, i) => (
            <div
              key={tool}
              className={`group rounded-2xl border border-charcoal-600 bg-charcoal-700/50 p-6 transition-all duration-700 hover:border-charcoal-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="flex items-start gap-3 mb-4">
                <XCircle
                  size={20}
                  className="text-red-400 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="font-semibold text-white text-lg">{tool}</h3>
                  <span className="text-xs text-charcoal-300 font-dm-mono">{price}</span>
                </div>
              </div>
              <p className="text-charcoal-200 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Conclusion */}
        <div
          className={`mt-10 text-center transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-sage-300 text-lg font-medium">
            PsyLib est la première plateforme française spécifiquement conçue pour les psys libéraux.
          </p>
        </div>
      </div>
    </section>
  );
}

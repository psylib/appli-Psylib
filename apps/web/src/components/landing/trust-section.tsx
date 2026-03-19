'use client';

import { Shield, Lock, Flag, MapPin } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const trustBadges = [
  {
    icon: Shield,
    title: 'Hébergement HDS',
    description: 'OVH HDS certifié Hébergeur de Données de Santé',
    color: 'text-sage bg-sage-50 border-sage-200',
  },
  {
    icon: Lock,
    title: 'Chiffrement AES-256',
    description: 'Toutes les données cliniques chiffrées avec AES-256-GCM côté serveur',
    color: 'text-terracotta bg-terracotta-50 border-terracotta-200',
  },
  {
    icon: Flag,
    title: 'RGPD conforme',
    description: 'Consentements, droit à l\'oubli, portabilité des données — tout est implémenté',
    color: 'text-charcoal bg-charcoal-100 border-charcoal-200',
  },
  {
    icon: MapPin,
    title: 'Données en France',
    description: 'Aucune donnée patient ne quitte le territoire français. Jamais.',
    color: 'text-sage bg-sage-50 border-sage-200',
  },
];

export function TrustSection() {
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();

  return (
    <section id="trust" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6" ref={ref}>
        {/* Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">
            Conformité & Sécurité
          </p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal mb-4">
            La conformité HDS n'est pas une option
          </h2>
          <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
            En France, stocker des données de santé sur une infrastructure non certifiée HDS est une infraction. PsyLib est la seule plateforme psy conçue de zéro pour respecter ce cadre légal.
          </p>
        </div>

        {/* Badges */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {trustBadges.map(({ icon: Icon, title, description, color }, i) => (
            <div
              key={title}
              className={`rounded-2xl border p-5 transition-all duration-700 ${color} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <Icon size={24} className="mb-3" aria-hidden="true" />
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs leading-relaxed opacity-80">{description}</p>
            </div>
          ))}
        </div>

        {/* Testimonial quote */}
        <div
          className={`max-w-2xl mx-auto text-center transition-all duration-700 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <blockquote className="font-playfair text-xl text-charcoal italic leading-relaxed mb-4">
            "Enfin un outil qui prend la conformité HDS au sérieux. En tant que psychologue, je ne peux pas me permettre de prendre des risques avec les données de mes patients."
          </blockquote>
          <cite className="not-italic">
            <span className="font-medium text-charcoal">Dr. Isabelle M.</span>
            <span className="text-charcoal-300 text-sm"> — Psychologue clinicienne, Paris</span>
          </cite>

          {/* Provider logos */}
          <div className="flex items-center justify-center gap-8 mt-8 pt-8 border-t border-cream-200">
            <div className="text-center">
              <div className="text-xs text-charcoal-300 mb-1">Hébergement certifié</div>
              <div className="flex items-center gap-3">
                <span className="font-dm-mono text-sm font-medium text-charcoal-400 px-3 py-1 rounded-lg border border-charcoal-200">OVH HDS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

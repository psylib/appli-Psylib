'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const plans = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    description: 'Pour découvrir PsyLib',
    features: [
      'Patients illimités',
      'Séances illimitées',
      'Notes cliniques',
      'Comptabilité intégrée',
      'Chiffrement HDS',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    name: 'Solo',
    monthly: 25,
    annual: 22,
    description: 'Idéal pour démarrer',
    features: [
      'Patients illimités',
      'Séances illimitées',
      '10 résumés IA / mois',
      'Visio illimitée',
      'Comptabilité intégrée',
      'Agenda & rappels SMS/email',
      'Facturation PDF',
    ],
    cta: 'Commencer maintenant',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthly: 40,
    annual: 36,
    description: 'Pour une pratique complète',
    features: [
      'Patients illimités',
      'Séances illimitées',
      'IA illimitée + AI Scribe',
      'Visio illimitée',
      'Comptabilité intégrée',
      'Portail patient',
      'Outcome Tracking (PHQ-9, GAD-7…)',
      'Paiement en ligne Stripe',
      'Support prioritaire',
    ],
    cta: 'Commencer maintenant',
    highlighted: true,
    badge: 'Recommandé',
  },
  {
    name: 'Clinic',
    monthly: 79,
    annual: 69,
    description: 'Cabinet multi-praticiens',
    features: [
      'Tout le plan Pro',
      'Comptabilité intégrée',
      'Multi-praticiens illimité',
      'Analytics avancées',
      'Accès API',
      'Onboarding dédié',
    ],
    cta: 'Contacter l\'équipe',
    highlighted: false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="bg-cream py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-10">
            <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">
              Tarifs
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Simple et transparent
            </h2>
            <p className="text-charcoal-400 text-lg mb-6">
              Plan gratuit pour toujours — aucune carte bancaire requise.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-full bg-white border border-cream-200">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !annual ? 'bg-charcoal text-white shadow-sm' : 'text-charcoal-400 hover:text-charcoal'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  annual ? 'bg-charcoal text-white shadow-sm' : 'text-charcoal-400 hover:text-charcoal'
                }`}
              >
                Annuel
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-sage text-white font-medium">
                  Économisez
                </span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map(({ name, monthly, annual: annualPrice, description, features, cta, highlighted, badge }, i) => {
            const price = annual ? annualPrice : monthly;
            return (
              <ScrollReveal key={name} delay={i * 100}>
                <div
                  className={`relative rounded-2xl p-6 flex flex-col h-full ${
                    highlighted
                      ? 'bg-charcoal text-white shadow-xl ring-2 ring-charcoal scale-105'
                      : 'bg-white border border-cream-200 hover:shadow-md transition-shadow'
                  }`}
                >
                  {badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-terracotta text-white text-xs font-medium">
                      {badge}
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className={`font-semibold text-lg ${highlighted ? 'text-white' : 'text-charcoal'}`}>
                      {name}
                    </h3>
                    <p className={`text-sm mt-1 ${highlighted ? 'text-charcoal-200' : 'text-charcoal-400'}`}>
                      {description}
                    </p>
                    <div className="mt-4 flex items-end gap-1">
                      <span className={`font-dm-mono text-4xl font-bold ${highlighted ? 'text-white' : 'text-charcoal'}`}>
                        {price === 0 ? 'Gratuit' : `${price}€`}
                      </span>
                      {price > 0 && (
                        <span className={`text-sm mb-1 ${highlighted ? 'text-charcoal-200' : 'text-charcoal-400'}`}>
                          /mois
                        </span>
                      )}
                    </div>
                    {annual && price > 0 && (
                      <p className={`text-xs mt-1 ${highlighted ? 'text-charcoal-200' : 'text-charcoal-400'}`}>
                        Facturé {price * 12}€ / an
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-6">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check
                          size={15}
                          className={`mt-0.5 flex-shrink-0 ${highlighted ? 'text-sage-300' : 'text-sage'}`}
                        />
                        <span className={`text-sm ${highlighted ? 'text-charcoal-100' : 'text-charcoal-500'}`}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`block w-full text-center py-3 rounded-full font-medium text-sm transition-colors ${
                      highlighted
                        ? 'bg-terracotta text-white hover:bg-terracotta-600'
                        : 'bg-charcoal text-white hover:bg-charcoal-700'
                    }`}
                  >
                    {cta}
                  </Link>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={400}>
          <p className="text-center text-sm text-charcoal-400 mt-6">
            Annulez à tout moment. Sans engagement.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

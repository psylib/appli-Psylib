'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const plans = [
  {
    name: 'Starter',
    monthly: 43,
    annual: 40,
    description: 'Idéal pour démarrer',
    features: [
      '40 patients',
      '40 séances / mois',
      '10 résumés IA / mois',
      'Notes structurées',
      'Agenda & rappels SMS/email',
      'Conformité HDS',
    ],
    cta: 'Démarrer gratuitement',
    highlighted: false,
  },
  {
    name: 'Pro',
    monthly: 69,
    annual: 65,
    description: 'Pour une pratique complète',
    features: [
      'Patients illimités',
      'Séances illimitées',
      '100 résumés IA / mois',
      'Outcome Tracking (PHQ-9, GAD-7…)',
      'Réseau Professionnel',
      'Templates tous orientations',
      'Paiement en ligne Stripe',
      'Liste d\'attente automatisée',
      'Facturation PDF',
      'Support prioritaire',
    ],
    cta: 'Démarrer gratuitement',
    highlighted: true,
    badge: 'Recommandé',
  },
  {
    name: 'Scale',
    monthly: 119,
    annual: 110,
    description: 'Cabinet multi-praticiens',
    features: [
      'Tout le plan Pro',
      'Multi-praticiens illimité',
      'IA illimitée',
      'Supervision en ligne',
      'Analytics cabinet',
      'Onboarding dédié',
      'SLA 99,9%',
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
              Essai gratuit 14 jours — aucune carte bancaire requise.
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
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
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
                        {price}€
                      </span>
                      <span className={`text-sm mb-1 ${highlighted ? 'text-charcoal-200' : 'text-charcoal-400'}`}>
                        /mois
                      </span>
                    </div>
                    {annual && (
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

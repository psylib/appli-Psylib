'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

const faqs = [
  {
    q: 'PsyLib est-il conforme HDS ?',
    a: 'Oui. PsyLib est hébergé sur OVH HDS, certifié Hébergeur de Données de Santé au sens du Code de la santé publique. Toutes les données cliniques sont chiffrées avec AES-256-GCM.',
  },
  {
    q: 'Puis-je importer mes patients existants ?',
    a: 'Oui. PsyLib supporte l\'import CSV et l\'export depuis Doctolib. Un assistant d\'import vous guide pas à pas avec prévisualisation avant confirmation.',
  },
  {
    q: 'Qu\'est-ce que l\'Outcome Tracking ?',
    a: 'L\'Outcome Tracking permet de mesurer objectivement l\'évolution thérapeutique via des questionnaires validés scientifiquement : PHQ-9 (dépression), GAD-7 (anxiété), CORE-OM (bien-être général). Les résultats sont visualisés sous forme de graphiques d\'évolution.',
  },
  {
    q: 'Comment fonctionne l\'essai gratuit ?',
    a: '14 jours d\'accès complet au plan Pro — sans carte bancaire. À la fin de l\'essai, vous choisissez votre plan ou votre compte est simplement désactivé. Vos données restent exportables pendant 30 jours.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement et sans frais. L\'annulation est immédiate depuis les paramètres de votre compte. Vous conservez l\'accès jusqu\'à la fin de la période payée.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Toutes les données cliniques (notes, résumés, bilans) sont chiffrées avec AES-256-GCM côté serveur avant stockage. Les transmissions utilisent TLS 1.3. Aucune donnée patient ne quitte la France ni n\'est transmise à des tiers sans votre consentement explicite.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  const { ref, isVisible } = useIntersectionObserver<HTMLDivElement>();

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6" ref={ref}>
        {/* Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
          }`}
        >
          <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal">
            Questions fréquentes
          </h2>
        </div>

        {/* Accordion */}
        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-700 ${
                  isOpen ? 'border-sage-200 bg-sage-50/30' : 'border-cream-200 bg-white hover:border-sage-200'
                } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-charcoal text-sm">{q}</span>
                  {isOpen ? (
                    <Minus size={16} className="flex-shrink-0 text-sage" />
                  ) : (
                    <Plus size={16} className="flex-shrink-0 text-charcoal-300" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-charcoal-400 leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

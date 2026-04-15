'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

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
    q: 'Comment fonctionne le paiement en ligne ?',
    a: 'PsyLib est intégré avec Stripe Connect. Vous activez le paiement en ligne en 3 minutes depuis vos paramètres, et vos patients peuvent régler leur consultation directement lors de la réservation sur votre page publique. Les fonds arrivent sur votre compte bancaire sous 2 jours ouvrés. Divise les no-show par 3.',
  },
  {
    q: 'PsyLib gère-t-il Mon Soutien Psy ?',
    a: 'Oui. PsyLib suit automatiquement les 12 séances annuelles du dispositif Mon Soutien Psy par patient, avec alerte lorsque le quota approche (10/12). Vous configurez le tarif conventionné (50€) et le motif dédié en 1 clic depuis les motifs de consultation.',
  },
  {
    q: 'Comment fonctionne le plan gratuit ?',
    a: 'Le plan Free est gratuit pour toujours, sans carte bancaire. Il inclut 10 patients et 20 sessions par mois. Passez à un plan payant quand vous le souhaitez. Vos données restent exportables à tout moment.',
  },
  {
    q: 'Puis-je annuler à tout moment ?',
    a: 'Oui, sans engagement et sans frais. L\'annulation est immédiate depuis les paramètres de votre compte. Vous conservez l\'accès jusqu\'à la fin de la période payée.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Toutes les données cliniques (notes, résumés, bilans) sont chiffrées avec AES-256-GCM côté serveur avant stockage. Les transmissions utilisent TLS 1.3. Aucune donnée patient ne quitte la France ni n\'est transmise à des tiers sans votre consentement explicite.',
  },
  {
    q: 'PsyLib propose-t-il la téléconsultation ?',
    a: 'Oui. PsyLib intègre la visio-consultation HD, hébergée sur infrastructure HDS certifiée en France. Pas besoin de Zoom ou Google Meet — tout se passe dans PsyLib. Lien unique envoyé au patient, prise de notes pendant la consultation. Disponible sur les plans Pro et Clinic.',
  },
  {
    q: 'Comment fonctionne l\'espace patient ?',
    a: 'Chaque patient invité reçoit un espace personnel sécurisé : suivi d\'humeur quotidien (échelle 1-10), journal thérapeutique (privé ou partagé avec le psy), et exercices assignés (manuels ou générés par IA). Le praticien visualise l\'évolution entre les séances directement dans son dashboard.',
  },
  {
    q: 'Les factures sont-elles générées automatiquement ?',
    a: 'Oui. Après chaque séance marquée comme payée ou après un paiement Stripe, PsyLib génère automatiquement une facture PDF avec numérotation séquentielle et TVA 0% (exonération psychologue). Configurable dans Paramètres > Cabinet.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal">
              Questions fréquentes
            </h2>
          </div>
        </ScrollReveal>

        {/* Accordion */}
        <div className="space-y-2">
          {faqs.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <ScrollReveal key={i} delay={i * 60}>
                <div
                  className={`rounded-2xl border transition-colors ${
                    isOpen ? 'border-sage-200 bg-sage-50/30' : 'border-cream-200 bg-white hover:border-sage-200'
                  }`}
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
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

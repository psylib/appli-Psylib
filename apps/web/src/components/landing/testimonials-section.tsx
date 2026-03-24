import { FileText, BarChart3, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const useCases = [
  {
    icon: FileText,
    title: 'Notes cliniques simplifiées',
    description:
      'Rédigez vos comptes-rendus de séance avec un éditeur pensé pour la pratique clinique. Autosave, templates TCC/ACT/systémique, et résumé IA optionnel.',
    color: 'bg-sage-50 border-sage-200 text-sage-700',
    iconColor: 'text-sage',
  },
  {
    icon: BarChart3,
    title: 'Suivi thérapeutique objectif',
    description:
      'Visualisez l\'évolution de vos patients grâce au mood tracking et aux indicateurs de progression. Des données concrètes pour guider vos décisions cliniques.',
    color: 'bg-terracotta-50 border-terracotta-200 text-terracotta-700',
    iconColor: 'text-terracotta',
  },
  {
    icon: ShieldCheck,
    title: 'Zéro compromis sur la sécurité',
    description:
      'Hébergement HDS, chiffrement AES-256, authentification forte — vos données patients sont protégées selon les standards les plus exigeants du secteur santé.',
    color: 'bg-cream-100 border-cream-200 text-charcoal-600',
    iconColor: 'text-charcoal-500',
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
              Pourquoi PsyLib
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Conçu par et pour les psychologues
            </h2>
            <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
              Chaque fonctionnalité a été pensée pour répondre aux réalités du cabinet libéral — documentation clinique, suivi patient et conformité légale.
            </p>
          </div>
        </ScrollReveal>

        {/* Use cases grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map(({ icon: Icon, title, description, color, iconColor }, i) => (
            <ScrollReveal key={title} delay={i * 120}>
              <div className={`rounded-2xl border p-6 ${color} hover:shadow-md transition-shadow`}>
                <Icon size={28} className={`${iconColor} mb-4`} aria-hidden="true" />
                <h3 className="font-semibold text-charcoal text-base mb-2">{title}</h3>
                <p className="text-charcoal-500 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

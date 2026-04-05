import {
  FileText,
  TrendingUp,
  Users,
  Sparkles,
  CreditCard,
  Shield,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const features = [
  {
    icon: FileText,
    title: 'Notes cliniques structurées',
    description: 'Templates par orientation : TCC, Psychodynamique, Systémique, ACT. Vos notes enfin adaptées à votre pratique.',
    color: 'text-sage bg-sage-50',
    border: 'border-sage-200',
  },
  {
    icon: TrendingUp,
    title: 'Outcome Tracking',
    description: 'PHQ-9, GAD-7, CORE-OM intégrés. Mesurez l\'évolution de chaque patient sur des graphiques cliniques clairs.',
    color: 'text-terracotta bg-terracotta-50',
    border: 'border-terracotta-200',
  },
  {
    icon: Users,
    title: 'Réseau Professionnel',
    description: 'Réseau psy-to-psy sécurisé. Adressage de patients, groupes d\'intervision, supervision en ligne.',
    color: 'text-sage bg-sage-50',
    border: 'border-sage-200',
  },
  {
    icon: Sparkles,
    title: 'Assistant IA',
    description: 'Résumés de séance, suggestions d\'exercices thérapeutiques. L\'IA reste un outil — vous restez le praticien.',
    color: 'text-terracotta bg-terracotta-50',
    border: 'border-terracotta-200',
  },
  {
    icon: CreditCard,
    title: 'Paiements & zéro no-show',
    description: 'Paiement Stripe à la réservation, rappels SMS/email automatiques, liste d\'attente qui fait tourner les annulations. Vos séances se remplissent toutes seules.',
    color: 'text-sage bg-sage-50',
    border: 'border-sage-200',
  },
  {
    icon: Shield,
    title: 'Conformité HDS totale',
    description: 'Hébergement OVH HDS certifié. Chiffrement AES-256-GCM. RGPD. La seule plateforme légalement conforme.',
    color: 'text-charcoal bg-charcoal-100',
    border: 'border-charcoal-200',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-cream py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">
              Fonctionnalités
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-charcoal-400 text-lg max-w-xl mx-auto">
              Conçu avec et pour des psychologues libéraux. Chaque fonctionnalité répond à un besoin réel de votre pratique.
            </p>
          </div>
        </ScrollReveal>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description, color, border }, i) => (
            <ScrollReveal key={title} delay={i * 80}>
              <div className={`group rounded-2xl bg-white border ${border} p-6 hover:shadow-md transition-shadow`}>
                <div className={`inline-flex p-2.5 rounded-xl ${color} mb-4`}>
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-charcoal text-lg mb-2">{title}</h3>
                <p className="text-charcoal-400 text-sm leading-relaxed">{description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

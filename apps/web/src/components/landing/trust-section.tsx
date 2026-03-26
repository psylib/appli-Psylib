import { Shield, Lock, Flag, MapPin } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

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
  return (
    <section id="trust" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
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
        </ScrollReveal>

        {/* Badges */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {trustBadges.map(({ icon: Icon, title, description, color }, i) => (
            <ScrollReveal key={title} delay={i * 80}>
              <div className={`rounded-2xl border p-5 ${color}`}>
                <Icon size={24} className="mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                <p className="text-xs leading-relaxed opacity-80">{description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Provider logos */}
        <ScrollReveal delay={400}>
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-xs text-charcoal-400 mb-1">Hébergement certifié</div>
                <div className="flex items-center gap-3">
                  <span className="font-dm-mono text-sm font-medium text-charcoal-400 px-3 py-1 rounded-lg border border-charcoal-200">OVH HDS</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

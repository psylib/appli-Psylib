import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function CTASection() {
  return (
    <section className="bg-sage py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <ScrollReveal>
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium">
              <CheckCircle2 size={14} />
              Offre Fondateurs — places limitées
            </div>

            {/* Heading */}
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white leading-tight">
              Commencez gratuitement. Evoluez quand vous etes pret.
            </h2>

            <p className="text-sage-100 text-lg">
              Plan Free pour toujours. Solo a 29€/mois. Pro a 59€/mois avec IA illimitee.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <Link
                href="/beta"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-terracotta text-white font-medium text-sm hover:bg-terracotta-600 transition-colors shadow-sm"
              >
                Devenir Fondateur
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/20 text-white font-medium text-sm hover:bg-white/30 transition-colors"
              >
                Essai gratuit 14 jours
              </Link>
            </div>

            {/* RGPD */}
            <p className="text-sage-200 text-xs">
              En vous inscrivant, vous acceptez notre{' '}
              <Link href="/privacy" className="underline hover:text-white transition-colors">
                politique de confidentialité
              </Link>
              . Vos données restent en France, conformément au RGPD.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

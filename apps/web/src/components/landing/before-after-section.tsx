import { ScrollReveal } from '@/components/ui/scroll-reveal';

const comparison = [
  {
    before: 'Notes de séance sur papier ou Word, non sécurisées',
    after: 'Notes cliniques structurées (SOAP/DAP), chiffrées AES-256, conformes HDS',
  },
  {
    before: 'Tableur Excel pour suivre les patients et la facturation',
    after: 'Dossiers patients, facturation PDF et analytics intégrés',
  },
  {
    before: 'Aucune mesure objective de progression thérapeutique',
    after: 'Outcome tracking PHQ-9, GAD-7, CORE-OM avec graphiques',
  },
  {
    before: 'Réseau professionnel limité aux connaissances directes',
    after: 'Annuaire de psychologues, adressage et supervision en ligne',
  },
  {
    before: 'Patient sans visibilité entre les séances',
    after: 'Espace patient : mood tracking, exercices, messagerie sécurisée',
  },
];

export function BeforeAfterSection() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-sage text-sm font-medium tracking-widest uppercase mb-3">
              Avant / Après
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal">
              Ce qui change avec PsyLib
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {comparison.map(({ before, after }, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <div className="grid md:grid-cols-2 gap-0 rounded-xl overflow-hidden border border-cream-200">
                <div className="bg-red-50/50 p-5 flex items-start gap-3">
                  <span className="mt-0.5 text-red-400 font-bold text-sm shrink-0">Avant</span>
                  <p className="text-sm text-charcoal-500 leading-relaxed">{before}</p>
                </div>
                <div className="bg-emerald-50/50 p-5 flex items-start gap-3 border-t md:border-t-0 md:border-l border-cream-200">
                  <span className="mt-0.5 text-emerald-500 font-bold text-sm shrink-0">Après</span>
                  <p className="text-sm text-charcoal-600 leading-relaxed font-medium">{after}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

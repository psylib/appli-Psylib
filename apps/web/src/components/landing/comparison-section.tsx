import { Check, X, Minus } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

type CellValue = 'yes' | 'no' | 'partial';

const rows: { feature: string; psylib: CellValue; generic: CellValue; files: CellValue }[] = [
  { feature: 'Outcome Tracking (PHQ-9, GAD-7)', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Templates notes par orientation', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Réseau psy-à-psy & adressages', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Matching patient public', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Hébergement HDS France', psylib: 'yes', generic: 'partial', files: 'no' },
  { feature: 'Notes cliniques structurées', psylib: 'yes', generic: 'no', files: 'partial' },
  { feature: 'Paiement Stripe à la réservation', psylib: 'yes', generic: 'partial', files: 'no' },
  { feature: 'Rappels SMS & email automatiques', psylib: 'yes', generic: 'yes', files: 'no' },
  { feature: 'Liste d\'attente automatisée', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Suivi Mon Soutien Psy (12 séances)', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Facturation PDF', psylib: 'yes', generic: 'partial', files: 'no' },
  { feature: 'Assistant IA (résumés séances)', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Visio-consultation intégrée HDS', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Espace patient (humeur, journal, exercices)', psylib: 'yes', generic: 'no', files: 'no' },
  { feature: 'Factures PDF automatiques', psylib: 'yes', generic: 'partial', files: 'no' },
  { feature: 'Comptabilité intégrée (recettes, dépenses, FEC, 2035)', psylib: 'yes', generic: 'no', files: 'no' },
];

function Cell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === 'yes') {
    return (
      <td className={`py-3 px-4 text-center ${highlight ? 'bg-sage-50/60' : ''}`}>
        <Check size={16} className="text-sage mx-auto" aria-label="Oui" />
      </td>
    );
  }
  if (value === 'partial') {
    return (
      <td className={`py-3 px-4 text-center ${highlight ? 'bg-sage-50/60' : ''}`}>
        <Minus size={16} className="text-terracotta-400 mx-auto" aria-label="Partiel" />
      </td>
    );
  }
  return (
    <td className={`py-3 px-4 text-center ${highlight ? 'bg-sage-50/60' : ''}`}>
      <X size={16} className="text-charcoal-200 mx-auto" aria-label="Non" />
    </td>
  );
}

export function ComparisonSection() {
  return (
    <section className="bg-cream py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-terracotta text-sm font-medium tracking-widest uppercase mb-3">
              Comparatif
            </p>
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal mb-4">
              Pourquoi PsyLib plutôt qu'un outil générique ?
            </h2>
            <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
              Les agendas médicaux généralistes ne sont pas conçus pour la spécificité de la pratique
              psychologique.
            </p>
          </div>
        </ScrollReveal>

        {/* Table */}
        <ScrollReveal delay={200}>
          <div className="overflow-x-auto rounded-2xl border border-cream-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-charcoal text-white">
                  <th className="py-4 px-4 text-left font-medium w-[45%]">Fonctionnalité</th>
                  <th className="py-4 px-4 text-center font-medium text-sage-300">PsyLib</th>
                  <th className="py-4 px-4 text-center font-medium text-charcoal-200">Agenda médical générique</th>
                  <th className="py-4 px-4 text-center font-medium text-charcoal-200">Fichiers locaux</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-cream-100">
                {rows.map(({ feature, psylib, generic, files }) => (
                  <tr key={feature} className="hover:bg-cream-50 transition-colors">
                    <td className="py-3 px-4 text-charcoal-500 font-medium">{feature}</td>
                    <Cell value={psylib} highlight />
                    <Cell value={generic} />
                    <Cell value={files} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        <p className="text-center text-xs text-charcoal-400 mt-4">
          Comparatif basé sur les fonctionnalités publiquement documentées à mars 2026.
        </p>
      </div>
    </section>
  );
}

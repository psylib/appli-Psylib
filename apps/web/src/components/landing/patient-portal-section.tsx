import { Heart, BookOpen, Dumbbell, Bell } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function PhoneMockup() {
  return (
    <div className="w-[260px] mx-auto bg-[#F8F7FF] rounded-[28px] border-2 border-cream-200 p-4 shadow-xl">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-charcoal">Mon espace</span>
        <span className="text-xs text-charcoal-400">Sophie B.</span>
      </div>

      {/* Mood card */}
      <div className="bg-white rounded-xl p-3 mb-2.5 border border-cream-200">
        <p className="text-[10px] text-charcoal-400 mb-1.5">Humeur aujourd&apos;hui</p>
        <div className="flex gap-1.5 mb-1">
          {[
            { emoji: '😔', active: false },
            { emoji: '😟', active: false },
            { emoji: '😐', active: false },
            { emoji: '🙂', active: true },
            { emoji: '😄', active: false },
          ].map(({ emoji, active }, i) => (
            <span
              key={i}
              className={`text-lg ${active ? 'bg-sage-50 rounded-md px-0.5' : 'opacity-35'}`}
            >
              {emoji}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-sage font-medium">Bien — 7/10</p>
      </div>

      {/* Journal card */}
      <div className="bg-white rounded-xl p-3 mb-2.5 border border-cream-200">
        <p className="text-[10px] text-charcoal-400 mb-1">Journal</p>
        <p className="text-xs text-charcoal leading-relaxed">
          &ldquo;Aujourd&apos;hui j&apos;ai réussi à parler en réunion sans anxiété...&rdquo;
        </p>
        <p className="text-[10px] text-charcoal-400 mt-1.5">3 entrées cette semaine</p>
      </div>

      {/* Exercise card */}
      <div className="bg-white rounded-xl p-3 border border-cream-200">
        <p className="text-[10px] text-charcoal-400 mb-1">Exercice du jour</p>
        <p className="text-xs font-semibold text-charcoal mb-1.5">Respiration 4-7-8</p>
        <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-[#0D9488] rounded-full" />
        </div>
        <p className="text-[10px] text-[#0D9488] mt-1">2/3 séries complétées</p>
      </div>
    </div>
  );
}

export function PatientPortalSection() {
  return (
    <section id="espace-patient" className="bg-cream py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Phone mockup */}
          <ScrollReveal>
            <div className="hidden lg:flex justify-center">
              <PhoneMockup />
            </div>
          </ScrollReveal>

          {/* Right — Text */}
          <ScrollReveal delay={200}>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D9488]/10 border border-[#0D9488]/20 text-[#0D9488] text-sm font-medium">
                <Heart size={14} />
                Inclus dans tous les plans
              </div>

              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                Le suivi ne s&apos;arrête pas{' '}
                <em className="not-italic text-sage">à la porte du cabinet</em>
              </h2>

              <p className="text-charcoal-400 text-lg leading-relaxed">
                Offrez à vos patients un espace personnel pour suivre leur humeur, tenir leur journal thérapeutique et réaliser les exercices que vous leur assignez — y compris ceux générés par IA.
              </p>

              <ul className="space-y-3">
                {[
                  { icon: Heart, text: 'Mood tracking quotidien (échelle 1-10 + note libre)' },
                  { icon: BookOpen, text: 'Journal thérapeutique (privé ou partagé avec le psy)' },
                  { icon: Dumbbell, text: 'Exercices personnalisés (manuels ou générés par IA)' },
                  { icon: Bell, text: 'Alertes humeur pour le praticien (baisse significative)' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-charcoal-500">
                    <Icon size={16} className="text-[#0D9488] flex-shrink-0" />
                    <span className="text-sm">{text}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-sage-50/50 border border-sage-200 rounded-xl p-4">
                <p className="text-sm text-charcoal-500 leading-relaxed">
                  <span className="font-semibold text-charcoal">Pour le psy :</span>{' '}
                  visualisez l&apos;évolution de vos patients entre les séances. Les données du mood tracking alimentent vos graphiques Outcome Tracking.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

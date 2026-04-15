import { Video, Shield, Mic, Camera, Phone, FileText } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

function VisioMockup() {
  return (
    <div className="bg-gradient-to-br from-[#3D52A0] to-[#7B9CDA] rounded-2xl p-5 shadow-lg">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/80 text-xs font-dm-mono">En cours — 32:15</span>
        </div>
        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-dm-mono">HD</span>
      </div>

      {/* Video feeds */}
      <div className="flex gap-3 mb-4">
        <div className="flex-[2] bg-white/10 rounded-xl h-36 flex items-center justify-content-center relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-playfair font-bold text-lg">ML</span>
              </div>
              <p className="text-white/70 text-xs">Dr. Marie Laurent</p>
              <p className="text-white/50 text-[10px]">Psychologue clinicienne</p>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-white/10 rounded-xl h-36 flex items-center justify-center relative overflow-hidden">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-1">
              <span className="text-white font-medium text-sm">SB</span>
            </div>
            <p className="text-white/60 text-[10px]">Sophie B.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {[
          { icon: Mic, label: 'Micro', bg: 'bg-white/15 hover:bg-white/25' },
          { icon: Camera, label: 'Caméra', bg: 'bg-white/15 hover:bg-white/25' },
          { icon: Phone, label: 'Raccrocher', bg: 'bg-red-500 hover:bg-red-600' },
          { icon: FileText, label: 'Notes', bg: 'bg-white/15 hover:bg-white/25' },
        ].map(({ icon: Icon, label, bg }) => (
          <div
            key={label}
            className={`${bg} rounded-lg px-3 py-2 flex items-center gap-1.5 transition-colors cursor-default`}
          >
            <Icon size={14} className="text-white" />
            <span className="text-white text-xs hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VisioSection() {
  return (
    <section id="visio" className="bg-warm-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <ScrollReveal>
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3D52A0]/10 border border-[#3D52A0]/20 text-[#3D52A0] text-sm font-medium">
                <Video size={14} />
                Plans Pro & Clinic
              </div>

              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-charcoal leading-tight">
                Consultez en visio,{' '}
                <em className="not-italic text-sage">sans compromis sur la sécurité</em>
              </h2>

              <p className="text-charcoal-400 text-lg leading-relaxed">
                Visio-consultation intégrée directement dans PsyLib. Infrastructure hébergée sur serveur HDS certifié en France. Zéro outil tiers, zéro compromis.
              </p>

              <ul className="space-y-3">
                {[
                  'Vidéo HD + audio, hébergés en France (HDS)',
                  'Prise de notes pendant la consultation',
                  'Lien de connexion unique envoyé au patient',
                  'Pas de Zoom, pas de Google Meet — 100% conforme',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-charcoal-500">
                    <Shield size={16} className="text-sage flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2 pt-2">
                {['HDS Certifié', 'Chiffrement TLS 1.3', 'Données en France'].map((badge) => (
                  <span
                    key={badge}
                    className="text-xs px-3 py-1.5 rounded-full bg-sage-50 text-sage-700 border border-sage-200 font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Right — Mockup */}
          <ScrollReveal delay={200}>
            <div className="hidden lg:block">
              <VisioMockup />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

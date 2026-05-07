import Link from 'next/link';
import {
  Shield,
  Lock,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function BetaPage() {
  return (
    <>
      {/* Nav minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-playfair text-xl font-bold text-charcoal hover:text-sage transition-colors">
            PsyLib
          </Link>
          <Link
            href="/"
            className="text-sm text-charcoal-400 hover:text-charcoal transition-colors"
          >
            Retour au site
          </Link>
        </div>
      </header>

      <main className="bg-warm-white min-h-screen pt-14">
        {/* Hero — Programme clôturé */}
        <section className="py-20 md:py-32">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
            {/* Success icon */}
            <div className="w-20 h-20 mx-auto bg-sage-50 rounded-full flex items-center justify-center">
              <CheckCircle2 size={40} className="text-sage" />
            </div>

            <div className="space-y-4">
              <h1 className="font-playfair text-3xl md:text-5xl font-bold text-charcoal leading-tight">
                Le programme Fondateurs est complet
              </h1>

              <p className="text-lg text-charcoal-400 leading-relaxed max-w-lg mx-auto">
                Les <strong className="text-charcoal">6 places Fondateurs</strong> ont toutes été attribuées.
                Merci à nos premiers utilisateurs qui façonnent PsyLib au quotidien.
              </p>
            </div>

            {/* Progress bar — 6/6 */}
            <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-charcoal-500">Places Fondateurs</span>
                <span className="font-dm-mono text-sm font-medium text-sage">
                  6/6 attribuées
                </span>
              </div>
              <div className="w-full h-3 bg-cream-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sage to-sage-600 rounded-full"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4 pt-4">
              <p className="text-charcoal-400">
                PsyLib reste accessible à tous les psys libéraux avec un plan gratuit, sans engagement.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-terracotta text-white font-medium text-lg hover:bg-terracotta-600 transition-colors shadow-sm"
              >
                Créer un compte gratuit
                <ArrowRight size={18} />
              </Link>
              <p className="text-xs text-charcoal-300">
                Plan Free pour toujours — patients et séances illimités
              </p>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="bg-white border-t border-cream-200 py-12">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { icon: Shield, label: 'Hébergement HDS', sub: 'Données en France' },
                { icon: Lock, label: 'Chiffrement AES-256', sub: 'Niveau hospitalier' },
                { icon: Users, label: 'Conçu pour les psys', sub: 'Pas un outil générique' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon size={24} className="text-sage" />
                  <div className="font-medium text-charcoal text-sm">{label}</div>
                  <div className="text-xs text-charcoal-400">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer minimal */}
        <footer className="bg-white border-t border-cream-200 py-8">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-2">
            <p className="text-sm text-charcoal-400">
              PsyLib — L&apos;atelier numérique du psy libéral
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-charcoal-300">
              <Link href="/privacy" className="hover:text-charcoal-500 transition-colors">Confidentialité</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-charcoal-500 transition-colors">CGV</Link>
              <span>·</span>
              <a href="mailto:tony@psylib.eu" className="hover:text-charcoal-500 transition-colors">tony@psylib.eu</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

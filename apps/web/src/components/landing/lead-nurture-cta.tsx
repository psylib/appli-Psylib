'use client';

import { useState } from 'react';
import { Download, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function LeadNurtureCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      const res = await fetch('/api/lead-magnets/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug: 'kit-demarrage-cabinet' }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="bg-cream/50 py-16">
      <ScrollReveal className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-cream-200 p-8 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage/10 text-sage text-xs font-medium">
                <Download size={12} />
                Guide gratuit
              </div>
              <h3 className="font-playfair text-xl font-bold text-charcoal">
                Pas encore prêt ? Téléchargez le kit de démarrage
              </h3>
              <p className="text-sm text-charcoal-400 leading-relaxed">
                Check-list complète, modèles de documents, conseils pratiques pour lancer votre cabinet.
                Envoyé par email, gratuitement.
              </p>
            </div>

            <div className="md:w-72 shrink-0">
              {status === 'success' ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm py-3">
                  <CheckCircle2 size={18} />
                  <span>Guide envoyé ! Vérifiez vos emails.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-2.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    className="w-full px-4 py-3 rounded-lg border border-cream-200 text-sm text-charcoal placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-sage text-white text-sm font-medium hover:bg-sage-600 transition-colors disabled:opacity-70"
                  >
                    {status === 'loading' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Download size={16} />
                        Recevoir le guide
                      </>
                    )}
                  </button>
                  {status === 'error' && (
                    <p className="text-red-500 text-xs">Erreur. Réessayez.</p>
                  )}
                  <p className="text-xs text-charcoal-400 text-center">
                    <Link href="/privacy" className="underline hover:text-charcoal-400">
                      Conforme RGPD
                    </Link>
                    {' · '}Pas de spam
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

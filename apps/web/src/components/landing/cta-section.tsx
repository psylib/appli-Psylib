'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export function CTASection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
    <section className="bg-sage py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <ScrollReveal>
          <div className="space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium">
              <CheckCircle2 size={14} />
              Version bêta — accès anticipé gratuit
            </div>

            {/* Heading */}
            <h2 className="font-playfair text-3xl md:text-4xl font-bold text-white leading-tight">
              Soyez parmi les premiers à découvrir PsyLib
            </h2>

            <p className="text-sage-100 text-lg">
              14 jours gratuits. Sans carte bancaire. Sans engagement.
            </p>

            {/* Email form */}
            {status === 'success' ? (
              <div className="flex items-center justify-center gap-2 py-4 text-white">
                <CheckCircle2 size={20} />
                <span className="font-medium">C'est noté ! On vous recontacte très vite.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="flex-1 px-5 py-3.5 rounded-full bg-white text-charcoal placeholder:text-charcoal-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-sage"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-terracotta text-white font-medium text-sm hover:bg-terracotta-600 transition-colors shadow-sm disabled:opacity-70"
                >
                  {status === 'loading' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Démarrer gratuitement
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}

            {status === 'error' && (
              <p className="text-sage-100 text-sm">Une erreur s'est produite. Réessayez ou écrivez-nous à contact@psylib.eu</p>
            )}

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

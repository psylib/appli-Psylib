'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Mail } from 'lucide-react';

export function NewsletterForm() {
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
        body: JSON.stringify({ email, source: 'newsletter_footer' }),
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

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-sage-400 text-sm">
        <CheckCircle2 size={16} />
        <span>Inscription confirmée !</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-sm text-charcoal-300">
        Recevez nos conseils pour psychologues, 1x/mois. Pas de spam.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.fr"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-charcoal-700 text-white placeholder:text-charcoal-400 text-sm border border-charcoal-600 focus:outline-none focus:border-sage-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2.5 rounded-lg bg-sage text-white text-sm font-medium hover:bg-sage-600 transition-colors disabled:opacity-70 whitespace-nowrap"
        >
          {status === 'loading' ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            "S'inscrire"
          )}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-red-400 text-xs">Erreur. Réessayez.</p>
      )}
    </form>
  );
}

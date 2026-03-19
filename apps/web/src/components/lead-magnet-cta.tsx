'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Download } from 'lucide-react';

interface LeadMagnetCTAProps {
  slug: string;
  title: string;
  description: string;
}

export function LeadMagnetCTA({ slug, title, description }: LeadMagnetCTAProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    try {
      const res = await fetch('/api/lead-magnets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug }),
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
    <div className="my-10 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 md:p-8">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Download size={20} className="text-blue-600" />
        </div>
        <div>
          <span className="text-xs font-medium rounded-full px-2 py-0.5 bg-blue-100 text-blue-700">
            PDF Gratuit
          </span>
          <h3 className="font-bold text-gray-900 mt-1">{title}</h3>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {status === 'success' ? (
        <div className="flex items-center gap-2 py-3 text-green-700 bg-green-50 rounded-lg px-4">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">
            Consultez votre boite email ! Le PDF arrive dans quelques instants.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.fr"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#3D52A0] text-white font-medium text-sm hover:bg-[#2D3F80] transition-colors disabled:opacity-70"
          >
            {status === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Download size={16} />
                Recevoir le PDF
              </>
            )}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="text-red-600 text-xs mt-2">
          Une erreur s&apos;est produite. Veuillez reessayer.
        </p>
      )}
    </div>
  );
}

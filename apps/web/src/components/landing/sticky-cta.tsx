'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';

export function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling past hero (~600px)
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden animate-in slide-in-from-bottom duration-300">
      <div className="bg-terracotta/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            Plan gratuit pour toujours — Pro à partir de 40€/mois
          </p>
        </div>
        <Link
          href="/beta"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-terracotta text-sm font-semibold hover:bg-cream transition-colors whitespace-nowrap"
        >
          Candidater
          <ArrowRight size={14} />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-white/70 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

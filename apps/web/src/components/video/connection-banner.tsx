'use client';

import { WifiOff, Video } from 'lucide-react';
import type { UseAdaptiveQualityReturn } from '@/hooks/use-adaptive-quality';

interface Props {
  quality: UseAdaptiveQualityReturn;
}

export function ConnectionBanner({ quality }: Props) {
  const { degraded, reason, connectionPoor, restoreVideo } = quality;

  // Dégradé : afficher le mode audio + bouton réactiver.
  if (degraded) {
    const recovered = reason === 'auto' && !connectionPoor;
    return (
      <div className="absolute left-1/2 top-4 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
        <WifiOff className="h-4 w-4 text-amber-400" />
        <span>{recovered ? 'Connexion rétablie' : 'Mode audio — connexion faible'}</span>
        <button
          onClick={restoreVideo}
          className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25"
        >
          <Video className="h-3.5 w-3.5" /> Réactiver la vidéo
        </button>
      </div>
    );
  }

  return null;
}

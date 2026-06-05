'use client';

import { X } from 'lucide-react';
import type { PresentedDoc } from '@/hooks/use-doc-presentation';

interface Props {
  presented: PresentedDoc | null;
  progress: { received: number; total: number } | null;
  canClose: boolean;
  onClose?: () => void;
}

export function DocPresentationPanel({ presented, progress, canClose, onClose }: Props) {
  if (!presented && !progress) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-gray-950/95">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-white">
        <span className="truncate text-sm font-medium">
          {presented?.fileName ?? 'Réception du document…'}
        </span>
        {canClose && presented && (
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 hover:bg-white/10"
            title="Fermer le document"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
        {!presented && progress ? (
          <div className="text-center text-white/70">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-sm">
              Réception… {Math.round((progress.received / Math.max(progress.total, 1)) * 100)}%
            </p>
          </div>
        ) : presented?.mimeType.startsWith('image/') ? (
          <img src={presented.url} alt={presented.fileName} className="max-h-full max-w-full object-contain" />
        ) : (
          <iframe src={presented!.url} title={presented!.fileName} className="h-full w-full rounded bg-white" />
        )}
      </div>
    </div>
  );
}

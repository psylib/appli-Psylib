'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Erreur dans le tableau de bord
        </h2>
        <p className="text-sm text-muted-foreground">
          Une erreur inattendue est survenue. Vos données ne sont pas affectées.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors min-h-[44px]"
        >
          Recharger la section
        </button>
      </div>
    </div>
  );
}

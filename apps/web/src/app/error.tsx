'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function Error({
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Une erreur est survenue</h2>
        <p className="text-muted-foreground">Nous nous excusons pour ce désagrément.</p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors min-h-touch"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}

'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
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
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-charcoal mb-4">Une erreur est survenue</h2>
            <button onClick={reset} className="px-4 py-2 bg-sage text-white rounded-lg">
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

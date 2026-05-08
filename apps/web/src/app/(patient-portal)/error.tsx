'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function PatientPortalError({
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center space-y-4 max-w-sm">
        <span className="text-2xl font-bold text-[#3D52A0]">PsyLib</span>
        <h2 className="text-lg font-semibold text-slate-900">Une erreur est survenue</h2>
        <p className="text-sm text-slate-500">Nous nous excusons pour ce désagrément.</p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#3D52A0] text-white text-sm font-medium hover:bg-[#2d3f7c] transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

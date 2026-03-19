'use client';

import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

/**
 * Hook pour tracker des événements produit via PostHog.
 * Ne trackez JAMAIS de données patients — seulement des événements psy.
 *
 * Événements clés à tracker :
 * - trial_started       : après inscription
 * - first_patient_created : premier patient créé
 * - first_session_created : première séance
 * - upgrade_clicked     : clic sur un bouton d'upgrade
 * - booking_submitted   : RDV public soumis (côté patient, sans PII)
 * - ai_feature_used     : feature IA utilisée (type seulement)
 */
export function useAnalytics() {
  const posthog = usePostHog();

  const track = useCallback(
    (event: string, properties?: Record<string, string | number | boolean>) => {
      if (!posthog) return;
      posthog.capture(event, properties);
    },
    [posthog],
  );

  const identify = useCallback(
    (psychologistId: string, traits?: Record<string, string | number | boolean>) => {
      if (!posthog) return;
      posthog.identify(psychologistId, traits);
    },
    [posthog],
  );

  const reset = useCallback(() => {
    if (!posthog) return;
    posthog.reset();
  }, [posthog]);

  return { track, identify, reset };
}

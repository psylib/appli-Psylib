'use client';

import { usePostHog } from 'posthog-js/react';
import { useState, useEffect } from 'react';

/**
 * Hook pour feature flags PostHog — A/B testing.
 *
 * Usage:
 * ```tsx
 * const showNewCTA = useFeatureFlag('new-cta-variant');
 * if (showNewCTA) return <NewCTA />;
 * return <OldCTA />;
 * ```
 *
 * Feature flags à créer dans PostHog:
 * - `new-hero-cta`: A/B test texte CTA hero
 * - `show-before-after`: Toggle section avant/après
 * - `pricing-annual`: Afficher option annuelle
 */
export function useFeatureFlag(flag: string): boolean {
  const posthog = usePostHog();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!posthog) return;
    // PostHog feature flags are loaded async
    posthog.onFeatureFlags(() => {
      setEnabled(posthog.isFeatureEnabled(flag) ?? false);
    });
    // Also check immediately in case flags are already loaded
    setEnabled(posthog.isFeatureEnabled(flag) ?? false);
  }, [posthog, flag]);

  return enabled;
}

/**
 * Hook pour multivariate feature flags.
 * Returns the variant string (e.g., 'control', 'variant-a', 'variant-b').
 */
export function useFeatureFlagVariant(flag: string): string | undefined {
  const posthog = usePostHog();
  const [variant, setVariant] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!posthog) return;
    posthog.onFeatureFlags(() => {
      const v = posthog.getFeatureFlag(flag);
      setVariant(typeof v === 'string' ? v : undefined);
    });
    const v = posthog.getFeatureFlag(flag);
    setVariant(typeof v === 'string' ? v : undefined);
  }, [posthog, flag]);

  return variant;
}

'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getCookieConsent } from '@/components/cookie-consent';

function PostHogPageView() {
  const pathname = usePathname();
  const ph = usePostHog();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!ph || pathname === lastPath.current) return;
    lastPath.current = pathname;
    ph.capture('$pageview', { $current_url: window.location.href });
  }, [pathname, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initIfConsented = () => {
      const consent = getCookieConsent();
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      if (!key) return;

      if (consent === 'accepted' && !initialized) {
        posthog.init(key, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
          capture_pageview: false,
          capture_pageleave: true,
          person_profiles: 'identified_only',
          persistence: 'localStorage',
        });
        setInitialized(true);
      } else if (consent === 'refused' && initialized) {
        posthog.opt_out_capturing();
      }
    };

    initIfConsented();

    // Écouter les changements de consentement
    window.addEventListener('cookie-consent-update', initIfConsented);
    return () => window.removeEventListener('cookie-consent-update', initIfConsented);
  }, [initialized]);

  return (
    <PHProvider client={posthog}>
      {initialized && <PostHogPageView />}
      {children}
    </PHProvider>
  );
}

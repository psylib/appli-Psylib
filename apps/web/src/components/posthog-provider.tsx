'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

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
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return; // skip if not configured
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
      capture_pageview: false, // manual via PostHogPageView
      capture_pageleave: true,
      person_profiles: 'identified_only',
      persistence: 'localStorage',
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PHProvider>
  );
}

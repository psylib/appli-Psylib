'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

const CONSENT_KEY = 'psylib-cookie-consent';

export type CookieConsent = 'accepted' | 'refused' | null;

export function getCookieConsent(): CookieConsent {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === 'accepted' || value === 'refused') return value;
  return null;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
    window.dispatchEvent(new Event('cookie-consent-update'));
  }, []);

  const handleRefuse = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'refused');
    setVisible(false);
    window.dispatchEvent(new Event('cookie-consent-update'));
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-border bg-white p-4 shadow-lg sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6">
      <p className="text-sm text-charcoal-600 max-w-3xl">
        Nous utilisons des cookies analytiques pour améliorer votre expérience.
        Aucune donnée de santé n&apos;est concernée.
        Consultez notre{' '}
        <a href="/privacy" className="underline text-primary hover:text-primary/80">
          politique de confidentialité
        </a>.
      </p>
      <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
        <Button variant="outline" size="sm" onClick={handleRefuse}>
          Refuser
        </Button>
        <Button size="sm" onClick={handleAccept}>
          Accepter
        </Button>
      </div>
    </div>
  );
}

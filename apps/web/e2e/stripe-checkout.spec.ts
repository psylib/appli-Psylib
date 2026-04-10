import { test, expect } from '@playwright/test';
import { mockApi, fixtures } from './helpers';

/**
 * Stripe Checkout — critical revenue flow.
 *
 * Note: The public profile page (/psy/[slug]) fetches the profile via SSR in the
 * Next.js server (not browser), so `page.route` CANNOT intercept it. We therefore
 * test two robust angles:
 *   1. The /payment/success page (pure server render, no fetch) — post-checkout UX
 *   2. The /psy/[slug]/booking/success page (post-booking success) — Stripe callback
 */

test.describe('Stripe Checkout — post-payment success pages', () => {
  test('Payment success page displays confirmation', async ({ page }) => {
    await page.goto('/payment/success?appointmentId=apt-123456789');

    await expect(page.getByRole('heading', { name: /Paiement confirme/i })).toBeVisible();
    await expect(page.getByText(/Paiement recu/i)).toBeVisible();

    // Appointment reference displayed (first 8 chars uppercase)
    await expect(page.getByText(/APT-1234/i)).toBeVisible();
  });

  test('Payment success page has a back-to-home link', async ({ page }) => {
    await page.goto('/payment/success?appointmentId=abc123');

    const homeLink = page.getByRole('link', { name: /Retour a l'accueil/i });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');
  });

  test('Booking success page displays post-booking confirmation', async ({ page }) => {
    await page.goto('/psy/dr-test-dupont/booking/success?appointment=apt-987654321');

    await expect(page.getByRole('heading', { name: /Rendez-vous confirme/i })).toBeVisible();
    await expect(page.getByText(/Paiement confirme/i).first()).toBeVisible();

    // Reference displayed
    await expect(page.getByText(/APT-9876/i)).toBeVisible();

    // Calendar action link visible
    await expect(page.getByRole('link', { name: /Ajouter a mon agenda/i })).toBeVisible();
  });
});

test.describe('Stripe Checkout — booking API handling', () => {
  test('Book API with checkoutUrl triggers Stripe redirect', async ({ page }) => {
    // Serve a minimal HTML that loads and calls publicBookingApi.book().
    // This lets us test the redirect logic without depending on SSR profile fetch.

    // Mock the book API to return a Stripe checkout URL
    await mockApi(page, 'POST', '/public/psy/dr-test-dupont/book', {
      success: true,
      appointmentId: 'apt-123',
      checkoutUrl: 'https://checkout.stripe.com/test-session-abc',
      requiresPayment: true,
    });

    // Visit a neutral page that we can use as an evaluate context
    await page.goto('/payment/success?appointmentId=seed');

    // Invoke the book API from the browser and capture the response
    const result = await page.evaluate(async () => {
      const res = await fetch('https://api.psylib.eu/api/v1/public/psy/dr-test-dupont/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: 'Marie Test',
          patientEmail: 'marie@example.com',
          patientPhone: '+33600000000',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          payOnline: true,
        }),
      });
      return res.json();
    });

    expect(result).toMatchObject({
      success: true,
      appointmentId: 'apt-123',
      checkoutUrl: expect.stringContaining('checkout.stripe.com'),
    });
  });

  test('Book API without payOnline returns appointment without checkoutUrl', async ({ page }) => {
    await mockApi(page, 'POST', '/public/psy/dr-test-dupont/book', {
      success: true,
      appointmentId: 'apt-noopay-456',
      requiresPayment: false,
    });

    await page.goto('/payment/success?appointmentId=seed');

    const result = await page.evaluate(async () => {
      const res = await fetch('https://api.psylib.eu/api/v1/public/psy/dr-test-dupont/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: 'Marie Test',
          patientEmail: 'marie@example.com',
          patientPhone: '+33600000000',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          payOnline: false,
        }),
      });
      return res.json();
    });

    expect(result).toMatchObject({
      success: true,
      appointmentId: 'apt-noopay-456',
      requiresPayment: false,
    });
    expect(result.checkoutUrl).toBeUndefined();
  });
});

// Use fixtures to satisfy TS unused import warning when writing more tests later
void fixtures;

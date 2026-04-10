import { test, expect } from '@playwright/test';
import { loginAsPsychologist, mockApi, mockSseStream, fixtures } from './helpers';

test.describe('AI Session Summary — streaming SSE', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
    // Session with long notes (> 50 chars to enable AI button)
    await mockApi(page, 'GET', '/sessions/s1', fixtures.sessionWithNotes);
    // AI consent must be granted for streaming to be allowed
    await mockApi(page, 'GET', '/psychologist/ai-consent', { granted: true, version: '2026-01-v1' });
    await mockApi(page, 'POST', '/psychologist/ai-consent', { granted: true });
  });

  test('AI button is visible when notes are long enough', async ({ page }) => {
    await page.goto('/dashboard/sessions/s1');

    // The AI prompt card "Assistant IA disponible" shows when notes > 50 chars
    await expect(page.getByText(/Assistant IA disponible/i)).toBeVisible({ timeout: 10_000 });

    // The "Résumer" button should be clickable
    const summarizeBtn = page.getByRole('button', { name: /Résumer/i });
    await expect(summarizeBtn).toBeVisible();
  });

  test('Click Résumer triggers streaming and displays summary', async ({ page }) => {
    // Mock the SSE streaming response
    await mockSseStream(page, '**/ai/session-summary*', [
      '{"text":"Le patient a exprimé"}',
      '{"text":" une anxiété croissante"}',
      '{"text":" liée à son travail."}',
      '{"type":"structured","data":{"tags":["anxiété","travail"],"evolution":"stable","alertLevel":"low","alertReason":null,"keyThemes":["stress professionnel"]}}',
    ]);

    await page.goto('/dashboard/sessions/s1');

    // Wait for the AI prompt card
    await expect(page.getByText(/Assistant IA disponible/i)).toBeVisible({ timeout: 10_000 });

    // Click Résumer
    await page.getByRole('button', { name: /Résumer/i }).click();

    // Summary text should appear progressively (we verify final text is displayed)
    await expect(page.getByText(/anxiété croissante/i).first()).toBeVisible({ timeout: 10_000 });

    // Evolution badge "stable" should appear after structured data arrives
    await expect(page.getByText(/stable/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('SSE error message is displayed on backend error', async ({ page }) => {
    // Mock an error response
    await page.route('**/ai/session-summary*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"error":"Rate limit dépassé"}\n\n',
      }),
    );

    await page.goto('/dashboard/sessions/s1');

    await expect(page.getByText(/Assistant IA disponible/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /Résumer/i }).click();

    // Error state should display the error message
    await expect(page.getByText(/Erreur IA|Rate limit/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

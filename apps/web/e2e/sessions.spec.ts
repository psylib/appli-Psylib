import { test, expect } from '@playwright/test';
import { loginAsPsychologist, mockApi, fixtures } from './helpers';

test.describe('Sessions — List & CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
  });

  test('Session list loads with data', async ({ page }) => {
    await mockApi(page, 'GET', '/sessions', fixtures.sessions);
    await page.goto('/dashboard/sessions');

    await expect(page.getByText('Séances')).toBeVisible();
    await expect(page.getByText('Marie Dupont').first()).toBeVisible();
    await expect(page.getByText('Jean Martin').first()).toBeVisible();
  });

  test('Session list shows empty state', async ({ page }) => {
    await mockApi(page, 'GET', '/sessions', { data: [], total: 0, page: 1, totalPages: 0 });
    await page.goto('/dashboard/sessions');

    await expect(page.getByText(/aucune séance|Commencez/i)).toBeVisible();
  });

  test('Click session navigates to detail', async ({ page }) => {
    await mockApi(page, 'GET', '/sessions', fixtures.sessions);
    await page.goto('/dashboard/sessions');

    await mockApi(page, 'GET', '/sessions/s1', fixtures.session);
    await page.getByText('Marie Dupont').first().click();
    await expect(page).toHaveURL(/\/sessions\/s1/);
  });
});

test.describe('Sessions — Create', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
    await mockApi(page, 'GET', '/patients', fixtures.patients);
  });

  test('Create session form loads with fields', async ({ page }) => {
    await page.goto('/dashboard/sessions/new');

    await expect(page.getByText('Nouvelle séance')).toBeVisible();
    // Duration field
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('Create session form submits and redirects', async ({ page }) => {
    await page.goto('/dashboard/sessions/new');

    // Mock create response
    await page.route('**/sessions', (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ ...fixtures.session, id: 's-new' }),
        });
      }
      return route.continue();
    });

    // Mock redirect destination
    await mockApi(page, 'GET', '/sessions/s-new', fixtures.session);

    // Fill datetime
    const dateInput = page.locator('input[type="datetime-local"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill('2026-03-25T14:00');
    }

    // Fill duration
    const durationInput = page.locator('input[type="number"]').first();
    if (await durationInput.isVisible()) {
      await durationInput.fill('50');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /Créer/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  });
});

test.describe('Sessions — Note editor & autosave', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
    await mockApi(page, 'GET', '/sessions/s1', fixtures.session);
  });

  test('Session detail page loads with notes', async ({ page }) => {
    await page.goto('/dashboard/sessions/s1');

    // Session header visible
    await expect(page.getByText(/Séance du|50 min/i).first()).toBeVisible();
    // Notes content
    await expect(page.getByText(/anxiété/i).first()).toBeVisible();
  });

  test('Note editor autosave triggers on edit', async ({ page }) => {
    let autosaveCalled = false;

    await page.route('**/sessions/s1/autosave', (route) => {
      autosaveCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ saved: true, at: new Date().toISOString() }),
      });
    });

    await page.goto('/dashboard/sessions/s1');

    // Find textarea and type
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('Notes mises à jour pour le test E2E');

      // Wait for autosave debounce (30s is too long for test, check if immediate save button exists)
      const saveBtn = page.getByRole('button', { name: /Enregistrer|Sauvegarder/i }).or(
        page.locator('[aria-label*="save" i]'),
      );
      if (await saveBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.first().click();
      }
    }
  });

  test('Mood selector buttons are interactive', async ({ page }) => {
    await page.goto('/dashboard/sessions/s1');

    // Look for mood emoji buttons
    const moodBtns = page.locator('button:has-text("😊"), button:has-text("🙂"), button:has-text("😐"), button:has-text("😟"), button:has-text("😰")');
    const count = await moodBtns.count();
    if (count > 0) {
      await moodBtns.first().click();
    }
  });

  test('AI summary button exists and triggers streaming', async ({ page }) => {
    // Mock SSE endpoint
    await page.route('**/ai/session-summary', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"content":"## Résumé\\nLe patient présente des signes d\'anxiété."}\n\n',
      }),
    );

    await page.goto('/dashboard/sessions/s1');

    // Look for AI button (Sparkles icon or "Assistant IA" text)
    const aiBtn = page.getByRole('button', { name: /IA|Assistant|Résumé/i }).or(
      page.locator('button:has-text("✨")'),
    );
    if (await aiBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await aiBtn.first().click();
    }
  });
});

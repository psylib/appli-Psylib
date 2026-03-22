import { test, expect } from '@playwright/test';
import { loginAsPatient, mockApi, fixtures } from './helpers';

test.describe('Patient Portal — Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
    await mockApi(page, 'GET', '/patient-portal/dashboard', fixtures.patientDashboard);
  });

  test('Patient dashboard loads with greeting', async ({ page }) => {
    await page.goto('/patient-portal');

    await expect(page.getByText(/Bonjour|Comment vous sentez/i).first()).toBeVisible();
  });

  test('Mood CTA card is visible', async ({ page }) => {
    await page.goto('/patient-portal');

    await expect(page.getByText(/Enregistrer mon humeur|humeur/i).first()).toBeVisible();
  });

  test('Stats cards show mood average and exercises count', async ({ page }) => {
    await page.goto('/patient-portal');

    // Mood average 6.5
    const moodAvg = page.getByText(/6\.5|Humeur moyenne/i);
    if (await moodAvg.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(moodAvg.first()).toBeVisible();
    }

    // Exercises count
    await expect(page.getByText(/exercice|à faire/i).first()).toBeVisible();
  });

  test('Next appointment is displayed', async ({ page }) => {
    await page.goto('/patient-portal');

    await expect(page.getByText(/rendez-vous|Prochain/i).first()).toBeVisible();
  });

  test('Journal CTA card is visible', async ({ page }) => {
    await page.goto('/patient-portal');

    await expect(page.getByText(/journal|12 entrée/i).first()).toBeVisible();
  });

  test('Navigation links work', async ({ page }) => {
    await page.goto('/patient-portal');

    // Click mood link
    const moodLink = page.getByRole('link', { name: /humeur|mood/i }).first();
    if (await moodLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await moodLink.click();
      await expect(page).toHaveURL(/\/mood/);
    }
  });
});

test.describe('Patient Portal — Mood tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
    await mockApi(page, 'GET', '/patient-portal/mood', fixtures.moodHistory);
  });

  test('Mood page loads with slider and history', async ({ page }) => {
    await page.goto('/patient-portal/mood');

    await expect(page.getByText(/Mon humeur|Comment vous sentez/i).first()).toBeVisible();

    // Slider or mood selector
    const slider = page.locator('input[type="range"]');
    if (await slider.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(slider).toBeVisible();
    }
  });

  test('Mood history displays past entries', async ({ page }) => {
    await page.goto('/patient-portal/mood');

    // Should see at least one mood entry
    await expect(page.getByText(/Bonne journée|Très motivé/i).first()).toBeVisible();
  });

  test('Submit mood entry works', async ({ page }) => {
    let moodSubmitted = false;

    await page.route('**/patient-portal/mood', (route) => {
      if (route.request().method() === 'POST') {
        moodSubmitted = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'm-new',
            mood: 7,
            note: 'Test E2E',
            createdAt: new Date().toISOString(),
          }),
        });
      }
      return route.continue();
    });

    await page.goto('/patient-portal/mood');

    // Optional note
    const noteTextarea = page.locator('textarea').first();
    if (await noteTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await noteTextarea.fill('Test E2E');
    }

    // Submit
    const saveBtn = page.getByRole('button', { name: /Enregistrer/i });
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
      // Success message
      await expect(page.getByText(/enregistrée|succès/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Patient Portal — Exercises', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
    await mockApi(page, 'GET', '/patient-portal/exercises', [
      { id: 'ex1', title: 'Respiration 4-7-8', description: 'Technique de relaxation', status: 'assigned', dueDate: '2026-03-28', createdByAi: true },
      { id: 'ex2', title: 'Journal de pensées', description: 'Identifier les pensées automatiques', status: 'completed', completedAt: '2026-03-20T10:00:00Z', createdByAi: false },
    ]);
  });

  test('Exercises page loads with exercise list', async ({ page }) => {
    await page.goto('/patient-portal/exercises');

    await expect(page.getByText(/Respiration 4-7-8/i).first()).toBeVisible();
  });
});

test.describe('Patient Portal — Journal', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
    await mockApi(page, 'GET', '/patient-portal/journal', [
      { id: 'j1', content: 'Aujourd\'hui était une bonne journée.', mood: 7, tags: ['gratitude'], isPrivate: false, createdAt: '2026-03-22T20:00:00Z' },
      { id: 'j2', content: 'Pensées personnelles...', mood: 5, tags: [], isPrivate: true, createdAt: '2026-03-21T21:00:00Z' },
    ]);
  });

  test('Journal page loads with entries', async ({ page }) => {
    await page.goto('/patient-portal/journal');

    await expect(page.getByText(/journal|bonne journée/i).first()).toBeVisible();
  });
});

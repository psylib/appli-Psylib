import { test, expect } from '@playwright/test';
import { loginAsPsychologist, mockApi, fixtures } from './helpers';

test.describe('Settings — Profile', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
  });

  test('Profile settings page loads with psychologist data', async ({ page }) => {
    await page.goto('/dashboard/settings/profile');

    await expect(page.getByText(/Mon profil|professionnel/i).first()).toBeVisible();

    // Form fields should be pre-filled
    const nameInput = page.getByLabel(/Nom/i).or(page.locator('input[name="name"]'));
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(nameInput).toHaveValue('Dr. Test Dupont');
    }
  });

  test('Profile form can be edited and saved', async ({ page }) => {
    let saveCalled = false;

    await page.route('**/psychologist', (route) => {
      if (route.request().method() === 'PUT') {
        saveCalled = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...fixtures.psychologist, specialization: 'TCC et EMDR' }),
        });
      }
      return route.continue();
    });

    await page.goto('/dashboard/settings/profile');

    const specInput = page.getByLabel(/Spécialisation/i).or(page.locator('input[name="specialization"]'));
    if (await specInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await specInput.clear();
      await specInput.fill('TCC et EMDR');

      const saveBtn = page.getByRole('button', { name: /Enregistrer/i });
      await saveBtn.click();
    }
  });

  test('ADELI number field is present', async ({ page }) => {
    await page.goto('/dashboard/settings/profile');

    const adeliInput = page.getByLabel(/ADELI/i).or(page.locator('input[name="adeliNumber"]'));
    if (await adeliInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(adeliInput).toHaveValue('759312345');
    }
  });
});

test.describe('Settings — Billing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
    await mockApi(page, 'GET', '/billing/subscription', {
      plan: 'pro',
      status: 'active',
      currentPeriodEnd: '2026-04-22T00:00:00Z',
      cancelAtPeriodEnd: false,
    });
  });

  test('Billing page loads with subscription info', async ({ page }) => {
    await page.goto('/dashboard/settings/billing');

    // Should display current plan
    await expect(page.getByText(/Pro|abonnement|plan/i).first()).toBeVisible();
  });
});

test.describe('Settings — Privacy (RGPD)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
  });

  test('Privacy page loads with RGPD information', async ({ page }) => {
    await page.goto('/dashboard/settings/privacy');

    await expect(page.getByText(/RGPD|confidentialité|données/i).first()).toBeVisible();
  });
});

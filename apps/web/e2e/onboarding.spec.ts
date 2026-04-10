import { test, expect } from '@playwright/test';
import { loginAsPsychologistNotOnboarded, mockApi, fixtures } from './helpers';

test.describe('Onboarding wizard — 5 steps flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologistNotOnboarded(page);
    // Global API mocks — onboarding endpoints
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: false });
    await mockApi(page, 'PUT', '/onboarding/profile', { success: true });
    await mockApi(page, 'POST', '/onboarding/steps/practice/complete', { success: true });
    await mockApi(page, 'POST', '/onboarding/steps/preferences/complete', { success: true });
    await mockApi(page, 'POST', '/onboarding/steps/first_patient/complete', { success: true });
    await mockApi(page, 'POST', '/onboarding/complete', { success: true });
  });

  test('Step 1 — profile — submit navigates to practice', async ({ page }) => {
    await page.goto('/onboarding/profile');

    await expect(page.getByText(/Votre profil praticien/i)).toBeVisible();

    // Fill profile form
    await page.getByLabel(/Nom complet/i).fill(fixtures.onboarding.profile.name);
    await page.getByLabel(/Spécialisation/i).fill(fixtures.onboarding.profile.specialization);
    await page.getByLabel(/Numéro ADELI/i).fill(fixtures.onboarding.profile.adeliNumber);
    await page.getByLabel(/Bio courte/i).fill(fixtures.onboarding.profile.bio);

    // Click continue
    await page.getByRole('button', { name: /Continuer/i }).first().click();

    // Assert navigation to practice step
    await expect(page).toHaveURL(/\/onboarding\/practice/);
  });

  test('Step 2 — practice — submit navigates to preferences', async ({ page }) => {
    await page.goto('/onboarding/practice');

    await expect(page.getByText(/Votre cabinet/i).first()).toBeVisible();

    await page.getByLabel(/Adresse du cabinet/i).fill(fixtures.onboarding.practice.address);
    await page.getByLabel(/Téléphone professionnel/i).fill(fixtures.onboarding.practice.phone);

    await page.getByRole('button', { name: /Continuer/i }).first().click();

    await expect(page).toHaveURL(/\/onboarding\/preferences/);
  });

  test('Step 3 — preferences — duration chip + rate + submit', async ({ page }) => {
    await page.goto('/onboarding/preferences');

    await expect(page.getByText(/Préférences de séance/i)).toBeVisible();

    // Click duration chip "50 min"
    const chip50 = page.getByRole('button', { name: /^50 min$/ });
    await chip50.click();
    await expect(chip50).toHaveAttribute('aria-pressed', 'true');

    // Fill rate (input type=number)
    const rateInput = page.locator('input[type="number"]').first();
    await rateInput.fill(String(fixtures.onboarding.preferences.sessionRate));

    await page.getByRole('button', { name: /Continuer/i }).first().click();

    await expect(page).toHaveURL(/\/onboarding\/first_patient/);
  });

  test('Step 4 — first_patient — skip option navigates to success', async ({ page }) => {
    await page.goto('/onboarding/first_patient');

    await expect(page.getByText(/Votre premier patient/i)).toBeVisible();

    // Click "Passer cette étape" (skip)
    await page.getByRole('button', { name: /Passer cette étape/i }).first().click();

    // Should navigate to success page
    await expect(page).toHaveURL(/\/onboarding\/success/, { timeout: 10_000 });
  });

  test('Step 5 — success — quick actions visible', async ({ page }) => {
    await page.goto('/onboarding/success');

    // Welcome header
    await expect(page.getByText(/Bienvenue sur PsyLib/i)).toBeVisible();

    // 3 quick actions must be visible
    await expect(page.getByText(/Voir le dashboard/i)).toBeVisible();
    await expect(page.getByText(/Ajouter un patient/i)).toBeVisible();
    await expect(page.getByText(/Configurer l'agenda/i)).toBeVisible();
  });
});

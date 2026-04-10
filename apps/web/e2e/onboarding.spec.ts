import { test, expect, Page } from '@playwright/test';
import { loginAsPsychologistNotOnboarded, mockApi, fixtures } from './helpers';

/**
 * The onboarding wizard renders 2 copies of every form (desktop md:flex +
 * mobile md:hidden) bound to the same react-hook-form instance. RHF's
 * register() stores the ref of the LAST rendered input (the mobile one, which
 * is CSS-hidden at default viewport) and reads ref.current.value on submit.
 *
 * This helper sets the value on ALL matching inputs via the native React
 * setter + dispatches 'input' + 'change' events so RHF onChange fires
 * regardless of which ref is active.
 */
async function fillAll(page: Page, selector: string, value: string) {
  await page.evaluate(
    ({ selector, value }) => {
      const nodes = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(selector);
      nodes.forEach((el) => {
        const proto = el instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        setter?.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    },
    { selector, value },
  );
}

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

    await expect(page.getByRole('heading', { name: /Votre profil praticien/i }).first()).toBeVisible();

    await fillAll(page, 'input[id="nom-complet"]', fixtures.onboarding.profile.name);
    await fillAll(page, 'input[id="spécialisation"]', fixtures.onboarding.profile.specialization);
    await fillAll(page, 'input[id="numéro-adeli"]', fixtures.onboarding.profile.adeliNumber);
    await fillAll(page, 'textarea[id="bio-courte"]', fixtures.onboarding.profile.bio);

    // Click continue (desktop button is visible at default viewport 1280x720)
    await page.locator('button:visible', { hasText: 'Continuer' }).first().click();

    // Assert navigation to practice step
    await expect(page).toHaveURL(/\/onboarding\/practice/);
  });

  test('Step 2 — practice — submit navigates to preferences', async ({ page }) => {
    await page.goto('/onboarding/practice');

    await expect(page.getByRole('heading', { name: /Votre cabinet/i }).first()).toBeVisible();

    await fillAll(page, 'input[id="adresse-du-cabinet"]', fixtures.onboarding.practice.address);
    await fillAll(page, 'input[id="téléphone-professionnel"]', fixtures.onboarding.practice.phone);

    await page.locator('button:visible', { hasText: 'Continuer' }).first().click();

    await expect(page).toHaveURL(/\/onboarding\/preferences/);
  });

  test('Step 3 — preferences — duration chip + rate + submit', async ({ page }) => {
    await page.goto('/onboarding/preferences');

    await expect(page.getByRole('heading', { name: /Préférences de séance/i }).first()).toBeVisible();

    // Click duration chip "50 min"
    const chip50 = page.getByRole('button', { name: /^50 min$/ }).first();
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

    await expect(page.getByRole('heading', { name: /Votre premier patient/i }).first()).toBeVisible();

    // Click "Passer cette étape" (skip)
    await page.getByRole('button', { name: /Passer cette étape/i }).first().click();

    // Should navigate to success page
    await expect(page).toHaveURL(/\/onboarding\/success/, { timeout: 10_000 });
  });

  test('Step 5 — success — quick actions visible', async ({ page }) => {
    await page.goto('/onboarding/success');

    // Welcome header
    await expect(page.getByText(/Bienvenue sur PsyLib/i).first()).toBeVisible();

    // 3 quick actions must be visible
    await expect(page.getByText(/Voir le dashboard/i).first()).toBeVisible();
    await expect(page.getByText(/Ajouter un patient/i).first()).toBeVisible();
    await expect(page.getByText(/Configurer l'agenda/i).first()).toBeVisible();
  });
});

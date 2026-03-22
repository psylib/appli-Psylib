import { test, expect } from '@playwright/test';
import { loginAsPsychologist, loginAsPatient } from './helpers';

test.describe('Auth — Redirects & guards', () => {
  test('Unauthenticated user visiting /dashboard is redirected to /login', async ({ page }) => {
    const response = await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    expect(page.url()).toContain('callbackUrl');
  });

  test('Unauthenticated user visiting /patient-portal is redirected to /login', async ({ page }) => {
    await page.goto('/patient-portal');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/login page loads with correct elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Connexion/i);
    await expect(page.locator('text=PsyLib')).toBeVisible();
    await expect(page.locator('text=Se connecter')).toBeVisible();
    await expect(page.locator('text=MFA')).toBeVisible();
    await expect(page.locator('text=HDS')).toBeVisible();
  });

  test('/login shows error banner when error param is present', async ({ page }) => {
    await page.goto('/login?error=OAuthCallback');
    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page.locator('text=erreur')).toBeVisible();
  });

  test('Authenticated psychologist visiting /login is redirected to /dashboard', async ({ page }) => {
    await loginAsPsychologist(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Authenticated patient visiting /dashboard is redirected to /patient-portal', async ({ page }) => {
    await loginAsPatient(page);
    // Mock onboarding check to prevent redirect loop
    await page.route('**/api/v1/onboarding/**', (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ isOnboarded: true }) }),
    );
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/patient-portal/);
  });

  test('Public pages are accessible without auth', async ({ page }) => {
    const publicPaths = ['/', '/tarifs', '/faq', '/contact', '/blog'];
    for (const path of publicPaths) {
      const response = await page.goto(path);
      expect(response?.status()).toBeLessThan(400);
      // Should NOT be redirected to /login
      expect(page.url()).not.toContain('/login');
    }
  });
});

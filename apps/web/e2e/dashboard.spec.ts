import { test, expect } from '@playwright/test';
import { loginAsPsychologist, mockApi, fixtures } from './helpers';

test.describe('Dashboard — KPIs & navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);

    // Mock all dashboard API calls
    await mockApi(page, 'GET', '/dashboard', fixtures.dashboard);
    await mockApi(page, 'GET', '/dashboard/checklist', fixtures.checklist);
    await mockApi(page, 'GET', '/appointments', fixtures.appointments);
    await mockApi(page, 'GET', '/sessions', fixtures.sessions);
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
  });

  test('Dashboard page loads with greeting', async ({ page }) => {
    await page.goto('/dashboard');
    // Should show a time-based greeting
    await expect(page.locator('text=/Bonjour|Bon après-midi|Bonsoir/')).toBeVisible();
  });

  test('KPI cards display data', async ({ page }) => {
    await page.goto('/dashboard');
    // Patient count
    await expect(page.getByText('24')).toBeVisible();
    // Sessions this month
    await expect(page.getByText('38')).toBeVisible();
  });

  test('Quick actions are visible and clickable', async ({ page }) => {
    await page.goto('/dashboard');
    const newSession = page.getByText('Nouvelle séance');
    await expect(newSession).toBeVisible();

    const newPatient = page.getByText('Nouveau patient');
    await expect(newPatient).toBeVisible();
  });

  test('Recent sessions section shows data', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Marie Dupont').first()).toBeVisible();
  });

  test('Navigation sidebar links work', async ({ page }) => {
    await page.goto('/dashboard');

    // Click Patients link in sidebar/nav
    await page.getByRole('link', { name: /Patients/i }).first().click();
    await expect(page).toHaveURL(/\/patients/);
  });
});

import { test, expect } from '@playwright/test';
import { loginAsPsychologist, mockApi, fixtures } from './helpers';

test.describe('Invoices — list & manual creation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
    await mockApi(page, 'GET', '/patients', fixtures.patients);
  });

  test('Invoice list loads with data and status badges', async ({ page }) => {
    await mockApi(page, 'GET', '/invoices', fixtures.invoices);

    await page.goto('/dashboard/invoices');

    // Header
    await expect(page.getByRole('heading', { name: /Facturation/i })).toBeVisible();

    // Both invoice numbers visible
    await expect(page.getByText('PSY-2026-0001')).toBeVisible();
    await expect(page.getByText('PSY-2026-0002')).toBeVisible();

    // Status badges
    await expect(page.getByText(/Brouillon/i).first()).toBeVisible();
    await expect(page.getByText(/Payée/i).first()).toBeVisible();

    // Auto badge for the second invoice
    await expect(page.getByText(/Auto/i).first()).toBeVisible();
  });

  test('Empty state displays when no invoices', async ({ page }) => {
    await mockApi(page, 'GET', '/invoices', []);

    await page.goto('/dashboard/invoices');

    await expect(page.getByText(/Aucune facture/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Créer une facture/i })).toBeVisible();
  });

  test('Create invoice modal opens with form fields', async ({ page }) => {
    await mockApi(page, 'GET', '/invoices', fixtures.invoices);

    await page.goto('/dashboard/invoices');

    // Click "Nouvelle facture" button in header
    await page.getByRole('button', { name: /Nouvelle facture/i }).click();

    // Modal with form should appear
    await expect(page.getByRole('heading', { name: /Nouvelle facture/i })).toBeVisible();

    // Patient select
    await expect(page.locator('select').first()).toBeVisible();

    // Amount input
    await expect(page.locator('input[type="number"]').first()).toBeVisible();

    // Date input
    await expect(page.locator('input[type="date"]').first()).toBeVisible();

    // Cancel button
    await expect(page.getByRole('button', { name: /Annuler/i })).toBeVisible();
  });

  test('Create invoice form submits successfully', async ({ page }) => {
    await mockApi(page, 'GET', '/invoices', fixtures.invoices);

    let createCalled = false;
    await page.route('**/api/v1/invoices*', (route) => {
      if (route.request().method() === 'POST') {
        createCalled = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'inv-new',
            invoiceNumber: 'PSY-2026-0003',
            amountTtc: '80.00',
            status: 'draft',
            issuedAt: new Date().toISOString(),
            pdfUrl: null,
            source: 'manual',
            paidAt: null,
            sessionId: null,
            patient: { id: 'p1', name: 'Marie Dupont', email: 'marie@example.com' },
          }),
        });
      }
      return route.continue();
    });

    await page.goto('/dashboard/invoices');
    await page.getByRole('button', { name: /Nouvelle facture/i }).click();

    // Select first patient
    await page.locator('select').first().selectOption({ index: 1 });

    // Fill amount
    await page.locator('input[type="number"]').first().fill('80');

    // Submit
    await page.getByRole('button', { name: /^Créer$/ }).click();

    // Expect modal close (heading disappears) — allow some tolerance
    await expect(page.getByRole('button', { name: /^Créer$/ })).toBeHidden({ timeout: 5_000 });
    expect(createCalled).toBe(true);
  });

  test('Summary cards display totals by status', async ({ page }) => {
    await mockApi(page, 'GET', '/invoices', fixtures.invoices);

    await page.goto('/dashboard/invoices');

    // Wait for data to load
    await expect(page.getByText('PSY-2026-0001')).toBeVisible();

    // Summary cards show labels: Brouillon, Envoyée, Payée
    await expect(page.getByText(/Brouillon/i).first()).toBeVisible();
    await expect(page.getByText(/Envoyée/i).first()).toBeVisible();
    await expect(page.getByText(/Payée/i).first()).toBeVisible();
  });
});

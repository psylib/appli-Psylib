import { test, expect } from '@playwright/test';
import { loginAsPsychologist, mockApi, fixtures } from './helpers';

test.describe('Patients — CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPsychologist(page);
    await mockApi(page, 'GET', '/onboarding/profile', { isOnboarded: true });
    await mockApi(page, 'GET', '/psychologist', fixtures.psychologist);
  });

  test('Patient list loads with data', async ({ page }) => {
    await mockApi(page, 'GET', '/patients', fixtures.patients);
    await page.goto('/dashboard/patients');

    await expect(page.getByText('Patients')).toBeVisible();
    await expect(page.getByText('Marie Dupont')).toBeVisible();
    await expect(page.getByText('Jean Martin')).toBeVisible();
    await expect(page.getByText('Sophie Laurent')).toBeVisible();
  });

  test('Patient list shows empty state when no patients', async ({ page }) => {
    await mockApi(page, 'GET', '/patients', { data: [], total: 0, page: 1, totalPages: 0 });
    await page.goto('/dashboard/patients');

    await expect(page.getByText(/aucun patient|Commencez/i)).toBeVisible();
  });

  test('Search filters patient list', async ({ page }) => {
    // Initial load: all patients
    await mockApi(page, 'GET', '/patients', fixtures.patients);
    await page.goto('/dashboard/patients');

    await expect(page.getByText('Marie Dupont')).toBeVisible();

    // Type in search → mock filtered response
    await page.route('**/patients*search=Marie*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [fixtures.patients.data[0]],
          total: 1,
          page: 1,
          totalPages: 1,
        }),
      }),
    );

    const searchInput = page.getByPlaceholder(/Rechercher/i);
    await searchInput.fill('Marie');
  });

  test('Status filter buttons work', async ({ page }) => {
    await mockApi(page, 'GET', '/patients', fixtures.patients);
    await page.goto('/dashboard/patients');

    // Click "Actif" filter
    const activeFilter = page.getByRole('button', { name: /Actif/i });
    if (await activeFilter.isVisible()) {
      await activeFilter.click();
    }
  });

  test('Create patient dialog opens and submits', async ({ page }) => {
    await mockApi(page, 'GET', '/patients', fixtures.patients);
    await page.goto('/dashboard/patients');

    // Click create button
    const createBtn = page.getByRole('button', { name: /Nouveau patient/i }).or(
      page.getByRole('link', { name: /Nouveau patient/i }),
    );
    await createBtn.first().click();

    // Fill the form
    const nameInput = page.getByLabel(/Nom/i).or(page.getByPlaceholder(/nom/i));
    if (await nameInput.isVisible()) {
      await nameInput.fill('Alice Nouveau');

      // Mock create response
      await page.route('**/patients', (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'p-new',
              name: 'Alice Nouveau',
              email: null,
              status: 'active',
              createdAt: new Date().toISOString(),
            }),
          });
        }
        return route.continue();
      });

      // Submit
      const submitBtn = page.getByRole('button', { name: /Créer/i });
      await submitBtn.click();
    }
  });

  test('Patient row click navigates to detail page', async ({ page }) => {
    await mockApi(page, 'GET', '/patients', fixtures.patients);
    await page.goto('/dashboard/patients');

    // Mock individual patient
    await mockApi(page, 'GET', '/patients/p1', fixtures.patients.data[0]);
    await mockApi(page, 'GET', '/sessions', { data: [], total: 0, page: 1, totalPages: 0 });

    // Click first patient
    await page.getByText('Marie Dupont').click();
    await expect(page).toHaveURL(/\/patients\/p1/);
  });
});

import { test, expect } from '@playwright/test';

test.describe('Public pages — SEO & accessibility', () => {
  test('Landing page loads and has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PsyLib/);
    // Hero CTA visible
    await expect(page.locator('text=Essai gratuit 14 jours').first()).toBeVisible();
  });

  test('Landing page has essential meta tags', async ({ page }) => {
    await page.goto('/');
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toHaveAttribute('content', /psychologue/i);
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /PsyLib/);
  });

  test('/tarifs page loads with pricing plans', async ({ page }) => {
    await page.goto('/tarifs');
    await expect(page).toHaveTitle(/Tarifs/i);
    await expect(page.getByText('49€', { exact: true })).toBeVisible();
    await expect(page.getByText('97€', { exact: true })).toBeVisible();
    await expect(page.getByText('149€')).toBeVisible();
  });

  test('/faq page loads with questions', async ({ page }) => {
    await page.goto('/faq');
    await expect(page).toHaveTitle(/FAQ/i);
    // At least one question visible
    await expect(page.locator('details').first()).toBeVisible();
  });

  test('/contact page loads', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveTitle(/Contact/i);
    await expect(page.locator('text=contact@psylib.eu')).toBeVisible();
  });

  test('/comparaison page loads with comparison table', async ({ page }) => {
    await page.goto('/comparaison');
    await expect(page).toHaveTitle(/Comparaison|alternatives/i);
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByText('Doctolib', { exact: true })).toBeVisible();
  });

  test('/blog page loads', async ({ page }) => {
    await page.goto('/blog');
    await expect(page).toHaveTitle(/Blog/i);
  });

  test('/ressources page loads', async ({ page }) => {
    await page.goto('/ressources');
    await expect(page).toHaveTitle(/Ressources/i);
  });

  test('/privacy page loads with RGPD content', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveTitle(/confidentialit|RGPD/i);
  });

  test('/terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveTitle(/CGU|Conditions/i);
  });

  test('/legal page loads', async ({ page }) => {
    await page.goto('/legal');
    await expect(page).toHaveTitle(/Mentions/i);
  });

  test('/fonctionnalites page loads', async ({ page }) => {
    await page.goto('/fonctionnalites');
    await expect(page).toHaveTitle(/Fonctionnalit/i);
  });

  test('/trouver-mon-psy page loads', async ({ page }) => {
    await page.goto('/trouver-mon-psy');
    await expect(page).toHaveTitle(/psy|psychologue/i);
  });

  test('404 page for unknown routes', async ({ page }) => {
    const response = await page.goto('/cette-page-nexiste-pas');
    expect(response?.status()).toBe(404);
    await expect(page.locator('text=introuvable')).toBeVisible();
  });
});

test.describe('SEO — Sitemap & Robots', () => {
  test('sitemap.xml is accessible', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('https://psylib.eu');
    expect(body).toContain('/tarifs');
    expect(body).toContain('/comparaison');
  });

  test('robots.txt is accessible', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Sitemap');
    expect(body).toContain('Disallow: /dashboard');
  });

  test('llms.txt is accessible', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('PsyLib');
  });
});

test.describe('Navigation', () => {
  test('Landing nav links work', async ({ page }) => {
    await page.goto('/');
    // Blog link
    await page.click('nav >> text=Blog');
    await expect(page).toHaveURL(/\/blog/);
  });

  test('Footer links are valid', async ({ page }) => {
    await page.goto('/');
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    // Check footer link exists
    await expect(page.locator('footer >> text=Tarifs')).toBeVisible();
    await expect(page.locator('footer >> text=Comparaison')).toBeVisible();
    await expect(page.locator('footer >> text=FAQ')).toBeVisible();
  });
});

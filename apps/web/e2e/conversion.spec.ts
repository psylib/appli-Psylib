import { test, expect } from '@playwright/test';

test.describe('Conversion flows', () => {
  test('CTA section has email form', async ({ page }) => {
    await page.goto('/');
    // Scroll to CTA section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 800));
    await page.waitForTimeout(500);
    // Email input should be present
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('Footer newsletter form is present', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    // Newsletter section in footer
    await expect(page.locator('footer >> text=Newsletter')).toBeVisible();
  });

  test('Lead nurture CTA is visible on landing', async ({ page }) => {
    await page.goto('/');
    // Scroll to lead nurture section
    const nurture = page.locator('text=kit de démarrage');
    await nurture.scrollIntoViewIfNeeded();
    await expect(nurture).toBeVisible();
  });

  test('/tarifs page has CTA buttons', async ({ page }) => {
    await page.goto('/tarifs');
    // Should have trial CTA
    await expect(page.getByText("Commencer l'essai gratuit").first()).toBeVisible();
    // Should have comparison link
    await expect(page.locator('text=Comparer avec les alternatives')).toBeVisible();
  });

  test('/comparaison page has final CTA', async ({ page }) => {
    await page.goto('/comparaison');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 400));
    await page.waitForTimeout(300);
    await expect(page.locator("text=Démarrer l'essai gratuit")).toBeVisible();
  });
});

test.describe('SEO structure', () => {
  test('Landing page has JSON-LD schema', async ({ page }) => {
    await page.goto('/');
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const content = await jsonLd.first().textContent();
    expect(content).toContain('PsyLib');
    expect(content).toContain('SoftwareApplication');
  });

  test('/comparaison page has JSON-LD', async ({ page }) => {
    await page.goto('/comparaison');
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const content = await jsonLd.first().textContent();
    expect(content).toContain('BreadcrumbList');
  });

  test('OG image is set on landing', async ({ page }) => {
    await page.goto('/');
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /opengraph-image/);
  });

  test('Canonical URL is set', async ({ page }) => {
    await page.goto('/');
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /psylib\.eu/);
  });

  test('hreflang is set', async ({ page }) => {
    await page.goto('/');
    const hreflang = page.locator('link[hreflang="fr-FR"]');
    await expect(hreflang).toHaveAttribute('href', /psylib\.eu/);
  });

  test('Manifest is linked', async ({ page }) => {
    await page.goto('/');
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute('href', /manifest/);
  });
});

test.describe('Performance basics', () => {
  test('Landing page loads under 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
  });

  test('Tarifs page loads under 2s', async ({ page }) => {
    const start = Date.now();
    await page.goto('/tarifs', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(2000);
  });
});

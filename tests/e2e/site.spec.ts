import { expect, test } from '@playwright/test';
import { allRoutes } from './routes';

test.use({ reducedMotion: 'reduce' });

for (const route of allRoutes) {
  test(`${route} loads without errors, broken requests or broken images`, async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
    });
    page.on('pageerror', (error) => problems.push(`js: ${error.message}`));
    page.on('response', (response) => {
      if (
        response.url().startsWith('http://localhost') &&
        response.status() >= 400
      )
        problems.push(`${response.status()} ${response.url()}`);
    });
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    // Load lazy images, then confirm every image decoded.
    await page.evaluate(() =>
      document
        .querySelectorAll('img')
        .forEach((img) => (img.loading = 'eager')),
    );
    await page.waitForLoadState('networkidle');
    const broken = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
    expect(broken).toEqual([]);
    expect(problems).toEqual([]);
  });
}

test('unknown routes return a genuine 404 with the branded page', async ({
  page,
}) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText(/get you back/i);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  for (const href of ['/', '/services/', '/contact/', 'tel:+918448496343'])
    await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible();
  await expect(
    page.locator('main a[href^="https://wa.me/918448496343"]'),
  ).toBeVisible();
});

test('thank-you page is noindex and links home and contact', async ({
  page,
}) => {
  await page.goto('/thank-you/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: /back to home/i }),
  ).toHaveAttribute('href', '/');
  await expect(
    page.getByRole('link', { name: /back to contact/i }),
  ).toHaveAttribute('href', '/contact/');
});

test('favicons and manifest resolve', async ({ request }) => {
  for (const path of [
    '/favicon.ico',
    '/favicon.svg',
    '/favicon-48x48.png',
    '/favicon-96x96.png',
    '/apple-touch-icon.png',
    '/icon-192x192.png',
    '/icon-512x512.png',
    '/site.webmanifest',
    '/images/og-image.jpg',
    '/robots.txt',
    '/sitemap.xml',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { allRoutes } from './routes';

// Reduced motion keeps scroll-reveal content fully visible during the scan.
test.use({ reducedMotion: 'reduce' });
test.setTimeout(90_000);

for (const route of [...allRoutes, '/missing-page/']) {
  test(`${route} has no WCAG 2.1 A/AA violations`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
    );
    expect(summary).toEqual([]);
  });
}

test('skip link is the first focusable element and moves focus to main', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('keyboard focus is visibly indicated', async ({ page }) => {
  await page.goto('/');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab');
    const indicator = await page.evaluate(() => {
      const style = getComputedStyle(document.activeElement as Element);
      return {
        outline:
          style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
        shadow: style.boxShadow !== 'none',
      };
    });
    expect(indicator.outline || indicator.shadow).toBe(true);
  }
});

test('form errors are announced through an alert region', async ({ page }) => {
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Send enquiry' }).click();
  await expect(page.getByRole('alert')).toHaveText(/highlighted fields/);
});

test('decorative motion stops for reduced-motion users', async ({ page }) => {
  await page.goto('/');
  const running = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (a) =>
            a.playState === 'running' &&
            (a.effect?.getComputedTiming().iterations ?? 0) === Infinity,
        ).length,
  );
  expect(running).toBe(0);
});

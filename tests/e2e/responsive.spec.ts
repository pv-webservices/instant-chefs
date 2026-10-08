import { expect, test } from '@playwright/test';
import { allRoutes } from './routes';

const WIDTHS = [320, 375, 768, 1024, 1440];
const MIN_TARGET = 24; // WCAG 2.2 target size (minimum), stricter than 2.1 AA

test.use({ reducedMotion: 'reduce' });

for (const width of WIDTHS) {
  test(`no horizontal overflow and usable controls at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of allRoutes) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(
        overflow,
        `${route} overflows by ${overflow}px`,
      ).toBeLessThanOrEqual(0);
      const smallTargets = await page.evaluate((min) => {
        const controls = document.querySelectorAll<HTMLElement>(
          'button, .btn, .button, nav a, summary, input, select, textarea',
        );
        return Array.from(controls)
          .filter(
            (el) =>
              el.offsetParent !== null &&
              el.getAttribute('aria-hidden') !== 'true',
          )
          .filter(
            (el) => el.closest('[aria-hidden="true"], .breadcrumb') === null,
          )
          .map((el) => ({ el, rect: el.getBoundingClientRect() }))
          .filter(({ el, rect }) => {
            const isCheckbox =
              el instanceof HTMLInputElement && el.type === 'checkbox';
            const minimum = isCheckbox ? 20 : min;
            return (
              rect.width > 0 && (rect.width < minimum || rect.height < minimum)
            );
          })
          .map(
            ({ el, rect }) =>
              `${el.tagName}.${el.className} ${Math.round(rect.width)}x${Math.round(rect.height)}`,
          );
      }, MIN_TARGET);
      expect(smallTargets, route).toEqual([]);
    }
    // Navigation is usable: desktop nav or the mobile menu toggle is visible.
    await page.goto('/');
    const toggle = page.locator('#menu-toggle');
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(page.locator('#mobile-navigation')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('#mobile-navigation')).toBeHidden();
      await expect(toggle).toBeFocused();
    } else {
      await expect(page.locator('.ic-nav')).toBeVisible();
    }
  });
}

import { test, expect } from '@playwright/test';

/**
 * Domain 21 — Podcasts smoke spec.
 * Validates list/detail/player surfaces render without console errors.
 * Detailed checkout/recording flows are exercised in integration suites.
 */
const ROUTES = [
  '/podcasts',
  '/podcasts/discovery',
  '/podcasts/library',
  '/podcasts/queue',
  '/podcasts/recorder',
  '/podcasts/purchases',
  '/podcasts/analytics',
  '/podcasts/creator-studio',
  '/explore/podcasts',
];

test.describe('Domain 21 — Podcasts surfaces', () => {
  for (const route of ROUTES) {
    test(`renders ${route} without runtime errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toBeVisible();
      expect(errors.filter((e) => !/(favicon|workbox|sourcemap)/i.test(e))).toEqual([]);
    });
  }
});

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Trust & Safety / ML — Domain 71', () => {
  for (const path of [
    '/internal/trust-safety-ml-dashboard',
    '/internal/trust-safety',
    '/internal/trust-safety/cases',
    '/internal/trust-safety/signals',
    '/internal/trust-safety/watchlist',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

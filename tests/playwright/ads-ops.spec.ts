import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Ads Ops — Domain 72', () => {
  for (const path of [
    '/internal/ads-ops-dashboard',
    '/internal/ads-ops/reviews',
    '/internal/ads-ops/geo-rules',
    '/internal/ads-ops/keyword-rules',
    '/internal/ads-ops/campaign-controls',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

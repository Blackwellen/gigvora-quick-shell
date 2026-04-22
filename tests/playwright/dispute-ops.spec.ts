import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Dispute Ops — Domain 69', () => {
  for (const path of [
    '/internal/dispute-operations-dashboard',
    '/internal/disputes',
    '/disputes',
    '/disputes/history',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

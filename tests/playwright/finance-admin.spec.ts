import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Finance Admin — Domain 68', () => {
  for (const path of [
    '/internal/finance-admin-dashboard',
    '/internal/finance',
    '/internal/finance-dashboard',
    '/internal/compliance',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Verification & Compliance — Domain 73', () => {
  for (const path of [
    '/internal/verification-compliance-dashboard',
    '/internal/verification-compliance/cases',
    '/internal/verification-compliance/documents',
    '/internal/verification-compliance/checks',
    '/internal/verification-compliance/watchlist',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Internal Admin Shell — Domain 66', () => {
  for (const path of [
    '/internal/admin-shell',
    '/internal/admin-login',
    '/internal/dispute-operations-dashboard',
    '/internal/moderator-dashboard',
    '/internal/trust-safety-ml-dashboard',
    '/internal/verification-compliance-dashboard',
    '/internal/finance-admin-dashboard',
    '/internal/ads-ops-dashboard',
    '/internal/super-admin-command-center',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

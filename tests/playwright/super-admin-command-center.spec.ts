import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Super Admin Command Center — Domain 74', () => {
  for (const path of [
    '/internal/super-admin-command-center',
    '/internal/super-admin-command-center/flags',
    '/internal/super-admin-command-center/overrides',
    '/internal/super-admin-command-center/incidents',
    '/internal/super-admin-command-center/audit',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

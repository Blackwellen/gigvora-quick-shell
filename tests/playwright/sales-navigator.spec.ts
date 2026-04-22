import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Sales Navigator', () => {
  for (const path of [
    '/sales-navigator',
    '/sales-navigator/leads',
    '/sales-navigator/talent',
    '/sales-navigator/accounts',
    '/sales-navigator/company-intel',
    '/sales-navigator/smart-leads',
    '/sales-navigator/saved',
    '/sales-navigator/outreach',
    '/sales-navigator/relationships',
    '/sales-navigator/geo',
    '/sales-navigator/signals',
    '/sales-navigator/seats',
    '/sales-navigator/analytics',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

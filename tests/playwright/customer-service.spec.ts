import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Customer Service — Domain 67', () => {
  for (const path of [
    '/internal/customer-service',
    '/help/submit',
    '/help/tickets',
    '/help/escalations',
    '/help/advisor',
    '/disputes',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

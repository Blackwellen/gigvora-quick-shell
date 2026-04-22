import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Moderator Dashboard — Domain 70', () => {
  for (const path of [
    '/internal/moderator-dashboard',
    '/internal/moderation',
    '/internal/moderation/queue',
    '/internal/moderation/messaging-incidents',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

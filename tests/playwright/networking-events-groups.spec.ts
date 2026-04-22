import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Networking + Events + Groups', () => {
  for (const path of [
    '/networking', '/networking/rooms', '/networking/speed', '/networking/cards',
    '/events', '/events/discover', '/events/mine',
    '/groups', '/groups/discover', '/groups/mine',
  ]) {
    test(`mounts: ${path}`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

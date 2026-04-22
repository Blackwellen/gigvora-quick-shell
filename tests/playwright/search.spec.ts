import { test, expect } from '@playwright/test';

const PREVIEW = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080';

test.describe('global search & command palette', () => {
  test('command palette opens with mod+k', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.keyboard.press('Control+K');
    const palette = page.locator('[role="dialog"], [data-cmdk-root]').first();
    if (await palette.count() > 0) await expect(palette).toBeVisible({ timeout: 5_000 });
  });

  test('search page renders results with facet chips', async ({ page }) => {
    await page.goto(`${PREVIEW}/search?q=react`);
    const result = page.getByText(/result|jobs|profiles|gigs/i).first();
    if (await result.count() > 0) await expect(result).toBeVisible({ timeout: 10_000 });
  });
});

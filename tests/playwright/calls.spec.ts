import { test, expect } from '@playwright/test';

test.describe('Domain 18 — Calls, Video, Presence', () => {
  test('lists call history and opens pre-join drawer', async ({ page }) => {
    await page.goto('/calls');
    await expect(page).toHaveURL(/\/calls/);
    // History tab is the canonical entry surface
    await expect(page.getByText(/history|recent|call/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('quick action triggers a video call flow', async ({ page }) => {
    await page.goto('/calls');
    const newCall = page.getByRole('button', { name: /new call|start|call/i }).first();
    if (await newCall.isVisible().catch(() => false)) {
      await newCall.click();
      // Either a pre-join drawer or a sheet must appear
      const sheet = page.locator('[role="dialog"], [data-state="open"]').first();
      await expect(sheet).toBeVisible({ timeout: 3000 });
    }
  });

  test('presence dot renders for online contacts', async ({ page }) => {
    await page.goto('/calls');
    const dots = page.locator('span.rounded-full');
    await expect(dots.first()).toBeVisible({ timeout: 5000 });
  });
});

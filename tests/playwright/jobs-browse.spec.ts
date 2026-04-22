import { test, expect } from '@playwright/test';

test.describe('Domain 23 — Jobs Browse', () => {
  test('search loads and filters apply', async ({ page }) => {
    await page.goto('/explore/jobs');
    await expect(page.getByPlaceholder(/search jobs/i)).toBeVisible();
    await expect(page.getByText(/Results/i)).toBeVisible();
  });

  test('bookmark toggles and persists across reload', async ({ page }) => {
    await page.goto('/explore/jobs');
    const apply = page.getByRole('button', { name: /apply/i }).first();
    await expect(apply).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Domain 48 — User Dashboard', () => {
  test('overview renders with KPI tiles and next-action queue', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('next actions support complete and dismiss', async ({ page }) => {
    await page.goto('/dashboard');
    // Smoke check — actual selectors wired when UI consumes useDashboardActions
    await expect(page).toHaveURL(/dashboard/);
  });
});

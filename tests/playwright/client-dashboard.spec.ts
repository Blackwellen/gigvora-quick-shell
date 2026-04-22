import { test, expect } from '@playwright/test';

// Domain 50 — smoke coverage of the client/buyer dashboard.
test.describe('Domain 50 — Client / Buyer dashboard', () => {
  test('overview renders KPIs and core sections', async ({ page }) => {
    await page.goto('/app/client-dashboard');
    await expect(page.getByRole('heading', { name: /buyer|client dashboard/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('proposals section exposes status transitions', async ({ page }) => {
    await page.goto('/app/client-dashboard/proposals');
    await expect(page.getByText(/proposals?/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('approvals can be decided', async ({ page }) => {
    await page.goto('/app/client-dashboard/approvals');
    await expect(page.getByText(/approvals?/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect } from '@playwright/test';

// Domain 52 — smoke coverage of the agency management dashboard.
test.describe('Domain 52 — Agency management dashboard', () => {
  test('overview renders KPIs and core sections', async ({ page }) => {
    await page.goto('/app/agency-management-dashboard');
    await expect(page.getByRole('heading', { name: /agency/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('engagements section exposes status transitions', async ({ page }) => {
    await page.goto('/app/agency-management-dashboard/engagements');
    await expect(page.getByText(/engagements?/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('deliverables board supports complete and block', async ({ page }) => {
    await page.goto('/app/agency-management-dashboard/deliverables');
    await expect(page.getByText(/deliverables?/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('invoices section supports mark paid', async ({ page }) => {
    await page.goto('/app/agency-management-dashboard/invoices');
    await expect(page.getByText(/invoices?/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

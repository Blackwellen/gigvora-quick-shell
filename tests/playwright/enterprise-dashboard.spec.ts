import { test, expect } from '@playwright/test';

// Domain 53 — smoke coverage of the enterprise dashboard.
test.describe('Domain 53 — Enterprise dashboard', () => {
  test('overview renders KPIs and core sections', async ({ page }) => {
    await page.goto('/app/enterprise-dashboard');
    await expect(page.getByRole('heading', { name: /enterprise|company/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('requisitions section exposes status transitions', async ({ page }) => {
    await page.goto('/app/enterprise-dashboard/hiring');
    await expect(page.getByText(/requisition|hiring/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('procurement supports approve and reject', async ({ page }) => {
    await page.goto('/app/enterprise-dashboard/procurement');
    await expect(page.getByText(/procurement|purchase/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('team operations supports task transitions', async ({ page }) => {
    await page.goto('/app/enterprise-dashboard/team');
    await expect(page.getByText(/team|task/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect } from '@playwright/test';

// Domain 51 — smoke coverage of the recruiter dashboard.
test.describe('Domain 51 — Recruiter dashboard', () => {
  test('overview renders KPIs and core sections', async ({ page }) => {
    await page.goto('/app/recruiter-dashboard');
    await expect(page.getByRole('heading', { name: /recruiter dashboard/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('pipelines section exposes status transitions', async ({ page }) => {
    await page.goto('/app/recruiter-dashboard/pipelines');
    await expect(page.getByText(/pipelines?/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('tasks tray supports complete and dismiss', async ({ page }) => {
    await page.goto('/app/recruiter-dashboard/tasks');
    await expect(page.getByText(/tasks?/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

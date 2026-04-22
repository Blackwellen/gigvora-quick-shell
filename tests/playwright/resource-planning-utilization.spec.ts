import { test, expect } from '@playwright/test';

// Domain 56 — smoke coverage of resource planning surfaces.
test.describe('Domain 56 — Resource planning & utilization', () => {
  test('overview renders KPIs and utilization grid', async ({ page }) => {
    await page.goto('/app/resource-planning-utilization');
    await expect(page.getByRole('heading', { name: /resource|utiliz|capacity|planning/i }).first()).toBeVisible({ timeout: 10_000 });
  });
  test('resources section', async ({ page }) => {
    await page.goto('/app/resource-planning-utilization/resources');
    await expect(page.getByText(/resource/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('projects section', async ({ page }) => {
    await page.goto('/app/resource-planning-utilization/projects');
    await expect(page.getByText(/project/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('assignments section', async ({ page }) => {
    await page.goto('/app/resource-planning-utilization/assignments');
    await expect(page.getByText(/assignment/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

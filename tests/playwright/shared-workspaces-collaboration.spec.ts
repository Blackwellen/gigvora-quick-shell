import { test, expect } from '@playwright/test';

// Domain 55 — smoke coverage of shared workspaces, notes & handoffs.
test.describe('Domain 55 — Shared workspaces & collaboration', () => {
  test('overview renders KPIs and core sections', async ({ page }) => {
    await page.goto('/app/shared-workspaces-collaboration');
    await expect(page.getByRole('heading', { name: /workspace|collaboration|handoff/i }).first()).toBeVisible({ timeout: 10_000 });
  });
  test('workspaces section', async ({ page }) => {
    await page.goto('/app/shared-workspaces-collaboration/workspaces');
    await expect(page.getByText(/workspace/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('notes section', async ({ page }) => {
    await page.goto('/app/shared-workspaces-collaboration/notes');
    await expect(page.getByText(/note/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('handoffs section', async ({ page }) => {
    await page.goto('/app/shared-workspaces-collaboration/handoffs');
    await expect(page.getByText(/handoff/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect } from '@playwright/test';

// Domain 60 — smoke coverage of Ads Manager surfaces.
test.describe('Domain 60 — Ads Manager Builder', () => {
  test('overview', async ({ page }) => {
    await page.goto('/app/ads-manager-builder');
    await expect(page.getByText(/campaign|active|spend|budget|review/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('campaigns list', async ({ page }) => {
    await page.goto('/app/ads-manager-builder/campaigns');
    await expect(page.getByText(/campaign|status|objective/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('creatives library', async ({ page }) => {
    await page.goto('/app/ads-manager-builder/creatives');
    await expect(page.getByText(/creative|format|headline/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('builder', async ({ page }) => {
    await page.goto('/app/ads-manager-builder/builder');
    await expect(page.getByText(/build|name|objective|budget/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

import { test, expect } from '@playwright/test';

// Domain 61 — smoke coverage of Ads Analytics surfaces.
test.describe('Domain 61 — Ads Analytics & Performance', () => {
  test('overview', async ({ page }) => {
    await page.goto('/app/ads-analytics-performance');
    await expect(page.getByText(/spend|ctr|cpc|cpm|cpa|roas|impression/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('reports', async ({ page }) => {
    await page.goto('/app/ads-analytics-performance/reports');
    await expect(page.getByText(/report|metric|filter|group/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('alerts', async ({ page }) => {
    await page.goto('/app/ads-analytics-performance/alerts');
    await expect(page.getByText(/alert|threshold|metric|channel/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('creative scores', async ({ page }) => {
    await page.goto('/app/ads-analytics-performance/creative-scores');
    await expect(page.getByText(/creative|score|band|fatigue|ctr/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

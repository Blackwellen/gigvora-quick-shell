import { test, expect } from '@playwright/test';

// Domain 64 — smoke coverage for Pricing, Promotions & Monetization surfaces.
test.describe('Domain 64 — Pricing, Promotions & Monetization', () => {
  test('overview', async ({ page }) => {
    await page.goto('/app/pricing-promotions-monetization');
    await expect(page.getByText(/package|promotion|quote|price|tier/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('packages', async ({ page }) => {
    await page.goto('/app/pricing-promotions-monetization/packages');
    await expect(page.getByText(/starter|pro|enterprise|tier|feature|month/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('promotions', async ({ page }) => {
    await page.goto('/app/pricing-promotions-monetization/promotions');
    await expect(page.getByText(/code|discount|percent|fixed|redemption/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('quotes', async ({ page }) => {
    await page.goto('/app/pricing-promotions-monetization/quotes');
    await expect(page.getByText(/quote|total|subtotal|customer|valid/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

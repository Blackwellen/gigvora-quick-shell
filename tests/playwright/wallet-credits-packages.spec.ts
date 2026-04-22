import { test, expect } from '@playwright/test';

// Domain 57 — smoke coverage of wallet & purchase surfaces.
test.describe('Domain 57 — Wallet, credits, packages & purchases', () => {
  test('overview renders wallet, KPIs, and catalog', async ({ page }) => {
    await page.goto('/app/wallet-credits-packages');
    await expect(page.getByText(/wallet|credits|balance|catalog|package/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('packages section', async ({ page }) => {
    await page.goto('/app/wallet-credits-packages/packages');
    await expect(page.getByText(/package/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('purchases section', async ({ page }) => {
    await page.goto('/app/wallet-credits-packages/purchases');
    await expect(page.getByText(/purchase|invoice|receipt/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('payouts section', async ({ page }) => {
    await page.goto('/app/wallet-credits-packages/payouts');
    await expect(page.getByText(/payout/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

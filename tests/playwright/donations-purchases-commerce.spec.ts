import { test, expect } from '@playwright/test';

// Domain 63 — smoke coverage of Donations, Purchases & Creator Commerce surfaces.
test.describe('Domain 63 — Donations, Purchases & Creator Commerce', () => {
  test('overview', async ({ page }) => {
    await page.goto('/app/donations-purchases-commerce');
    await expect(page.getByText(/storefront|product|pledge|donation|order|tip/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('purchases', async ({ page }) => {
    await page.goto('/app/donations-purchases-commerce/purchases');
    await expect(page.getByText(/order|purchase|receipt|invoice/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('donations', async ({ page }) => {
    await page.goto('/app/donations-purchases-commerce/donations');
    await expect(page.getByText(/donation|tip|amount|message/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('patronage', async ({ page }) => {
    await page.goto('/app/donations-purchases-commerce/patronage');
    await expect(page.getByText(/patron|tier|monthly|pledge/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

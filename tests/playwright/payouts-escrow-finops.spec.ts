import { test, expect } from '@playwright/test';

// Domain 59 — smoke coverage of payouts/escrow/finops surfaces.
test.describe('Domain 59 — Payouts, escrow & finops', () => {
  test('overview', async ({ page }) => {
    await page.goto('/app/payouts-escrow-finops');
    await expect(page.getByText(/payout|escrow|available|reserved|hold/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('payouts list', async ({ page }) => {
    await page.goto('/app/payouts-escrow-finops/payouts');
    await expect(page.getByText(/payout|amount|status/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('escrows list', async ({ page }) => {
    await page.goto('/app/payouts-escrow-finops/escrows');
    await expect(page.getByText(/escrow|held|release/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('holds queue', async ({ page }) => {
    await page.goto('/app/payouts-escrow-finops/holds');
    await expect(page.getByText(/hold|risk|kyc|manual/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

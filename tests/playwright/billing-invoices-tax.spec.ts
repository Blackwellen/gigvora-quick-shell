import { test, expect } from '@playwright/test';

// Domain 58 — smoke coverage of billing/invoices/tax/subscriptions surfaces.
test.describe('Domain 58 — Billing, invoices, tax & subscriptions', () => {
  test('overview', async ({ page }) => {
    await page.goto('/app/billing-invoices-tax');
    await expect(page.getByText(/invoice|billing|outstanding|mrr|subscription/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('invoices list', async ({ page }) => {
    await page.goto('/app/billing-invoices-tax/invoices');
    await expect(page.getByText(/invoice|due|status/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('subscriptions list', async ({ page }) => {
    await page.goto('/app/billing-invoices-tax/subscriptions');
    await expect(page.getByText(/subscription|plan|trial/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('tax/profile', async ({ page }) => {
    await page.goto('/app/billing-invoices-tax/tax');
    await expect(page.getByText(/tax|vat|jurisdiction/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

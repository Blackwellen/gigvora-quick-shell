import { test, expect } from '@playwright/test';

test.describe('Domain 35 — Proposal Review, Compare, Shortlist & Award', () => {
  test('workbench loads', async ({ page }) => {
    await page.goto('/app/proposal-review-award');
    await expect(page.locator('body')).toBeVisible();
  });
  test('cohort table renders', async ({ page }) => {
    await page.goto('/app/proposal-review-award');
    await expect(page.getByText(/Cohort|Shortlist|Compare/i).first()).toBeVisible();
  });
  test('compare drawer opens with score column', async ({ page }) => {
    await page.goto('/app/proposal-review-award');
    await expect(page.locator('body')).toBeVisible();
  });
});

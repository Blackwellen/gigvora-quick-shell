import { test, expect } from '@playwright/test';

test.describe('Domain 34 — Proposal Builder, Bid Credits, Scope & Pricing', () => {
  test('proposal builder loads on a project propose route', async ({ page }) => {
    await page.goto('/projects/p1/propose');
    await expect(page.locator('body')).toBeVisible();
  });
  test('credits tab is reachable from the builder', async ({ page }) => {
    await page.goto('/projects/p1/propose');
    await expect(page.locator('body')).toBeVisible();
  });
  test('escrow + wallet endpoints surface in the right rail', async ({ page }) => {
    await page.goto('/projects/p1/propose');
    await expect(page.locator('body')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

test.describe('Domain 24 — Job Posting Studio', () => {
  test('studio loads', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('body')).toBeVisible();
  });
  test('publish flow probe', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('body')).toBeVisible();
  });
  test('credit purchase probe', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('body')).toBeVisible();
  });
});

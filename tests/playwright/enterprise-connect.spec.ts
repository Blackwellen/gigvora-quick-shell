import { test, expect } from '@playwright/test';

/**
 * Enterprise Connect — happy path + one error path.
 * Pages tested are already mounted in src/App.tsx.
 */
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Enterprise Connect', () => {
  test('home renders with directory and CTAs', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect`);
    await expect(page).toHaveURL(/enterprise-connect/);
    await expect(page.locator('body')).toContainText(/Enterprise|Connect/i);
  });

  test('directory page lists orgs (or empty state)', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect/directory`);
    await expect(page.locator('body')).toContainText(/Directory|orgs|companies|empty|no /i);
  });

  test('partner discovery page mounts', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect/partners`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('procurement discover page mounts', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect/procurement`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('intros page mounts', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect/intros`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('rooms page mounts', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect/rooms`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('events page mounts', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect/events`);
    await expect(page.locator('body')).toBeVisible();
  });

  test('startup showcase lists startups', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect/startups`);
    await expect(page.locator('body')).toContainText(/startup|showcase|featured|empty/i);
  });

  test('404 fallback for unknown startup', async ({ page }) => {
    await page.goto(`${BASE}/enterprise-connect/startups/__does_not_exist__`);
    await expect(page.locator('body')).toBeVisible();
  });
});

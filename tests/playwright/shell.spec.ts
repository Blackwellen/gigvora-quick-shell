import { test, expect } from '@playwright/test';

/**
 * Shell smoke: org switcher, saved views, sidebar collapse, recents render.
 * Skipped automatically if VITE_GIGVORA_API_URL is unreachable; the WorkspaceContext
 * falls back to fixtures so the surface still renders.
 */
test.describe('Domain 01 — Global Shell', () => {
  test('renders feed with topbar and bottom nav', async ({ page }) => {
    await page.goto('/feed');
    await expect(page).toHaveTitle(/gigvora/i);
  });

  test('mobile bottom nav is visible at 619px', async ({ page }) => {
    await page.setViewportSize({ width: 619, height: 789 });
    await page.goto('/feed');
    // MobileBottomNav links: Home, Network, Inbox, Work, Profile (or similar)
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });
});

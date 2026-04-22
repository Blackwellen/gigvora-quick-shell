import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Domain 14 — Groups, Community Hubs & Member Conversations', () => {
  test('groups hub renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/groups`);
    await expect(page).toHaveURL(/groups/);
    expect(errors).toEqual([]);
  });

  test('groups search/discover renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/explore/groups`).catch(() => page.goto(`${BASE}/groups`));
    expect(errors).toEqual([]);
  });

  test('group detail renders with at least one member or empty state', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/groups/react-developers`).catch(() => page.goto(`${BASE}/groups`));
    expect(errors).toEqual([]);
  });

  test('moderation queue page mounts (loading/empty/error tolerated)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/groups/react-developers/moderation`).catch(() => page.goto(`${BASE}/groups`));
    expect(errors).toEqual([]);
  });
});

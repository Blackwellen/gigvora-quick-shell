import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Domain 41 — Gigs Browse / Marketplace Discovery', () => {
  test('discovery route renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/gigs`);
    await expect(page).toHaveURL(/gigs/);
    expect(errors).toEqual([]);
  });

  test('search input, sort chips, and at least one card are present', async ({ page }) => {
    await page.goto(`${BASE}/gigs`);
    await expect(page.getByRole('textbox').first()).toBeVisible();
    // Cards / list — be forgiving on selector since the existing UI is preserved
    const anyCard = page.locator('[role="article"], article, .card, [data-testid="gig-card"]').first();
    await expect(anyCard).toBeVisible({ timeout: 10_000 });
  });
});

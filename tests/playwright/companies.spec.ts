import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Domain 12 — Company pages smoke', () => {
  test('companies route renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/companies`);
    await expect(page).toHaveURL(/companies/);
    expect(errors).toEqual([]);
  });
});

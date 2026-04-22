import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Domain 11 — Profile surface smoke', () => {
  test('profile route renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/profile`);
    await expect(page).toHaveURL(/profile/);
    expect(errors).toEqual([]);
  });

  test('profile edit tabs are present', async ({ page }) => {
    await page.goto(`${BASE}/profile/edit`);
    // Tabs from ProfileEditPage
    for (const label of ['Basic Info', 'Experience', 'Skills', 'Portfolio', 'Visibility']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });
});

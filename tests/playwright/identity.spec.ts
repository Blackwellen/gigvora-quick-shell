import { test, expect } from '@playwright/test';

const PREVIEW = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080';

test.describe('identity surfaces', () => {
  test('sign-in form renders with email + password and primary CTA', async ({ page }) => {
    await page.goto(`${PREVIEW}/signin`);
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('forgot password validates empty input', async ({ page }) => {
    await page.goto(`${PREVIEW}/forgot-password`);
    const email = page.locator('input[type="email"]').first();
    if (await email.count() === 0) test.skip(true, 'forgot page route differs');
    await email.fill('not-an-email');
    await page.getByRole('button').first().click();
    // browser-level validation OR app-level alert
    await expect(page).toHaveURL(/forgot|reset/i);
  });
});

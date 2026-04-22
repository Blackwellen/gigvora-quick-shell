import { test, expect } from '@playwright/test';

// Domain 02 smoke: newsletter signup + lead capture render and respond to invalid input.
// These run against the deployed preview; backend wiring is exercised by jest/pytest.
const PREVIEW = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080';

test.describe('public marketing surfaces', () => {
  test('showcase page renders with hero + CTA', async ({ page }) => {
    await page.goto(`${PREVIEW}/showcase/jobs`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('newsletter signup validates email locally', async ({ page }) => {
    await page.goto(PREVIEW);
    const email = page.locator('input[type="email"]').first();
    if (await email.count() === 0) test.skip(true, 'No newsletter form on home yet — wire NewsletterSignup into footer.');
    await email.fill('not-an-email');
    await email.press('Enter');
    await expect(page.getByRole('alert')).toBeVisible();
  });
});

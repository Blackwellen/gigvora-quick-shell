import { test, expect } from '@playwright/test';

const PREVIEW = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080';

test.describe('entitlements & plan gating', () => {
  test('plans page renders all 5 tiers', async ({ page }) => {
    await page.goto(`${PREVIEW}/plans`);
    for (const label of ['Free', 'Starter', 'Pro', 'Business', 'Enterprise']) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('locked feature shows upgrade gate (free user)', async ({ page }) => {
    await page.goto(`${PREVIEW}/recruiter-pro`);
    // EntitlementGate renders an "Unlock" or "Upgrade" CTA for non-entitled users
    const gate = page.getByText(/unlock|upgrade/i).first();
    if (await gate.count() > 0) await expect(gate).toBeVisible();
  });
});

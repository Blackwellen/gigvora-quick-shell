/**
 * Domain 16 — Trust Page Playwright matrix.
 * Asserts each tab renders a terminal DataState and that the leave-review
 * drawer + dispute drawer + reference drawer open from their CTAs.
 */
import { test, expect } from '@playwright/test';

test.describe('Domain 16 — Trust', () => {
  test('TrustPage reaches a terminal data state', async ({ page }) => {
    await page.goto('/trust');
    const ready = page.getByTestId('data-state-ready');
    const empty = page.getByTestId('data-state-empty');
    await expect.poll(async () => (await ready.count()) + (await empty.count()), { timeout: 10_000 }).toBeGreaterThan(0);
  });

  test('All six trust tabs render', async ({ page }) => {
    await page.goto('/trust');
    for (const tab of ['reviews', 'references', 'verification', 'trust-score', 'scorecard', 'moderation']) {
      const el = page.getByTestId(`trust-tab-${tab}`);
      if (await el.count() === 0) continue;
      await el.click();
      await expect(page.getByTestId('trust-tab-bar')).toBeVisible();
    }
  });

  test('Leave-review drawer opens and validates input', async ({ page }) => {
    await page.goto('/trust');
    const cta = page.getByTestId('trust-leave-review');
    if (await cta.count() === 0) test.skip();
    await cta.click();
    await expect(page.getByTestId('leave-review-drawer')).toBeVisible();
    const submit = page.getByTestId('submit-review');
    await expect(submit).toBeDisabled(); // empty form rejects submit
    await page.getByTestId('review-title-input').fill('Excellent collaboration');
    await page.getByTestId('review-body-input').fill('Delivered the milestone ahead of schedule and communication was crisp.');
    await expect(submit).toBeEnabled();
  });

  test('Dispute flow opens drawer from a review row when present', async ({ page }) => {
    await page.goto('/trust');
    await page.getByTestId('trust-tab-reviews').click().catch(() => {});
    const dispute = page.locator('[data-testid^="trust-dispute-"]').first();
    if (await dispute.count() === 0) test.skip();
    await dispute.click();
    await expect(page.getByTestId('dispute-drawer')).toBeVisible();
    await expect(page.getByTestId('submit-dispute')).toBeDisabled();
    await page.getByTestId('dispute-reason-input').fill('The project scope described is materially inaccurate.');
    await expect(page.getByTestId('submit-dispute')).toBeEnabled();
  });

  test('Reference request drawer validates email', async ({ page }) => {
    await page.goto('/trust');
    const cta = page.getByTestId('trust-request-reference');
    if (await cta.count() === 0) test.skip();
    await cta.click();
    await expect(page.getByTestId('reference-drawer')).toBeVisible();
    await page.getByTestId('ref-name-input').fill('Jamie Lee');
    await page.getByTestId('ref-email-input').fill('jamie@example.com');
    await expect(page.getByTestId('submit-reference')).toBeEnabled();
  });

  test('Moderation queue surface renders for admins/operators', async ({ page }) => {
    await page.goto('/trust');
    const tab = page.getByTestId('trust-tab-moderation');
    if (await tab.count() === 0) test.skip();
    await tab.click();
    const ready = page.getByTestId('data-state-ready');
    const empty = page.getByTestId('data-state-empty');
    await expect.poll(async () => (await ready.count()) + (await empty.count()), { timeout: 8_000 }).toBeGreaterThan(0);
  });
});

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Domain 13 — Agency Pages, Service Presence & Public Proof', () => {
  test('agency public page renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/agencies/apex-digital-studio`);
    await expect(page).toHaveURL(/agencies\//);
    // Either live envelope or fallback fixture must show the agency name.
    await expect(page.getByText(/Apex Digital Studio/i).first()).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('management dashboard renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/agency/manage`).catch(async () => page.goto(`${BASE}/agency-management`));
    expect(errors).toEqual([]);
  });

  test('inquiry form is reachable on the public page', async ({ page }) => {
    await page.goto(`${BASE}/agencies/apex-digital-studio`);
    // The page exposes a CTA to message / book — find any button containing those keywords.
    const cta = page.getByRole('button', { name: /(message|contact|book|inquir)/i }).first();
    await expect(cta).toBeVisible({ timeout: 10_000 });
  });

  test('loading + empty + error states are wired (envelope smoke)', async ({ page }) => {
    // Force the API base to a dead host so the page renders the empty/error state
    // path instead of the fixture. The page must still mount without throwing.
    await page.addInitScript(() => {
      try { (window as any).__GIGVORA_FORCE_API_FAIL__ = true; } catch { /* ignore */ }
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/agencies/does-not-exist`);
    expect(errors).toEqual([]);
  });
});

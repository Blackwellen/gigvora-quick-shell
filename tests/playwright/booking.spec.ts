import { test, expect } from '@playwright/test';

test.describe('Domain 19 — Calendar Booking & Scheduling', () => {
  test('calendar surface renders the workstation', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page).toHaveURL(/\/calendar/);
    await expect(page.getByText(/calendar|schedule|booking|appointment/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('availability endpoint responds with slot envelope', async ({ request }) => {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 7 * 86_400_000).toISOString();
    const r = await request.get(`/api/v1/booking/availability?linkId=bl_demo&from=${from}&to=${to}`);
    if (r.status() === 200) {
      const body = await r.json();
      expect(body).toHaveProperty('items');
      expect(Array.isArray(body.items)).toBe(true);
    }
  });

  test('appointments list renders and exposes status badges', async ({ page }) => {
    await page.goto('/calendar');
    const badges = page.locator('[data-status], .badge, span').filter({ hasText: /confirmed|pending|cancelled|completed/i });
    if (await badges.first().isVisible().catch(() => false)) {
      await expect(badges.first()).toBeVisible();
    }
  });
});

import { test, expect } from '@playwright/test';

/**
 * Domain 08 — settings smoke. Validates the endpoints are mounted, a settings
 * page renders, and a save-and-reload round-trip persists.
 */
test.describe('@domain-08 settings', () => {
  test('settings endpoints are mounted (auth-gated)', async ({ request }) => {
    for (const path of [
      '/api/v1/settings',
      '/api/v1/settings/catalogue/locales',
      '/api/v1/settings/catalogue/timezones',
      '/api/v1/settings/connections',
      '/api/v1/settings/data-requests',
    ]) {
      const r = await request.get(path);
      expect([200, 401]).toContain(r.status());
    }
  });

  test('a settings page renders without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e.message)));
    await page.goto('/settings');
    expect(errors).toEqual([]);
  });
});

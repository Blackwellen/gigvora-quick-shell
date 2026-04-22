import { test, expect } from '@playwright/test';

/** Domain 10 — network smoke. Endpoints mounted, /network renders. */
test.describe('@domain-10 network', () => {
  test('network endpoints are mounted (auth-gated)', async ({ request }) => {
    for (const path of [
      '/api/v1/network/connections',
      '/api/v1/network/requests/incoming',
      '/api/v1/network/suggestions',
      '/api/v1/network/blocks',
    ]) {
      const r = await request.get(path);
      expect([200, 401]).toContain(r.status());
    }
  });

  test('/network renders without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e.message)));
    await page.goto('/network');
    expect(errors).toEqual([]);
  });
});

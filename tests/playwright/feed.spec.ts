import { test, expect } from '@playwright/test';

/** Domain 09 — feed smoke. Endpoints mounted, /feed page renders cleanly. */
test.describe('@domain-09 feed', () => {
  test('feed endpoints are mounted (auth-gated)', async ({ request }) => {
    for (const path of [
      '/api/v1/feed/home',
      '/api/v1/feed/opportunity-cards',
      '/api/v1/feed/saves',
    ]) {
      const r = await request.get(path);
      expect([200, 401]).toContain(r.status());
    }
  });

  test('/feed renders without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e.message)));
    await page.goto('/feed');
    expect(errors).toEqual([]);
  });
});

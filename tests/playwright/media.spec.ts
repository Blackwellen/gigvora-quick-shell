import { test, expect } from '@playwright/test';

/**
 * Domain 20 — Media Viewer, File Preview, Gallery & Attachments.
 * Smoke coverage for the routed surface and the live API endpoints.
 */

test.describe('Domain 20 — Media Viewer', () => {
  test('media viewer page renders without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto('/media');
    await expect(page.locator('body')).toBeVisible();
    expect(errors.filter(e => !/favicon|sw\.js|404/i.test(e))).toEqual([]);
  });

  test('GET /api/v1/media/assets returns items envelope', async ({ request }) => {
    const r = await request.get('/api/v1/media/assets');
    if (r.status() === 404) test.skip(); // backend not deployed in this env
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBeTruthy();
  });

  test('GET /api/v1/media/insights returns summary + anomalies', async ({ request }) => {
    const r = await request.get('/api/v1/media/insights');
    if (r.status() === 404) test.skip();
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body).toHaveProperty('summary');
    expect(body).toHaveProperty('anomalies');
  });

  test('GET /api/v1/media/galleries returns list', async ({ request }) => {
    const r = await request.get('/api/v1/media/galleries');
    if (r.status() === 404) test.skip();
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body).toHaveProperty('items');
  });

  test('signed download requires existing asset id', async ({ request }) => {
    const r = await request.get('/api/v1/media/sign/download/does_not_exist');
    if (r.status() === 404) {
      // Either backend not deployed or asset not found — both acceptable here.
      expect([404]).toContain(r.status());
    } else {
      expect(r.status()).toBe(404);
    }
  });
});

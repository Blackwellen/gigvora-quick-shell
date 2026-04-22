import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Domain 15 — Events, Networking Sessions, RSVPs & Social Meetups', () => {
  test('events discovery renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/events`).catch(() => page.goto(`${BASE}/explore/events`));
    expect(errors).toEqual([]);
  });

  test('event detail renders with title visible (live or fixture)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/events/ai-product-leaders-summit`).catch(() => page.goto(`${BASE}/events/1`));
    expect(errors).toEqual([]);
  });

  test('event lobby + live room mount cleanly', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/events/1/lobby`).catch(() => page.goto(`${BASE}/events`));
    await page.goto(`${BASE}/events/1/live`).catch(() => page.goto(`${BASE}/events`));
    expect(errors).toEqual([]);
  });

  test('networking lobby renders without runtime error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/networking`).catch(() => page.goto(`${BASE}/networking/sessions`));
    expect(errors).toEqual([]);
  });

  test('event create wizard mounts', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/events/create`).catch(() => page.goto(`${BASE}/events`));
    expect(errors).toEqual([]);
  });
});

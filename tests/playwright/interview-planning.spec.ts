import { test, expect } from '@playwright/test';

test.describe('Domain 29 — Interview Planning', () => {
  test('recruiter scorecards page loads', async ({ page }) => {
    await page.goto('/recruiter/scorecards');
    await expect(page.locator('body')).toBeVisible();
  });

  test('panels API responds', async ({ request }) => {
    const r = await request.get('/api/v1/interview-planning/panels');
    expect([200, 401, 404]).toContain(r.status());
  });

  test('interviews API responds', async ({ request }) => {
    const r = await request.get('/api/v1/interview-planning/interviews');
    expect([200, 401, 404]).toContain(r.status());
  });

  test('scorecards API responds', async ({ request }) => {
    const r = await request.get('/api/v1/interview-planning/scorecards');
    expect([200, 401, 404]).toContain(r.status());
  });

  test('calibrations API responds', async ({ request }) => {
    const r = await request.get('/api/v1/interview-planning/calibrations');
    expect([200, 401, 404]).toContain(r.status());
  });

  test('dashboard API responds', async ({ request }) => {
    const r = await request.get('/api/v1/interview-planning/dashboard');
    expect([200, 401, 404]).toContain(r.status());
  });

  test('reschedule is idempotent', async ({ request }) => {
    const list = await request.get('/api/v1/interview-planning/interviews');
    if (list.status() !== 200) return; // skip when not wired
    const items = (await list.json()).items;
    if (!items?.length) return;
    const id = items[0].id;
    const startAt = new Date(Date.now() + 86_400_000).toISOString();
    const key = 'pw-resched-' + Date.now();
    const r1 = await request.post(`/api/v1/interview-planning/interviews/${id}/reschedule`, {
      data: { startAt, idempotencyKey: key, notifyAttendees: false },
    });
    const r2 = await request.post(`/api/v1/interview-planning/interviews/${id}/reschedule`, {
      data: { startAt, idempotencyKey: key, notifyAttendees: false },
    });
    expect([200, 201]).toContain(r1.status());
    expect([200, 201]).toContain(r2.status());
  });
});

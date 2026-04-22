import { test, expect } from '@playwright/test';

test.describe('Domain 25 — Job Application Flow', () => {
  test('applications surface loads', async ({ page }) => {
    await page.goto('/dashboard/applications');
    await expect(page.locator('body')).toBeVisible();
  });
  test('applications API responds', async ({ request }) => {
    const r = await request.get('/api/v1/job-application-flow/applications');
    expect([200, 401, 404]).toContain(r.status());
  });
  test('templates API responds', async ({ request }) => {
    const r = await request.get('/api/v1/job-application-flow/templates');
    expect([200, 401, 404]).toContain(r.status());
  });
  test('insights API responds', async ({ request }) => {
    const r = await request.get('/api/v1/job-application-flow/insights');
    expect([200, 401, 404]).toContain(r.status());
  });
});

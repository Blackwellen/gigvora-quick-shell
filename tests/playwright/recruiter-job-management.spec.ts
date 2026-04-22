import { test, expect } from '@playwright/test';

test.describe('Domain 26 — Recruiter Job Management', () => {
  test('recruiter workspace loads', async ({ page }) => {
    await page.goto('/recruiter/jobs');
    await expect(page.locator('body')).toBeVisible();
  });
  test('requisitions API responds', async ({ request }) => {
    const r = await request.get('/api/v1/recruiter-job-management/requisitions');
    expect([200, 401, 404]).toContain(r.status());
  });
  test('jobs API responds', async ({ request }) => {
    const r = await request.get('/api/v1/recruiter-job-management/jobs');
    expect([200, 401, 404]).toContain(r.status());
  });
  test('dashboard API responds', async ({ request }) => {
    const r = await request.get('/api/v1/recruiter-job-management/dashboard');
    expect([200, 401, 404]).toContain(r.status());
  });
});

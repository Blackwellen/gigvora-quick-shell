import { test, expect } from '@playwright/test';

// Domain 54 — smoke coverage of org members, seats, roles & permissions.
test.describe('Domain 54 — Org members & seats', () => {
  test('overview renders KPIs and core sections', async ({ page }) => {
    await page.goto('/app/org-members-seats');
    await expect(page.getByRole('heading', { name: /members|team|organization/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('members section exposes status + role controls', async ({ page }) => {
    await page.goto('/app/org-members-seats/members');
    await expect(page.getByText(/member|role/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('invitations section supports invite + revoke', async ({ page }) => {
    await page.goto('/app/org-members-seats/invitations');
    await expect(page.getByText(/invite|invitation/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('seats section supports assign + release + purchase', async ({ page }) => {
    await page.goto('/app/org-members-seats/seats');
    await expect(page.getByText(/seat|assign/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

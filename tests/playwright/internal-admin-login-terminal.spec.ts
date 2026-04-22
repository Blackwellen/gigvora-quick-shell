import { test, expect } from '@playwright/test';

// Domain 65 — smoke coverage for Internal Admin Login Terminal surfaces.
test.describe('Domain 65 — Internal Admin Login Terminal', () => {
  test('terminal entry', async ({ page }) => {
    await page.goto('/internal/internal-admin-login-terminal');
    await expect(page.getByText(/sign in|environment|operator|terminal|mfa/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('environments', async ({ page }) => {
    await page.goto('/internal/internal-admin-login-terminal/environments');
    await expect(page.getByText(/prod|staging|sandbox|dev|risk/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('operators', async ({ page }) => {
    await page.goto('/internal/internal-admin-login-terminal/operators');
    await expect(page.getByText(/operator|role|mfa|email/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('audit + attempts', async ({ page }) => {
    await page.goto('/internal/internal-admin-login-terminal/audit');
    await expect(page.getByText(/attempt|audit|outcome|action/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

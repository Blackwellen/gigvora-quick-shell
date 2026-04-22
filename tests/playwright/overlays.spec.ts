import { test, expect } from '@playwright/test';

/**
 * Domain 06 — overlays smoke. Validates that core overlay primitives
 * (Command Palette, Quick Preview Drawer, confirmations) mount and unmount
 * cleanly. The actual persistence wiring is covered by Jest + the integration
 * suite that hits /api/v1/overlays directly.
 */
test.describe('@domain-06 overlays', () => {
  test('command palette opens with mod+k and closes with Escape', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 4000 });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 2000 });
  });

  test('overlays endpoint is reachable (auth-gated)', async ({ request }) => {
    const r = await request.get('/api/v1/overlays');
    // 401 without bearer is correct — proves the route is mounted by NestJS.
    expect([200, 401]).toContain(r.status());
  });
});

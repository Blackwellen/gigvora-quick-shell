import { test, expect } from '@playwright/test';

test.describe('Domain 46 — Seller Availability Center', () => {
  test('renders availability workbench', async ({ page }) => {
    await page.goto('/gigs/availability');
    await expect(page.getByText('Availability Center')).toBeVisible();
    await expect(page.getByText('Working Hours')).toBeVisible();
    await expect(page.getByText('Queue Limits')).toBeVisible();
    await expect(page.getByText('Vacation Mode')).toBeVisible();
    await expect(page.getByText('Per-Gig Controls')).toBeVisible();
  });

  test('pause-all CTA is wired', async ({ page }) => {
    await page.goto('/gigs/availability');
    await expect(page.getByRole('button', { name: /Pause All Gigs/i })).toBeEnabled();
  });
});

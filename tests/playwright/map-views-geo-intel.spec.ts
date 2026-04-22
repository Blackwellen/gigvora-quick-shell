import { test, expect } from '@playwright/test';

// Domain 62 — smoke coverage of Map Views & Geo Intel surfaces.
test.describe('Domain 62 — Map Views & Geo Intel', () => {
  test('overview', async ({ page }) => {
    await page.goto('/app/map-views-geo-intel');
    await expect(page.getByText(/place|geofence|signal|map|location|audience/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('places', async ({ page }) => {
    await page.goto('/app/map-views-geo-intel/places');
    await expect(page.getByText(/place|address|city|country/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('geofences', async ({ page }) => {
    await page.goto('/app/map-views-geo-intel/geofences');
    await expect(page.getByText(/geofence|radius|polygon|shape/i).first()).toBeVisible({ timeout: 10_000 });
  });
  test('audiences', async ({ page }) => {
    await page.goto('/app/map-views-geo-intel/audiences');
    await expect(page.getByText(/audience|reach|country|geofence/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

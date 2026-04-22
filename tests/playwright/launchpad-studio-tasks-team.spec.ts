import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

test.describe('Pass 4 — Launchpad / Studio / Tasks / Team routes mount', () => {
  for (const path of [
    '/launchpad',
    '/launchpad/discover',
    '/launchpad/opportunities',
    '/launchpad/pathways',
    '/launchpad/mentors',
    '/launchpad/events',
    '/launchpad/projects',
    '/launchpad/challenges',
    '/launchpad/jobs',
    '/groups',
    '/community/creation-studio',
    '/work',
    '/team',
  ]) {
    test(`${path} mounts`, async ({ page }) => {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible();
    });
  }
});

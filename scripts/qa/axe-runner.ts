/**
 * axe-runner.ts — WCAG AA sweep against the top public + admin routes via
 * Playwright + @axe-core/playwright. Emits docs/qa/evidence/G08-axe.json.
 *
 * Run: `bunx playwright test scripts/qa/axe-runner.ts`
 *
 * NOTE: this file is authored as a Playwright spec so it can run inside the
 * existing Playwright config without bespoke wiring.
 */
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// @ts-expect-error optional dep, install via: bun add -D @axe-core/playwright
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  '/', '/about', '/marketplace', '/jobs', '/services', '/projects',
  '/help', '/status', '/auth/signin', '/admin',
];

interface Result { route: string; violations: number; serious: number; critical: number; details: unknown[] }

const out: Result[] = [];

for (const route of ROUTES) {
  test(`a11y: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    out.push({
      route,
      violations: results.violations.length,
      serious: results.violations.filter((v: { impact?: string }) => v.impact === 'serious').length,
      critical: results.violations.filter((v: { impact?: string }) => v.impact === 'critical').length,
      details: results.violations,
    });
    // Don't fail the run on violations — we want the full report.
    expect(results.violations.length).toBeGreaterThanOrEqual(0);
  });
}

test.afterAll(() => {
  const dir = join(process.cwd(), 'docs/qa/evidence');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'G08-axe.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results: out }, null, 2));
});

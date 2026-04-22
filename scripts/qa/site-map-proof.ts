/**
 * site-map-proof.ts — FD-18 G02 evidence generator.
 *
 * Walks every file under src/pages/** and extracts the routes referenced by
 * the routing layer (src/App.tsx + any react-router-dom <Route path="..">),
 * then emits a JSON report listing:
 *   - every discovered route
 *   - the page module it resolves to
 *   - whether the page module file actually exists on disk
 *
 * Run: `bun scripts/qa/site-map-proof.ts > docs/qa/evidence/G02-site-map.json`
 *
 * NOTE: this is a static-analysis pass, not a runtime crawler. Pair with the
 * Playwright `mounts:` smoke (tests/playwright/internal-admin-shell.spec.ts
 * style) for runtime proof.
 */
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.cwd();
const SRC  = join(ROOT, 'src');

interface RouteRow { path: string; module: string; exists: boolean; source: string }

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

function extractRoutes(file: string): Array<{ path: string; module: string }> {
  const src = readFileSync(file, 'utf8');
  const rows: Array<{ path: string; module: string }> = [];
  // Match <Route path="..." element={<X />} /> and createBrowserRouter entries
  const reA = /<Route\s+[^>]*path=["']([^"']+)["'][^>]*element=\{<([A-Za-z0-9_]+)/g;
  let m: RegExpExecArray | null;
  while ((m = reA.exec(src)) !== null) rows.push({ path: m[1], module: m[2] });
  // path: "...", element: <X />
  const reB = /path:\s*["']([^"']+)["'][\s\S]{0,200}?element:\s*<([A-Za-z0-9_]+)/g;
  while ((m = reB.exec(src)) !== null) rows.push({ path: m[1], module: m[2] });
  return rows;
}

function resolveModule(name: string, files: string[]): string | null {
  const hit = files.find((f) => f.endsWith(`${name}.tsx`) || f.endsWith(`${name}.jsx`));
  return hit ?? null;
}

function main() {
  const files = walk(SRC);
  const routeFiles = files.filter((f) => /App\.(tsx|jsx)$|routes?\//.test(f));
  const rows: RouteRow[] = [];
  for (const rf of routeFiles) {
    for (const r of extractRoutes(rf)) {
      const mod = resolveModule(r.module, files);
      rows.push({
        path: r.path,
        module: r.module,
        exists: !!mod,
        source: relative(ROOT, rf),
      });
    }
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    totalRoutes: rows.length,
    missingModules: rows.filter((r) => !r.exists).length,
    rows,
  };
  const outDir = join(ROOT, 'docs/qa/evidence');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, 'G02-site-map.json');
  writeFileSync(outFile, JSON.stringify(summary, null, 2));
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ outFile, totalRoutes: summary.totalRoutes, missingModules: summary.missingModules }, null, 2));
}

main();

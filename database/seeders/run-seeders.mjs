#!/usr/bin/env node
/**
 * Seeder runner — hard refuses to run in production.
 *
 * Usage:
 *   node database/seeders/run-seeders.mjs                # apply all 00xx_seed_*.sql in order
 *   node database/seeders/run-seeders.mjs --only 0017    # apply a single file by prefix
 *   FORCE_SEED=1 NODE_ENV=production node ...            # explicit override (NOT recommended)
 *
 * Reads PG connection from env: PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT
 * or DATABASE_URL.
 *
 * Why this exists: the user requirement is "no demo data except in production
 * environment" — interpreted as "no demo data IN production; OK in dev/preview".
 * Running fixtures in production silently corrupts customer data, so this
 * runner refuses unless FORCE_SEED=1 is set explicitly.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = process.env.NODE_ENV ?? 'development';
const force = process.env.FORCE_SEED === '1';

if (env === 'production' && !force) {
  console.error('\n❌ Refusing to run seeders in NODE_ENV=production.');
  console.error('   Demo/fixture data in production will corrupt customer records.');
  console.error('   To override (dangerous): FORCE_SEED=1 NODE_ENV=production node database/seeders/run-seeders.mjs\n');
  process.exit(2);
}

const onlyArg = (() => {
  const i = process.argv.indexOf('--only');
  return i >= 0 ? process.argv[i + 1] : null;
})();

const files = readdirSync(__dirname)
  .filter((f) => /^\d{4}_seed_.*\.sql$/.test(f))
  .filter((f) => !onlyArg || f.startsWith(onlyArg))
  .sort();

if (files.length === 0) {
  console.error(onlyArg ? `No seeder matches prefix ${onlyArg}` : 'No seeder files found');
  process.exit(1);
}

console.log(`▶ Running ${files.length} seeder(s) against env=${env}`);

let failed = 0;
for (const f of files) {
  const path = join(__dirname, f);
  console.log(`  → ${f}`);
  const sql = readFileSync(path, 'utf8');
  const r = spawnSync('psql', ['-v', 'ON_ERROR_STOP=1', '-q'], {
    input: sql,
    stdio: ['pipe', 'inherit', 'inherit'],
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`  ✗ ${f} failed (exit ${r.status})`);
    failed += 1;
    if (process.env.STOP_ON_FAIL === '1') break;
  }
}

if (failed > 0) {
  console.error(`\n✗ ${failed} seeder(s) failed`);
  process.exit(1);
}
console.log(`\n✓ All ${files.length} seeder(s) applied`);

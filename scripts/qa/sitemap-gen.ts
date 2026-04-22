/**
 * sitemap-gen.ts — generate public/sitemap.xml + public/robots.txt from the
 * route table parsed by site-map-proof.ts.
 *
 * Usage: `bun scripts/qa/sitemap-gen.ts`
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const evidence = join(ROOT, 'docs/qa/evidence/G02-site-map.json');
const sitePath = join(ROOT, 'public/sitemap.xml');
const robotsPath = join(ROOT, 'public/robots.txt');

const SITE = process.env.GIGVORA_PUBLIC_URL ?? 'https://gigvora.com';
const PRIVATE_PREFIXES = ['/admin', '/internal', '/dashboard', '/account', '/settings', '/inbox', '/work'];

if (!existsSync(evidence)) {
  // eslint-disable-next-line no-console
  console.error('Run scripts/qa/site-map-proof.ts first.');
  process.exit(1);
}

interface Row { path: string }
const data = JSON.parse(readFileSync(evidence, 'utf8')) as { rows: Row[] };

const publicRoutes = Array.from(new Set(
  data.rows
    .map((r) => r.path)
    .filter((p) => p.startsWith('/') && !p.includes(':') && !p.includes('*'))
    .filter((p) => !PRIVATE_PREFIXES.some((pref) => p.startsWith(pref)))
)).sort();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes.map((p) => `  <url><loc>${SITE}${p === '/' ? '' : p}</loc></url>`).join('\n')}
</urlset>
`;

writeFileSync(sitePath, xml);

const robots = `User-agent: *
Allow: /
${PRIVATE_PREFIXES.map((p) => `Disallow: ${p}/`).join('\n')}

Sitemap: ${SITE}/sitemap.xml
`;
writeFileSync(robotsPath, robots);

// eslint-disable-next-line no-console
console.log(JSON.stringify({ sitePath, robotsPath, publicRoutes: publicRoutes.length }, null, 2));

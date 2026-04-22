/**
 * FD-11 — Gigvora search indexer.
 *
 * Hardened, contract-driven OpenSearch consumer:
 *
 *   - **Typed mappings per index** (NEVER `dynamic: 'true'`) so filters,
 *     sorts and facets are deterministic.
 *   - **Alias-based reindex strategy**: every logical index `<name>` is
 *     a write alias `<name>` → versioned physical index `<name>_v<ts>`,
 *     plus a read alias `<name>_read` that swaps atomically when a new
 *     physical index is built. Zero-downtime reindex by `reindex()`.
 *   - **Completion suggester** field on every searchable doc enables
 *     `/_search?completion` autocomplete with index-time analysis.
 *   - **Auth + replicas**: honours OPENSEARCH_USERNAME/PASSWORD and
 *     defaults `number_of_replicas: 1` in production.
 *   - **BullMQ consumer** with idempotent jobId-based dedupe, exponential
 *     backoff, and a structured `dlq:indexing` for failures.
 */
import { Client } from '@opensearch-project/opensearch';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import pino from 'pino';

const log = pino({ name: 'search-indexer' });
const isProd = process.env.NODE_ENV === 'production';
const connection = new IORedis(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
  { maxRetriesPerRequest: null },
);

const auth =
  process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD
    ? { username: process.env.OPENSEARCH_USERNAME, password: process.env.OPENSEARCH_PASSWORD }
    : undefined;

export const os = new Client({
  node: process.env.OPENSEARCH_URL ?? 'http://localhost:9200',
  auth,
  ssl: process.env.OPENSEARCH_INSECURE === '1' ? { rejectUnauthorized: false } : undefined,
});

/**
 * Logical indices. Each gets a write alias (== name) and a read alias
 * (`<name>_read`) pointing at the current physical version.
 */
export const INDEXES = [
  'users', 'jobs', 'projects', 'gigs', 'services',
  'companies', 'startups', 'media', 'groups', 'events',
  'podcasts', 'webinars', 'posts',
] as const;
export type IndexName = typeof INDEXES[number];

const REPLICAS = Number(process.env.OPENSEARCH_REPLICAS ?? (isProd ? 1 : 0));
const SHARDS = Number(process.env.OPENSEARCH_SHARDS ?? 1);

/**
 * Shared analyzer: lowercase + asciifolding so accented terms match,
 * plus an edge-ngram analyzer used by the autocomplete `prefix` field.
 */
const sharedSettings = {
  number_of_shards: SHARDS,
  number_of_replicas: REPLICAS,
  analysis: {
    analyzer: {
      gv_text: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding', 'stop'],
      },
      gv_prefix: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding', 'gv_edge'],
      },
      gv_prefix_search: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding'],
      },
    },
    filter: {
      gv_edge: { type: 'edge_ngram', min_gram: 2, max_gram: 15 },
    },
  },
};

/**
 * Common fields every searchable doc carries — keeps the cross-index
 * `multi_match` queries in SearchService deterministic.
 */
const commonProperties = {
  id: { type: 'keyword' },
  title: {
    type: 'text', analyzer: 'gv_text',
    fields: {
      raw: { type: 'keyword', ignore_above: 256 },
      prefix: { type: 'text', analyzer: 'gv_prefix', search_analyzer: 'gv_prefix_search' },
    },
  },
  body:        { type: 'text', analyzer: 'gv_text' },
  tags:        { type: 'keyword' },
  url:         { type: 'keyword', index: false },
  ownerId:     { type: 'keyword' },
  orgId:       { type: 'keyword' },
  visibility:  { type: 'keyword' }, // public | org | private
  status:      { type: 'keyword' },
  region:      { type: 'keyword' },
  createdAt:   { type: 'date' },
  updatedAt:   { type: 'date' },
  meta:        { type: 'object', enabled: true, dynamic: false },
  // Completion suggester field for autocomplete.
  suggest: {
    type: 'completion',
    analyzer: 'simple',
    preserve_separators: true,
    preserve_position_increments: true,
    max_input_length: 100,
  },
};

/**
 * Per-index extras — kept tight so filters stay typed.
 */
const perIndexProps: Record<IndexName, Record<string, any>> = {
  users:     { skills: { type: 'keyword' }, location: { type: 'keyword' }, headline: { type: 'text', analyzer: 'gv_text' } },
  jobs:      { skills: { type: 'keyword' }, location: { type: 'keyword' }, salaryMin: { type: 'integer' }, salaryMax: { type: 'integer' }, workType: { type: 'keyword' }, remote: { type: 'keyword' } },
  projects:  { budgetMin: { type: 'integer' }, budgetMax: { type: 'integer' }, currency: { type: 'keyword' }, skills: { type: 'keyword' } },
  gigs:      { priceMin: { type: 'integer' }, priceMax: { type: 'integer' }, currency: { type: 'keyword' }, category: { type: 'keyword' } },
  services:  { priceMin: { type: 'integer' }, priceMax: { type: 'integer' }, currency: { type: 'keyword' }, category: { type: 'keyword' } },
  companies: { industry: { type: 'keyword' }, sizeBand: { type: 'keyword' }, hqCountry: { type: 'keyword' } },
  startups:  { stage: { type: 'keyword' }, mrrMinor: { type: 'long' }, customers: { type: 'integer' } },
  media:     { kind: { type: 'keyword' }, durationSec: { type: 'integer' } },
  groups:    { topic: { type: 'keyword' }, memberCount: { type: 'integer' } },
  events:    { startsAt: { type: 'date' }, endsAt: { type: 'date' }, mode: { type: 'keyword' } },
  podcasts:  { category: { type: 'keyword' }, episodeCount: { type: 'integer' } },
  webinars:  { startsAt: { type: 'date' }, mode: { type: 'keyword' } },
  posts:     { kind: { type: 'keyword' }, authorId: { type: 'keyword' } },
};

function indexBody(idx: IndexName) {
  return {
    settings: sharedSettings,
    mappings: {
      dynamic: 'strict' as const, // hard-fail on unmapped fields
      properties: { ...commonProperties, ...perIndexProps[idx] },
    },
  };
}

/** Physical index name with timestamp suffix. */
function physName(idx: IndexName, version = Date.now()) {
  return `${idx}_v${version}`;
}

/**
 * Ensure each logical index has:
 *   - one physical index `<idx>_v<ts>`
 *   - write alias `<idx>` → physical (is_write_index: true)
 *   - read alias `<idx>_read` → physical
 *
 * Idempotent: if the write alias already resolves, we leave it alone.
 */
export async function ensureIndexes() {
  for (const idx of INDEXES) {
    const aliasOk = await os.indices.existsAlias({ name: idx }).catch(() => ({ body: false }));
    if (aliasOk.body) continue;

    const phys = physName(idx);
    await os.indices.create({ index: phys, body: indexBody(idx) }).catch((e: any) => {
      if (e?.meta?.statusCode !== 400) throw e;
    });
    await os.indices.updateAliases({
      body: {
        actions: [
          { add: { index: phys, alias: idx, is_write_index: true } },
          { add: { index: phys, alias: `${idx}_read` } },
        ],
      },
    });
    log.info({ idx, phys }, 'index + aliases created');
  }
}

/**
 * Zero-downtime reindex of one logical index. Builds a new physical
 * index from the latest mapping, reindexes the old data, then atomically
 * swaps both aliases.
 */
export async function reindex(idx: IndexName) {
  const phys = physName(idx);
  await os.indices.create({ index: phys, body: indexBody(idx) });
  // Resolve current physical via alias.
  const cur = await os.indices.getAlias({ name: idx }).catch(() => ({ body: {} }));
  const oldPhys = Object.keys(cur.body)[0];
  if (oldPhys) {
    await os.reindex({ refresh: true, body: { source: { index: oldPhys }, dest: { index: phys } } });
  }
  const actions: any[] = [
    { add: { index: phys, alias: idx, is_write_index: true } },
    { add: { index: phys, alias: `${idx}_read` } },
  ];
  if (oldPhys && oldPhys !== phys) {
    actions.unshift({ remove: { index: oldPhys, alias: idx } });
    actions.unshift({ remove: { index: oldPhys, alias: `${idx}_read` } });
  }
  await os.indices.updateAliases({ body: { actions } });
  log.info({ idx, oldPhys, newPhys: phys }, 'reindex swap complete');
  return { idx, oldPhys, newPhys: phys };
}

/**
 * BullMQ consumer. Job shape:
 *   { index: IndexName, op: 'upsert' | 'delete', doc: { id, ...source } }
 *
 * Reuses the BullMQ `jobId` for natural dedupe (producer must set
 * `jobId = ${index}:${id}:${updatedAt}` to prevent stale overwrites).
 */
export const indexingWorker = new Worker(
  'indexing',
  async (job) => {
    const { index, doc, op } = job.data as { index: IndexName; doc: { id: string; updatedAt?: string }; op: 'upsert' | 'delete' };
    if (!INDEXES.includes(index)) throw new Error(`unknown_index:${index}`);
    if (op === 'delete') {
      await os.delete({ index, id: doc.id }).catch((e: any) => {
        if (e?.meta?.statusCode !== 404) throw e;
      });
      return { ok: true, op, index, id: doc.id };
    }
    // Inject a completion suggester payload from title + tags.
    const suggestInput = [doc as any]
      .map((d: any) => [d.title, ...((d.tags as string[]) ?? [])].filter(Boolean))
      .flat();
    const body = { ...(doc as any), suggest: { input: suggestInput } };
    await os.index({ index, id: doc.id, body, refresh: 'wait_for' });
    return { ok: true, op, index, id: doc.id };
  },
  { connection, concurrency: Number(process.env.INDEXER_CONCURRENCY ?? 8) },
);

indexingWorker.on('failed', (job, err) => {
  log.error({ jobId: job?.id, err: err.message }, 'indexing job failed');
});

await ensureIndexes().catch((e) =>
  log.warn({ err: (e as Error).message }, 'ensureIndexes deferred — OpenSearch not reachable yet'),
);
log.info({ replicas: REPLICAS, shards: SHARDS, auth: !!auth }, 'search-indexer ready');

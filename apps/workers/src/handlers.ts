import type { Pool } from 'pg';
import type { WorkerRealtime } from './worker-realtime';
import { savedSearchDigest } from './saved-search-digest';

type Ctx = { pool: Pool; broker: WorkerRealtime };

async function notifications(d: any, ctx: Ctx) {
  if (d?.name === 'search.saved.digest' || d?.kind === 'search.saved.digest') {
    return savedSearchDigest(d, ctx);
  }
  const { pool, broker } = ctx;
  const recipient = d?.recipientId ?? d?.identityId;
  if (recipient) {
    try {
      await pool.query(
        `INSERT INTO notifications (recipient_id, kind, title, body, data)
         VALUES ($1,$2,$3,$4,$5::jsonb)`,
        [recipient, d?.kind ?? 'system', d?.title ?? 'Notification',
         d?.body ?? '', JSON.stringify(d?.data ?? {})],
      );
    } catch {}
    await broker.bump('user', recipient, 'inbox.unread', 1);
    await broker.emit('user', recipient, 'notification.new',
      { kind: d?.kind ?? 'system', title: d?.title, body: d?.body, ts: Date.now() });
  } else {
    await broker.bump('global', 'global', 'feed.new', 1);
  }
  return { delivered: true, recipient: recipient ?? null };
}

async function indexing(d: any, { pool, broker }: Ctx) {
  const indexName = d?.index ?? d?.indexName ?? d?.doc?.indexName;
  const op = d?.op ?? 'upsert';
  const id = d?.doc?.id ?? d?.id ?? d?.documentId;
  try {
    if (indexName && id) {
      await pool.query(
        `UPDATE search_index_jobs
            SET status='completed', completed_at=now(), attempts=attempts+1
          WHERE index_name=$1 AND doc_id=$2 AND status IN ('pending','running','failed')`,
        [indexName, id],
      ).catch(() => null);
    }
  } catch {}
  await broker.bump('global', 'global', 'index.pending', -1);
  await broker.emit('global', 'global', 'search.results.refreshed', { indexName, id, op, ts: Date.now() });
  return { indexed: id ?? null, indexName: indexName ?? null, op };
}

async function media(d: any, { pool, broker }: Ctx) {
  const assetId = d?.assetId;
  try {
    if (assetId) {
      await pool.query(
        `UPDATE media_assets SET status='ready', processed_at=now() WHERE id=$1`,
        [assetId],
      );
    }
  } catch {}
  if (d?.ownerId) await broker.emit('user', d.ownerId, 'media.ready', { assetId, ts: Date.now() });
  return { processed: assetId ?? null };
}

async function billing(d: any, { pool }: Ctx) {
  let outstanding = 0;
  try {
    const r = await pool.query(`SELECT COUNT(*)::int c FROM invoices WHERE status='pending'`).catch(() => ({ rows: [{ c: 0 }] }));
    outstanding = Number(r.rows?.[0]?.c ?? 0);
  } catch {}
  return { reconciled: true, outstanding, source: d?.source ?? 'manual' };
}

async function webhooks(d: any, { pool }: Ctx) {
  if (d?.name === 'retry.sweep') {
    const rows = await pool.query(
      `SELECT id, endpoint_url, event, payload, attempt FROM webhook_deliveries
        WHERE delivered=false AND attempt < 6 AND created_at > now() - interval '24 hours'
        LIMIT 50`,
    ).then(r => r.rows).catch(() => []);
    let retried = 0;
    for (const row of rows) retried += await deliver(pool, row) ? 1 : 0;
    return { retried, scanned: rows.length };
  }
  const ok = await deliver(pool, {
    id: null, endpoint_url: d.endpointUrl, event: d.event,
    payload: d.payload ?? {}, attempt: 0,
  });
  return { delivered: ok, event: d?.event };
}

async function deliver(pool: Pool, row: { id: number|null; endpoint_url: string; event: string; payload: any; attempt: number }) {
  let status = 0; let err: string | undefined;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(row.endpoint_url, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'X-Gigvora-Event': row.event },
      body: JSON.stringify(row.payload),
    });
    clearTimeout(t);
    status = r.status;
  } catch (e: any) { err = e?.message ?? 'fetch_error'; }
  const delivered = status >= 200 && status < 300;
  try {
    if (row.id) {
      await pool.query(
        `UPDATE webhook_deliveries SET status_code=$1, attempt=attempt+1, delivered=$2, error=$3 WHERE id=$4`,
        [status, delivered, err ?? null, row.id],
      );
    } else {
      await pool.query(
        `INSERT INTO webhook_deliveries (endpoint_url, event, payload, status_code, attempt, delivered, error)
         VALUES ($1,$2,$3::jsonb,$4,$5,$6,$7)`,
        [row.endpoint_url, row.event, JSON.stringify(row.payload), status, 1, delivered, err ?? null],
      );
    }
  } catch {}
  return delivered;
}

async function analyticsRollup(d: any, { pool, broker }: Ctx) {
  const bucket = (d?.bucket ?? 'hour') as 'hour'|'day'|'week'|'month';
  const trunc = bucket === 'day' ? `date_trunc('day', occurred_at)`
              : bucket === 'week' ? `date_trunc('week', occurred_at)`
              : bucket === 'month'? `date_trunc('month', occurred_at)`
              : `date_trunc('hour', occurred_at)`;
  const windowSql = bucket === 'day' ? `interval '90 days'`
                  : bucket === 'week'? `interval '52 weeks'`
                  : bucket === 'month'? `interval '24 months'`
                  : `interval '48 hours'`;

  if (d?.name === 'counters.recompute' || bucket === 'counters' as any) {
    const inboxRow = await pool.query(`SELECT COUNT(*)::int c FROM notifications WHERE read_at IS NULL`).catch(() => ({ rows: [{ c: 0 }] }));
    await broker.set('global', 'global', 'inbox.unread.total', Number(inboxRow.rows?.[0]?.c ?? 0));
    return { recomputed: ['inbox.unread.total'] };
  }

  let aggregated = 0;
  try {
    const r = await pool.query(
      `WITH agg AS (
         SELECT ${trunc} AS bucket_at, event_name AS metric, COUNT(*)::numeric AS value
           FROM analytics_events
          WHERE occurred_at >= now() - ${windowSql}
          GROUP BY 1, 2
       )
       INSERT INTO analytics_rollups (bucket, metric, bucket_at, value)
       SELECT $1, metric, bucket_at, value FROM agg
       ON CONFLICT (bucket, metric, bucket_at) DO UPDATE SET value=EXCLUDED.value
       RETURNING 1`,
      [bucket],
    );
    aggregated = r.rowCount ?? 0;
  } catch {}

  await broker.emit('global', 'global', 'analytics.rollup.tick',
    { bucket, aggregated, ts: Date.now() });
  return { rolled: bucket, aggregated };
}

async function mlBatch(d: any, { pool, broker }: Ctx) {
  const base = process.env.ML_PY_URL ?? process.env.ML_PYTHON_URL ?? 'http://localhost:8001';
  const startedAt = Date.now();
  const result = {
    ok: false,
    registry: [] as Array<{ name: string; version: string; kind: string }>,
    refreshed: 0,
    embeddingsRefreshed: 0,
    errors: [] as string[],
    durationMs: 0,
    source: 'fallback' as 'ml-python' | 'fallback',
  };

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(`${base}/registry`, { signal: ctrl.signal });
    clearTimeout(t);
    if (r.ok) {
      const j = await r.json() as { data?: Array<{ name: string; version: string; kind: string }> };
      result.registry = j.data ?? [];
      result.source = 'ml-python';
    } else {
      result.errors.push(`registry http ${r.status}`);
    }
  } catch (e: any) {
    result.errors.push(`registry ${e?.message ?? 'fetch_error'}`);
  }

  if (result.source === 'ml-python') {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(`${base}/registry/refresh`, { method: 'POST', signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok) result.refreshed = result.registry.length;
    } catch (e: any) {
      result.errors.push(`refresh ${e?.message ?? 'fetch_error'}`);
    }
  }

  result.ok = result.source === 'ml-python' && result.errors.length === 0;
  result.durationMs = Date.now() - startedAt;

  try {
    await pool.query(
      `INSERT INTO ml_batch_runs (source, ok, models, refreshed, embeddings_refreshed, errors, duration_ms)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7)`,
      [result.source, result.ok, result.registry.length, result.refreshed,
       result.embeddingsRefreshed, JSON.stringify(result.errors), result.durationMs],
    );
  } catch {}

  await broker.set('global', 'global', 'ml.batch.last_ok', result.ok ? 1 : 0);
  await broker.emit('global', 'global', 'ml.batch.tick', {
    ok: result.ok, source: result.source, models: result.registry.length,
    refreshed: result.refreshed, embeddings: result.embeddingsRefreshed,
    durationMs: result.durationMs, ts: Date.now(),
  });
  return result;
}

export const HANDLERS: Record<string, (d: any, ctx: Ctx) => Promise<unknown>> = {
  notifications,
  indexing,
  media,
  billing,
  'webhooks-out':     webhooks,
  'analytics-rollup': analyticsRollup,
  'ml-batch':         mlBatch,
};
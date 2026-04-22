import type { Pool } from 'pg';
import type { WorkerRealtime } from './worker-realtime';

type Ctx = { pool: Pool; broker: WorkerRealtime };

export async function savedSearchDigest(d: any, { pool, broker }: Ctx) {
  const since = d?.sinceHours ?? 24;
  const startedAt = Date.now();

  let saved: Array<{
    id: string; identity_id: string; query: string; scope: string;
    filters: any; last_count: number | null; last_run_at: string | null;
  }> = [];
  try {
    saved = (await pool.query(
      `SELECT id, identity_id, query, scope, filters, last_count, last_run_at
         FROM saved_searches
        WHERE notify = true AND status = 'active'
        ORDER BY pinned DESC, updated_at DESC
        LIMIT 1000`,
    )).rows;
  } catch {
    return { ok: false, reason: 'saved_searches_table_missing', durationMs: Date.now() - startedAt };
  }

  let processed = 0;
  let notified = 0;
  let totalNewHits = 0;
  const errors: Array<{ savedSearchId: string; err: string }> = [];

  for (const s of saved) {
    try {
      const tsQuery = (s.query ?? '').trim().split(/\s+/).filter(Boolean).map(t => `${t}:*`).join(' & ');
      const params: any[] = [tsQuery || '*', `${since} hours`, s.identity_id];
      let where = `(tsv @@ to_tsquery('simple', $1) OR title ILIKE '%' || $1 || '%')
                   AND updated_at > now() - $2::interval
                   AND (visibility = 'public' OR owner_id = $3)`;
      if (s.scope && s.scope !== 'all') {
        params.push(s.scope); where += ` AND index_name = $${params.length}`;
      }
      const filters = typeof s.filters === 'string' ? JSON.parse(s.filters) : s.filters ?? {};
      if (Array.isArray(filters.tags) && filters.tags.length) {
        params.push(filters.tags); where += ` AND tags && $${params.length}::text[]`;
      }
      if (Array.isArray(filters.region) && filters.region.length) {
        params.push(filters.region); where += ` AND region = ANY($${params.length}::text[])`;
      }

      const rows = await pool.query(
        `SELECT id, index_name AS "indexName", title, url, updated_at AS "updatedAt"
           FROM search_documents
          WHERE ${where}
          ORDER BY updated_at DESC
          LIMIT 50`,
        params,
      );

      const count = rows.rowCount ?? 0;
      processed++;
      const delta = Math.max(0, count - Number(s.last_count ?? 0));

      await pool.query(
        `INSERT INTO saved_search_runs (saved_search_id, identity_id, hit_count, sample, ran_for_hours)
         VALUES ($1,$2,$3,$4::jsonb,$5)`,
        [s.id, s.identity_id, count, JSON.stringify(rows.rows.slice(0, 10)), since],
      );

      await pool.query(
        `UPDATE saved_searches
            SET last_count = $1, last_run_at = now(), updated_at = now()
          WHERE id = $2`,
        [count, s.id],
      );

      if (delta > 0) {
        totalNewHits += delta;
        try {
          await pool.query(
            `INSERT INTO notifications (recipient_id, kind, title, body, data)
             VALUES ($1,'saved_search.digest',$2,$3,$4::jsonb)`,
            [
              s.identity_id,
              `${delta} new result${delta === 1 ? '' : 's'} for "${s.query}"`,
              rows.rows.slice(0, 3).map((r) => `• ${r.title}`).join('\n'),
              JSON.stringify({ savedSearchId: s.id, hits: rows.rows.slice(0, 5) }),
            ],
          );
        } catch {}
        await broker.bump('user', s.identity_id, 'inbox.unread', 1);
        await broker.emit('user', s.identity_id, 'saved-search.matched', {
          savedSearchId: s.id, count: delta, ts: Date.now(),
        });
        notified++;
      }
    } catch (err) {
      errors.push({ savedSearchId: s.id, err: (err as Error).message });
    }
  }

  await broker.set('global', 'global', 'saved_search.last_digest_count', notified);
  await broker.emit('global', 'global', 'saved_search.digest.tick', {
    processed, notified, totalNewHits, errors: errors.length, sinceHours: since, ts: Date.now(),
  });
  return {
    ok: errors.length === 0, processed, notified, totalNewHits,
    errors: errors.slice(0, 10), durationMs: Date.now() - startedAt,
  };
}
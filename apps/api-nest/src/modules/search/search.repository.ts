import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SearchFilters, buildSqlFilterClauses } from './search.filters';

@Injectable()
export class SearchRepository {
  constructor(private readonly ds: DataSource) {}

  search(q: string, scope: string, tags: string[] | undefined, filters: SearchFilters, identityId: string | null, limit = 20, offset = 0) {
    const tsQuery = q.trim().split(/\s+/).filter(Boolean).map(t => t + ':*').join(' & ');
    const params: any[] = [tsQuery || q || '*', limit, offset];
    let where = `tsv @@ to_tsquery('simple', $1)`;
    if (!tsQuery) where = `(title ILIKE '%' || $1 || '%' OR body ILIKE '%' || $1 || '%')`;
    if (scope && scope !== 'all') { params.push(scope); where += ` AND index_name = $${params.length}`; }
    if (tags?.length) { params.push(tags); where += ` AND tags && $${params.length}::text[]`; }
    params.push(identityId);
    where += ` AND (visibility = 'public' OR owner_id = $${params.length})`;
    where += buildSqlFilterClauses(filters, params);

    return this.ds.query(
      `SELECT id, index_name AS "indexName", title, body, tags, url, visibility, meta,
              ts_rank(tsv, to_tsquery('simple', $1)) AS rank,
              updated_at AS "updatedAt"
       FROM search_documents
       WHERE ${where}
       AND NOT EXISTS (
         SELECT 1 FROM search_blocklist b
         WHERE b.doc_index = search_documents.index_name
           AND b.doc_id = search_documents.id
           AND b.active = true
       )
       ORDER BY rank DESC NULLS LAST, updated_at DESC
       LIMIT $2 OFFSET $3`,
      params,
    );
  }

  async countByIndex(q: string, identityId: string | null): Promise<Record<string, number>> {
    const tsQuery = q.trim().split(/\s+/).filter(Boolean).map(t => t + ':*').join(' & ');
    const params: any[] = [tsQuery || q || '*', identityId];
    const rows = await this.ds.query(
      `SELECT index_name AS "indexName", count(*)::int AS c
       FROM search_documents
       WHERE (tsv @@ to_tsquery('simple', $1) OR title ILIKE '%' || $1 || '%')
         AND (visibility = 'public' OR owner_id = $2)
       GROUP BY index_name`,
      params,
    );
    const out: Record<string, number> = {};
    for (const r of rows) out[r.indexName] = r.c;
    return out;
  }

  autocomplete(q: string, scope: string, limit = 8) {
    const params: any[] = [q + '%', limit];
    let where = `title ILIKE $1`;
    if (scope && scope !== 'all') { params.push(scope); where += ` AND index_name = $${params.length}`; }
    return this.ds.query(
      `SELECT id, index_name AS "indexName", title, url
       FROM search_documents WHERE ${where} AND visibility='public'
       ORDER BY updated_at DESC LIMIT $2`, params,
    );
  }

  async logHistory(identityId: string|null, query: string, scope: string, count: number, ms: number) {
    await this.ds.query(
      `INSERT INTO search_history (identity_id, query, scope, result_count, ms) VALUES ($1,$2,$3,$4,$5)`,
      [identityId, query, scope, count, ms],
    );
  }
  async logClick(identityId: string|null, query: string, scope: string, clickedId: string, clickedIndex: string) {
    await this.ds.query(
      `INSERT INTO search_history (identity_id, query, scope, clicked_id, clicked_index, result_count) VALUES ($1,$2,$3,$4,$5,0)`,
      [identityId, query, scope, clickedId, clickedIndex],
    );
  }
  recentForIdentity(identityId: string, limit = 10) {
    return this.ds.query(
      `SELECT DISTINCT ON (query) query, scope, created_at AS "createdAt"
       FROM search_history WHERE identity_id=$1 AND query <> ''
       ORDER BY query, created_at DESC LIMIT $2`, [identityId, limit],
    );
  }
  trending(days = 7, limit = 10) {
    return this.ds.query(
      `SELECT query, count(*)::int AS c
       FROM search_history
       WHERE query <> '' AND created_at > now() - ($1 || ' days')::interval
       GROUP BY query ORDER BY c DESC LIMIT $2`, [days, limit],
    );
  }

  listSaved(identityId: string) {
    return this.ds.query(
      `SELECT id, name, query, scope, filters, pinned, notify, last_run_at AS "lastRunAt", last_count AS "lastCount", created_at AS "createdAt"
       FROM saved_searches WHERE identity_id=$1 AND status='active' ORDER BY pinned DESC, updated_at DESC`,
      [identityId],
    );
  }
  async createSaved(identityId: string, d: any) {
    const r = await this.ds.query(
      `INSERT INTO saved_searches (identity_id, name, query, scope, filters, pinned, notify)
       VALUES ($1,$2,$3,COALESCE($4,'all'),COALESCE($5,'{}'::jsonb),COALESCE($6,false),COALESCE($7,false))
       RETURNING *`,
      [identityId, d.name, d.query, d.scope, d.filters ? JSON.stringify(d.filters) : null, d.pinned, d.notify],
    );
    return r[0];
  }
  async archiveSaved(identityId: string, id: string) {
    const r = await this.ds.query(
      `UPDATE saved_searches SET status='archived', updated_at=now() WHERE id=$1 AND identity_id=$2 RETURNING *`,
      [id, identityId],
    );
    return r[0] ?? null;
  }

  listActions(roles: string[], entitlements: string[]) {
    return this.ds.query(
      `SELECT id, label, category, hint, icon, shortcut, href, required_role AS "requiredRole",
              required_entitlement AS "requiredEntitlement", position
       FROM command_palette_actions WHERE active=true
         AND (required_role IS NULL OR required_role = ANY($1::text[]))
         AND (required_entitlement IS NULL OR required_entitlement = ANY($2::text[]))
       ORDER BY position ASC, label ASC`,
      [roles, entitlements],
    );
  }

  listShortcuts(identityId: string) {
    return this.ds.query(
      `SELECT s.id, s.action_id AS "actionId", s.keybind, s.status, a.label, a.href
       FROM shortcuts s JOIN command_palette_actions a ON a.id = s.action_id
       WHERE s.identity_id=$1 ORDER BY a.position ASC`, [identityId],
    );
  }
  async upsertShortcut(identityId: string, actionId: string, keybind: string, disabled?: boolean) {
    const r = await this.ds.query(
      `INSERT INTO shortcuts (identity_id, action_id, keybind, status)
       VALUES ($1,$2,$3, CASE WHEN $4 THEN 'disabled' ELSE 'active' END)
       ON CONFLICT (identity_id, action_id) DO UPDATE SET keybind=EXCLUDED.keybind, status=EXCLUDED.status
       RETURNING *`, [identityId, actionId, keybind, !!disabled],
    );
    return r[0];
  }

  linksFor(indexName: string, id: string) {
    return this.ds.query(
      `SELECT cl.relation, cl.weight, cl.meta,
              d.id, d.index_name AS "indexName", d.title, d.url
       FROM cross_links cl
       JOIN search_documents d ON d.index_name = cl.target_index AND d.id = cl.target_id
       WHERE cl.source_index=$1 AND cl.source_id=$2 AND cl.status='active'
       ORDER BY cl.weight DESC`, [indexName, id],
    );
  }
  async createLink(d: any, createdBy: string|null) {
    const r = await this.ds.query(
      `INSERT INTO cross_links (source_index, source_id, target_index, target_id, relation, weight, meta, created_by)
       VALUES ($1,$2,$3,$4,$5,COALESCE($6,1.0),COALESCE($7,'{}'::jsonb),$8)
       ON CONFLICT (source_index, source_id, target_index, target_id, relation)
         DO UPDATE SET status='active', weight=EXCLUDED.weight, meta=EXCLUDED.meta
       RETURNING *`,
      [d.sourceIndex, d.sourceId, d.targetIndex, d.targetId, d.relation, d.weight, d.meta ? JSON.stringify(d.meta) : null, createdBy],
    );
    return r[0];
  }

  async upsertDocument(d: any) {
    const r = await this.ds.query(
      `INSERT INTO search_documents (id, index_name, title, body, tags, url, owner_id, org_id, visibility, status, region, meta)
       VALUES ($1,$2,$3,COALESCE($4,''),COALESCE($5,'{}'::text[]),$6,$7,$8,COALESCE($9,'public'),$10,$11,COALESCE($12,'{}'::jsonb))
       ON CONFLICT (index_name, id) DO UPDATE SET
         title=EXCLUDED.title, body=EXCLUDED.body, tags=EXCLUDED.tags, url=EXCLUDED.url,
         owner_id=EXCLUDED.owner_id, org_id=EXCLUDED.org_id, visibility=EXCLUDED.visibility,
         status=EXCLUDED.status, region=EXCLUDED.region, meta=EXCLUDED.meta, updated_at=now()
       RETURNING *`,
      [d.id, d.indexName, d.title, d.body, d.tags, d.url ?? null, d.ownerId ?? null, d.orgId ?? null, d.visibility, d.status ?? null, d.region ?? null, d.meta ? JSON.stringify(d.meta) : null],
    );
    await this.ds.query(
      `INSERT INTO search_index_jobs (index_name, doc_id, op, payload) VALUES ($1,$2,'upsert',$3::jsonb)`,
      [d.indexName, d.id, JSON.stringify(d)],
    );
    return r[0];
  }
}
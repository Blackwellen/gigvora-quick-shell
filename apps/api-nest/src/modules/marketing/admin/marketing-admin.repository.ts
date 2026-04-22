import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class MarketingAdminRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Ads queue ─────
  async listAds(f: { q?: string; status?: string; risk?: string; page: number; pageSize: number }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (f.status) { w.push(`status=$${i++}`); v.push(f.status); }
    if (f.risk)   { w.push(`risk=$${i++}`);   v.push(f.risk); }
    if (f.q)      { w.push(`(reference ILIKE $${i} OR title ILIKE $${i} OR advertiser ILIKE $${i})`); v.push(`%${f.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = f.pageSize; const offset = (f.page - 1) * limit;
    const [items, count] = await Promise.all([
      this.ds.query(`SELECT * FROM marketing_ads_queue ${where}
        ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'flagged' THEN 1 ELSE 2 END,
                 CASE risk WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                 submitted_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM marketing_ads_queue ${where}`, v),
    ]);
    return { items, total: count[0]?.c ?? 0 };
  }
  adById(id: string) { return this.ds.query(`SELECT * FROM marketing_ads_queue WHERE id=$1`, [id]).then(r => r[0] ?? null); }
  async upsertAd(p: any, mlScore: { score: number; risk: string; flags: any[]; components: any }) {
    if (p.id) {
      const r = await this.ds.query(
        `UPDATE marketing_ads_queue SET advertiser=$1, title=$2, description=$3, format=$4,
          landing_url=$5, audience=$6, placement=$7, budget_cents=$8, currency=$9,
          risk=$10, risk_score=$11, flags=$12::jsonb, ml_components=$13::jsonb, updated_at=now()
          WHERE id=$14 RETURNING *`,
        [p.advertiser, p.title, p.description ?? null, p.format, p.landingUrl ?? null,
         p.audience ?? null, p.placement ?? null, p.budgetCents, p.currency,
         mlScore.risk, mlScore.score, JSON.stringify(mlScore.flags), JSON.stringify(mlScore.components), p.id],
      );
      return r[0];
    }
    const ref = `CR-${Math.floor(1000 + Math.random() * 9000)}`;
    const r = await this.ds.query(
      `INSERT INTO marketing_ads_queue (reference, advertiser, title, description, format,
        landing_url, audience, placement, budget_cents, currency, risk, risk_score, flags, ml_components)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb) RETURNING *`,
      [ref, p.advertiser, p.title, p.description ?? null, p.format, p.landingUrl ?? null,
       p.audience ?? null, p.placement ?? null, p.budgetCents, p.currency,
       mlScore.risk, mlScore.score, JSON.stringify(mlScore.flags), JSON.stringify(mlScore.components)],
    );
    return r[0];
  }
  async decideAds(ids: string[], status: string, reason: string, actor: string | null) {
    return this.ds.query(
      `UPDATE marketing_ads_queue SET status=$1, decision_reason=$2, decided_by=$3, decided_at=now(), updated_at=now()
        WHERE id = ANY($4::uuid[]) RETURNING id, reference, status`,
      [status, reason, actor, ids],
    );
  }

  // ── Traffic ─────
  trafficKpis(windowHours: number) {
    return this.ds.query(
      `WITH win AS (SELECT * FROM marketing_traffic_events WHERE ts > now() - ($1 || ' hours')::interval)
       SELECT
         COUNT(DISTINCT visitor_id) FILTER (WHERE NOT is_bot)::int AS visitors,
         COUNT(DISTINCT session_id) FILTER (WHERE NOT is_bot)::int AS sessions,
         COUNT(*) FILTER (WHERE event_type='convert')::int AS conversions,
         COUNT(*) FILTER (WHERE is_bot)::int AS bot_hits,
         AVG(duration_ms)::int AS avg_duration_ms
       FROM win`,
      [String(windowHours)],
    ).then(r => r[0] ?? { visitors: 0, sessions: 0, conversions: 0, bot_hits: 0, avg_duration_ms: 0 });
  }
  trafficSources(windowHours: number) {
    return this.ds.query(
      `SELECT COALESCE(source,'direct') AS source,
         COUNT(DISTINCT visitor_id)::int AS visitors,
         COUNT(*)::int AS hits
       FROM marketing_traffic_events
       WHERE ts > now() - ($1 || ' hours')::interval AND NOT is_bot
       GROUP BY 1 ORDER BY visitors DESC LIMIT 12`,
      [String(windowHours)],
    );
  }
  trafficPages(windowHours: number) {
    return this.ds.query(
      `SELECT page, COUNT(DISTINCT visitor_id)::int AS visitors,
         AVG(duration_ms)::int AS avg_ms
       FROM marketing_traffic_events
       WHERE ts > now() - ($1 || ' hours')::interval AND NOT is_bot AND page IS NOT NULL
       GROUP BY page ORDER BY visitors DESC LIMIT 20`,
      [String(windowHours)],
    );
  }
  trafficCountries(windowHours: number) {
    return this.ds.query(
      `SELECT COALESCE(country,'Unknown') AS country, COUNT(DISTINCT visitor_id)::int AS visitors
       FROM marketing_traffic_events
       WHERE ts > now() - ($1 || ' hours')::interval AND NOT is_bot
       GROUP BY 1 ORDER BY visitors DESC LIMIT 25`,
      [String(windowHours)],
    );
  }

  // ── IP intel ─────
  listIps(f: { status?: string; page: number; pageSize: number }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (f.status) { w.push(`status=$${i++}`); v.push(f.status); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = f.pageSize; const offset = (f.page - 1) * limit;
    return Promise.all([
      this.ds.query(`SELECT * FROM marketing_ip_intel ${where} ORDER BY reputation DESC, hits_24h DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM marketing_ip_intel ${where}`, v),
    ]).then(([items, count]) => ({ items, total: count[0]?.c ?? 0 }));
  }
  ipAct(ips: string[], status: string, actor: string | null) {
    return this.ds.query(
      `INSERT INTO marketing_ip_intel (ip, status, last_action_by, updated_at)
       SELECT unnest($1::inet[]), $2, $3, now()
       ON CONFLICT (ip) DO UPDATE SET status=EXCLUDED.status, last_action_by=EXCLUDED.last_action_by, updated_at=now()
       RETURNING ip::text, status`,
      [ips, status, actor],
    );
  }

  // ── Tasks ─────
  listTasks(f: { status?: string; page: number; pageSize: number }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (f.status) { w.push(`status=$${i++}`); v.push(f.status); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = f.pageSize; const offset = (f.page - 1) * limit;
    return Promise.all([
      this.ds.query(`SELECT * FROM marketing_tasks ${where}
        ORDER BY CASE status WHEN 'in_progress' THEN 0 WHEN 'open' THEN 1 ELSE 2 END,
                 CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                 due_at NULLS LAST LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM marketing_tasks ${where}`, v),
    ]).then(([items, count]) => ({ items, total: count[0]?.c ?? 0 }));
  }
  async createTask(p: any, actor: string | null) {
    const ref = `MTSK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const r = await this.ds.query(
      `INSERT INTO marketing_tasks (reference, title, detail, assignee_id, created_by, campaign_ref, priority, due_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [ref, p.title, p.detail ?? null, p.assigneeId ?? null, actor, p.campaignRef ?? null, p.priority, p.dueAt ?? null],
    );
    return r[0];
  }
  async updateTask(taskId: string, patch: any) {
    const map: Record<string, string> = { title: 'title', detail: 'detail', assigneeId: 'assignee_id',
      priority: 'priority', status: 'status', dueAt: 'due_at' };
    const fields: string[] = []; const vals: any[] = []; let i = 1;
    for (const [k, c] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${c}=$${i++}`); vals.push(patch[k]); }
    }
    if (!fields.length) return this.ds.query(`SELECT * FROM marketing_tasks WHERE id=$1`, [taskId]).then(r => r[0]);
    fields.push(`updated_at=now()`); vals.push(taskId);
    const r = await this.ds.query(`UPDATE marketing_tasks SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return r[0];
  }

  // ── Notices ─────
  listNotices(f: { status?: string; page: number; pageSize: number }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (f.status) { w.push(`status=$${i++}`); v.push(f.status); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = f.pageSize; const offset = (f.page - 1) * limit;
    return Promise.all([
      this.ds.query(`SELECT * FROM marketing_notices ${where} ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM marketing_notices ${where}`, v),
    ]).then(([items, count]) => ({ items, total: count[0]?.c ?? 0 }));
  }
  async upsertNotice(p: any, actor: string | null) {
    if (p.id) {
      const r = await this.ds.query(
        `UPDATE marketing_notices SET title=$1, body=$2, audience=$3, severity=$4, status=$5, expires_at=$6,
          published_at=CASE WHEN $5='published' AND published_at IS NULL THEN now() ELSE published_at END,
          updated_at=now() WHERE id=$7 RETURNING *`,
        [p.title, p.body, p.audience, p.severity, p.status, p.expiresAt ?? null, p.id],
      );
      return r[0];
    }
    const ref = `NT-${Math.floor(1000 + Math.random() * 9000)}`;
    const r = await this.ds.query(
      `INSERT INTO marketing_notices (reference, title, body, audience, severity, status, expires_at, author_id, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CASE WHEN $6='published' THEN now() ELSE NULL END) RETURNING *`,
      [ref, p.title, p.body, p.audience, p.severity, p.status, p.expiresAt ?? null, actor],
    );
    return r[0];
  }

  // ── Audit ─────
  audit(entity: string, entityId: string, actor: string | null, action: string, before: any, after: any, ip?: string, ua?: string) {
    return this.ds.query(
      `INSERT INTO marketing_admin_audit (entity, entity_id, actor_id, action, before, after, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)`,
      [entity, entityId, actor, action, JSON.stringify(before ?? null), JSON.stringify(after ?? null), ip ?? null, ua ?? null],
    );
  }
}

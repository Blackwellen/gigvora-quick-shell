import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AdsOpsRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Reviews ──────────────────────────────────────────
  async listReviews(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    for (const [c, k] of [
      ['status','status'],['queue','queue'],['creative_kind','creativeKind'],
      ['advertiser_id','advertiserId'],['campaign_id','campaignId'],['assigned_to','assigneeId'],
    ] as const) {
      if (filter[k] !== undefined) { w.push(`${c}=$${i++}`); v.push(filter[k]); }
    }
    if (filter.q) { w.push(`(reference ILIKE $${i} OR headline ILIKE $${i} OR body ILIKE $${i} OR landing_url ILIKE $${i})`); v.push(`%${filter.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM ads_ops_policy_reviews ${where} ORDER BY policy_score DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM ads_ops_policy_reviews ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async reviewById(id: string) {
    const r = await this.ds.query(`SELECT * FROM ads_ops_policy_reviews WHERE id=$1`, [id]); return r[0] ?? null;
  }
  async reviewDetail(id: string) {
    const r = await this.reviewById(id); if (!r) return null;
    const [decisions, events, control] = await Promise.all([
      this.ds.query(`SELECT * FROM ads_ops_decisions WHERE review_id=$1 ORDER BY created_at DESC LIMIT 100`, [id]),
      this.ds.query(`SELECT * FROM ads_ops_events    WHERE review_id=$1 ORDER BY created_at DESC LIMIT 200`, [id]),
      this.ds.query(`SELECT * FROM ads_ops_campaign_controls WHERE campaign_id=$1`, [r.campaign_id]),
    ]);
    return { review: r, decisions, events, control: control[0] ?? null };
  }
  async createReview(p: any, ml: { score: number; band: string; flags: any[]; reasons: string[] }) {
    const ref = `AO-PR-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const sla = new Date(Date.now() + (ml.band === 'critical' ? 2 : ml.band === 'high' ? 6 : 24) * 3_600_000);
    const r = await this.ds.query(
      `INSERT INTO ads_ops_policy_reviews
        (reference, campaign_id, advertiser_id, creative_kind, headline, body, landing_url,
         geos, keywords, policy_score, policy_band, status, queue, sla_due_at, flags, reasons, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,'pending','triage',$12,$13::jsonb,$14::jsonb,$15::jsonb)
       RETURNING *`,
      [ref, p.campaignId, p.advertiserId, p.creativeKind, p.headline ?? null, p.body ?? null, p.landingUrl ?? null,
       JSON.stringify(p.geos ?? []), JSON.stringify(p.keywords ?? []),
       ml.score, ml.band, sla,
       JSON.stringify(ml.flags ?? []), JSON.stringify(ml.reasons ?? []),
       JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async transitionReview(id: string, to: string, queue: string) {
    const r = await this.ds.query(
      `UPDATE ads_ops_policy_reviews SET status=$1, queue=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [to, queue, id],
    );
    return r[0];
  }
  async assignReview(id: string, assigneeId: string | null, queue?: string) {
    const cols = ['assigned_to=$1','updated_at=now()']; const vals: any[] = [assigneeId];
    if (queue) { cols.push(`queue=$${vals.length+1}`); vals.push(queue); }
    vals.push(id);
    const r = await this.ds.query(`UPDATE ads_ops_policy_reviews SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }
  async claimNext(queue: string, assigneeId: string) {
    const rows = await this.ds.query(
      `SELECT id FROM ads_ops_policy_reviews
        WHERE queue=$1 AND assigned_to IS NULL AND status NOT IN ('approved','rejected','archived')
        ORDER BY policy_score DESC, created_at ASC
        FOR UPDATE SKIP LOCKED LIMIT 1`,
      [queue],
    );
    if (!rows.length) return null;
    const r = await this.ds.query(
      `UPDATE ads_ops_policy_reviews
          SET assigned_to=$1,
              status=CASE WHEN status='pending' THEN 'reviewing' ELSE status END,
              updated_at=now()
        WHERE id=$2 RETURNING *`,
      [assigneeId, rows[0].id],
    );
    return r[0];
  }

  async recordDecision(p: { reviewId: string; actorId: string; decision: string; rationale: string; edits: any; appealable: string }) {
    const r = await this.ds.query(
      `INSERT INTO ads_ops_decisions (review_id, actor_id, decision, rationale, edits, appealable)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,
      [p.reviewId, p.actorId, p.decision, p.rationale, JSON.stringify(p.edits ?? {}), p.appealable],
    );
    return r[0];
  }

  async upsertCampaignControl(campaignId: string, status: string, reason: string, setBy: string) {
    const r = await this.ds.query(
      `INSERT INTO ads_ops_campaign_controls (campaign_id, status, reason, set_by, set_at)
       VALUES ($1,$2,$3,$4, now())
       ON CONFLICT (campaign_id) DO UPDATE SET status=EXCLUDED.status, reason=EXCLUDED.reason, set_by=EXCLUDED.set_by, set_at=now()
       RETURNING *`,
      [campaignId, status, reason, setBy],
    );
    return r[0];
  }
  async listCampaignControls() {
    return this.ds.query(`SELECT * FROM ads_ops_campaign_controls ORDER BY set_at DESC LIMIT 200`);
  }

  async logEvent(reviewId: string | null, campaignId: string | null, actorId: string | null, action: string, fromS: string | null, toS: string | null, diff: any) {
    await this.ds.query(
      `INSERT INTO ads_ops_events (review_id, campaign_id, actor_id, action, from_state, to_state, diff)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [reviewId, campaignId, actorId, action, fromS, toS, JSON.stringify(diff ?? {})],
    );
  }

  // ── Geo rules ───────────────────────────────────────
  async listGeoRules(filter: { scope?: string; scopeId?: string }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.scope)   { w.push(`scope=$${i++}`);    v.push(filter.scope); }
    if (filter.scopeId) { w.push(`scope_id=$${i++}`); v.push(filter.scopeId); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    return this.ds.query(`SELECT * FROM ads_ops_geo_rules ${where} ORDER BY created_at DESC LIMIT 500`, v);
  }
  async addGeoRule(p: any, addedBy: string) {
    const r = await this.ds.query(
      `INSERT INTO ads_ops_geo_rules (scope, scope_id, geo_code, rule, category, reason, added_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (scope, scope_id, geo_code, rule, category)
       DO UPDATE SET reason=EXCLUDED.reason, added_by=EXCLUDED.added_by, expires_at=EXCLUDED.expires_at
       RETURNING *`,
      [p.scope, p.scopeId ?? null, p.geoCode.toUpperCase(), p.rule, p.category ?? null, p.reason, addedBy, p.expiresAt ?? null],
    );
    return r[0];
  }
  async removeGeoRule(id: string) { await this.ds.query(`DELETE FROM ads_ops_geo_rules WHERE id=$1`, [id]); }

  // ── Keyword rules ───────────────────────────────────
  async listKeywordRules(filter: { scope?: string; scopeId?: string; q?: string }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.scope)   { w.push(`scope=$${i++}`);    v.push(filter.scope); }
    if (filter.scopeId) { w.push(`scope_id=$${i++}`); v.push(filter.scopeId); }
    if (filter.q)       { w.push(`keyword ILIKE $${i++}`); v.push(`%${filter.q}%`); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    return this.ds.query(`SELECT * FROM ads_ops_keyword_rules ${where} ORDER BY created_at DESC LIMIT 500`, v);
  }
  async addKeywordRule(p: any, addedBy: string) {
    const r = await this.ds.query(
      `INSERT INTO ads_ops_keyword_rules (scope, scope_id, keyword, match, rule, severity, reason, added_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (scope, scope_id, keyword, match)
       DO UPDATE SET rule=EXCLUDED.rule, severity=EXCLUDED.severity, reason=EXCLUDED.reason, added_by=EXCLUDED.added_by, expires_at=EXCLUDED.expires_at
       RETURNING *`,
      [p.scope, p.scopeId ?? null, p.keyword, p.match, p.rule, p.severity, p.reason, addedBy, p.expiresAt ?? null],
    );
    return r[0];
  }
  async removeKeywordRule(id: string) { await this.ds.query(`DELETE FROM ads_ops_keyword_rules WHERE id=$1`, [id]); }

  async kpis() {
    const [byStatus, byQueue, byBand, sla, controls, geoCount, kwCount] = await Promise.all([
      this.ds.query(`SELECT status, COUNT(*)::int c FROM ads_ops_policy_reviews GROUP BY status`),
      this.ds.query(`SELECT queue,  COUNT(*)::int c FROM ads_ops_policy_reviews WHERE status NOT IN ('approved','rejected','archived') GROUP BY queue`),
      this.ds.query(`SELECT policy_band, COUNT(*)::int c FROM ads_ops_policy_reviews WHERE status NOT IN ('approved','rejected','archived') GROUP BY policy_band`),
      this.ds.query(`SELECT COUNT(*)::int c FROM ads_ops_policy_reviews WHERE sla_due_at < now() AND status NOT IN ('approved','rejected','archived')`),
      this.ds.query(`SELECT status, COUNT(*)::int c FROM ads_ops_campaign_controls GROUP BY status`),
      this.ds.query(`SELECT COUNT(*)::int c FROM ads_ops_geo_rules`),
      this.ds.query(`SELECT COUNT(*)::int c FROM ads_ops_keyword_rules`),
    ]);
    return {
      reviewsByStatus: Object.fromEntries(byStatus.map((r: any) => [r.status, r.c])),
      reviewsByQueue:  Object.fromEntries(byQueue.map((r: any)  => [r.queue, r.c])),
      reviewsByBand:   Object.fromEntries(byBand.map((r: any)   => [r.policy_band, r.c])),
      slaBreached:     sla[0]?.c ?? 0,
      campaignControls:Object.fromEntries(controls.map((r: any) => [r.status, r.c])),
      geoRules:        geoCount[0]?.c ?? 0,
      keywordRules:    kwCount[0]?.c ?? 0,
    };
  }
}

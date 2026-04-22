import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class TrustSafetyMlRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Signals ───────────────────────────────────────────
  async listSignals(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    for (const [c, k] of [['status','status'],['source','source'],['subject_kind','subjectKind']] as const) {
      if (filter[k] !== undefined) { w.push(`${c}=$${i++}`); v.push(filter[k]); }
    }
    if (filter.q) { w.push(`(signal_code ILIKE $${i} OR subject_id ILIKE $${i})`); v.push(`%${filter.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM tsml_signals ${where} ORDER BY ml_score DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM tsml_signals ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async createSignal(p: any, ml: { score: number; band: string; reasons: string[] }) {
    const r = await this.ds.query(
      `INSERT INTO tsml_signals (source, subject_kind, subject_id, signal_code, severity,
                                 ml_score, ml_band, features, reasons, status, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,'open',$10::jsonb) RETURNING *`,
      [p.source, p.subjectKind, p.subjectId, p.signalCode, p.severity,
       ml.score, ml.band, JSON.stringify(p.features ?? {}),
       JSON.stringify([...(p.reasons ?? []), ...(ml.reasons ?? [])]),
       JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async signalsByIds(ids: string[]) {
    if (!ids.length) return [];
    return this.ds.query(`SELECT * FROM tsml_signals WHERE id = ANY($1::uuid[])`, [ids]);
  }

  // ── Cases ─────────────────────────────────────────────
  async listCases(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    for (const [c, k] of [
      ['status','status'],['queue','queue'],['case_kind','caseKind'],
      ['subject_kind','subjectKind'],['assigned_to','assigneeId'],
    ] as const) {
      if (filter[k] !== undefined) { w.push(`${c}=$${i++}`); v.push(filter[k]); }
    }
    if (filter.q) { w.push(`(reference ILIKE $${i} OR subject_id ILIKE $${i})`); v.push(`%${filter.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM tsml_cases ${where} ORDER BY risk_score DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM tsml_cases ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async caseById(id: string) {
    const r = await this.ds.query(`SELECT * FROM tsml_cases WHERE id=$1`, [id]); return r[0] ?? null;
  }
  async caseDetail(id: string) {
    const c = await this.caseById(id); if (!c) return null;
    const [decisions, mlReviews, events] = await Promise.all([
      this.ds.query(`SELECT * FROM tsml_decisions   WHERE case_id=$1 ORDER BY created_at DESC LIMIT 100`, [id]),
      this.ds.query(`SELECT * FROM tsml_ml_reviews  WHERE case_id=$1 ORDER BY created_at DESC LIMIT 50`,  [id]),
      this.ds.query(`SELECT * FROM tsml_events      WHERE case_id=$1 ORDER BY created_at DESC LIMIT 200`, [id]),
    ]);
    return { case: c, decisions, mlReviews, events };
  }
  async createCase(p: any, ml: { score: number; band: string; reasons: string[] }, signals: any[]) {
    const ref = `TS-${Math.random().toString(36).slice(2,10).toUpperCase()}`;
    const sla = new Date(Date.now() + (ml.band === 'critical' ? 1 : ml.band === 'high' ? 3 : 12) * 3_600_000);
    const r = await this.ds.query(
      `INSERT INTO tsml_cases (reference, subject_kind, subject_id, case_kind,
                               risk_score, risk_band, status, queue, sla_due_at,
                               signals, features, reasons, meta)
       VALUES ($1,$2,$3,$4,$5,$6,'open','triage',$7,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb)
       RETURNING *`,
      [ref, p.subjectKind, p.subjectId, p.caseKind, ml.score, ml.band, sla,
       JSON.stringify(signals.map(s => ({ id: s.id, code: s.signal_code, score: s.ml_score, band: s.ml_band }))),
       JSON.stringify(p.features ?? {}),
       JSON.stringify([...(p.reasons ?? []), ...(ml.reasons ?? [])]),
       JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async transitionCase(id: string, to: string, queue: string) {
    const r = await this.ds.query(
      `UPDATE tsml_cases SET status=$1, queue=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [to, queue, id],
    );
    return r[0];
  }
  async assignCase(id: string, assigneeId: string | null, queue?: string) {
    const cols = ['assigned_to=$1','updated_at=now()']; const vals: any[] = [assigneeId];
    if (queue) { cols.push(`queue=$${vals.length+1}`); vals.push(queue); }
    vals.push(id);
    const r = await this.ds.query(`UPDATE tsml_cases SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }
  async claimNext(queue: string, assigneeId: string) {
    const rows = await this.ds.query(
      `SELECT id FROM tsml_cases
        WHERE queue=$1 AND assigned_to IS NULL AND status NOT IN ('decided','closed')
        ORDER BY risk_score DESC, created_at ASC
        FOR UPDATE SKIP LOCKED LIMIT 1`,
      [queue],
    );
    if (!rows.length) return null;
    const r = await this.ds.query(
      `UPDATE tsml_cases SET assigned_to=$1, status=CASE WHEN status='open' THEN 'reviewing' ELSE status END, updated_at=now()
        WHERE id=$2 RETURNING *`,
      [assigneeId, rows[0].id],
    );
    return r[0];
  }

  async recordDecision(p: { caseId: string; actorId: string; decision: string; rationale: string; durationH?: number; appealable: string }) {
    const r = await this.ds.query(
      `INSERT INTO tsml_decisions (case_id, actor_id, decision, rationale, duration_h, appealable)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [p.caseId, p.actorId, p.decision, p.rationale, p.durationH ?? null, p.appealable],
    );
    return r[0];
  }
  async recordMlReview(caseId: string, model: string, score: number, band: string, reasons: string[], reviewerId?: string, agreed?: boolean) {
    const r = await this.ds.query(
      `INSERT INTO tsml_ml_reviews (case_id, model, version, score, band, reasons, agreed, reviewer_id, reviewed_at)
       VALUES ($1,$2,'v1',$3,$4,$5::jsonb,$6,$7,CASE WHEN $7 IS NULL THEN NULL ELSE now() END) RETURNING *`,
      [caseId, model, score, band, JSON.stringify(reasons ?? []), agreed ?? null, reviewerId ?? null],
    );
    return r[0];
  }
  async logEvent(caseId: string | null, signalId: string | null, actorId: string | null, action: string, fromS: string | null, toS: string | null, diff: any) {
    await this.ds.query(
      `INSERT INTO tsml_events (case_id, signal_id, actor_id, action, from_state, to_state, diff)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [caseId, signalId, actorId, action, fromS, toS, JSON.stringify(diff ?? {})],
    );
  }

  // ── Watchlists ───────────────────────────────────────
  async listWatchlist(filter: { listKind?: string; subjectKind?: string }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.listKind)    { w.push(`list_kind=$${i++}`);    v.push(filter.listKind); }
    if (filter.subjectKind) { w.push(`subject_kind=$${i++}`); v.push(filter.subjectKind); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    return this.ds.query(`SELECT * FROM tsml_watchlist ${where} ORDER BY created_at DESC LIMIT 200`, v);
  }
  async addWatchlist(p: any, addedBy: string) {
    const r = await this.ds.query(
      `INSERT INTO tsml_watchlist (list_kind, subject_kind, subject_id, reason, added_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (list_kind, subject_kind, subject_id) DO UPDATE SET reason=EXCLUDED.reason, added_by=EXCLUDED.added_by, expires_at=EXCLUDED.expires_at
       RETURNING *`,
      [p.listKind, p.subjectKind, p.subjectId, p.reason, addedBy, p.expiresAt ?? null],
    );
    return r[0];
  }
  async removeWatchlist(id: string) {
    await this.ds.query(`DELETE FROM tsml_watchlist WHERE id=$1`, [id]);
  }

  async kpis() {
    const [casesByStatus, casesByQueue, casesByBand, signalsByBand, signalsOpen, sla, watch] = await Promise.all([
      this.ds.query(`SELECT status, COUNT(*)::int c FROM tsml_cases GROUP BY status`),
      this.ds.query(`SELECT queue,  COUNT(*)::int c FROM tsml_cases WHERE status NOT IN ('decided','closed') GROUP BY queue`),
      this.ds.query(`SELECT risk_band, COUNT(*)::int c FROM tsml_cases WHERE status NOT IN ('decided','closed') GROUP BY risk_band`),
      this.ds.query(`SELECT ml_band, COUNT(*)::int c FROM tsml_signals WHERE status='open' GROUP BY ml_band`),
      this.ds.query(`SELECT COUNT(*)::int c FROM tsml_signals WHERE status='open'`),
      this.ds.query(`SELECT COUNT(*)::int c FROM tsml_cases   WHERE sla_due_at < now() AND status NOT IN ('decided','closed')`),
      this.ds.query(`SELECT list_kind, COUNT(*)::int c FROM tsml_watchlist GROUP BY list_kind`),
    ]);
    return {
      casesByStatus:   Object.fromEntries(casesByStatus.map((r: any) => [r.status, r.c])),
      casesByQueue:    Object.fromEntries(casesByQueue.map((r: any)  => [r.queue,  r.c])),
      casesByBand:     Object.fromEntries(casesByBand.map((r: any)   => [r.risk_band, r.c])),
      signalsByBand:   Object.fromEntries(signalsByBand.map((r: any) => [r.ml_band, r.c])),
      signalsOpen:     signalsOpen[0]?.c ?? 0,
      slaBreached:     sla[0]?.c ?? 0,
      watchlist:       Object.fromEntries(watch.map((r: any) => [r.list_kind, r.c])),
    };
  }
}

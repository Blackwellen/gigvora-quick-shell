import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class VerificationComplianceRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Cases ────────────────────────────────────────────
  async listCases(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    for (const [c, k] of [
      ['status','status'],['queue','queue'],['program','program'],
      ['subject_kind','subjectKind'],['jurisdiction','jurisdiction'],
      ['assigned_to','assigneeId'],
    ] as const) {
      if (filter[k] !== undefined) { w.push(`${c}=$${i++}`); v.push(filter[k]); }
    }
    if (filter.q) {
      w.push(`(reference ILIKE $${i} OR (subject_id::text) ILIKE $${i})`);
      v.push(`%${filter.q}%`); i++;
    }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM vc_cases ${where} ORDER BY risk_score DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM vc_cases ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async caseById(id: string) {
    const r = await this.ds.query(`SELECT * FROM vc_cases WHERE id=$1`, [id]); return r[0] ?? null;
  }
  async caseDetail(id: string) {
    const c = await this.caseById(id); if (!c) return null;
    const [documents, checks, decisions, events] = await Promise.all([
      this.ds.query(`SELECT * FROM vc_documents WHERE case_id=$1 ORDER BY uploaded_at DESC LIMIT 100`, [id]),
      this.ds.query(`SELECT * FROM vc_checks    WHERE case_id=$1 ORDER BY created_at DESC LIMIT 100`, [id]),
      this.ds.query(`SELECT * FROM vc_decisions WHERE case_id=$1 ORDER BY created_at DESC LIMIT 100`, [id]),
      this.ds.query(`SELECT * FROM vc_events    WHERE case_id=$1 ORDER BY created_at DESC LIMIT 200`, [id]),
    ]);
    return { case: c, documents, checks, decisions, events };
  }
  async createCase(p: any, ml: { score: number; band: string; flags: any[]; reasons: string[] }) {
    const ref = `VC-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const sla = new Date(Date.now() + (ml.band === 'critical' ? 2 : ml.band === 'high' ? 6 : 24) * 3_600_000);
    const r = await this.ds.query(
      `INSERT INTO vc_cases
        (reference, subject_id, subject_kind, program, jurisdiction,
         risk_score, risk_band, status, queue, sla_due_at, reasons, flags, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending','triage',$8,$9::jsonb,$10::jsonb,$11::jsonb)
       RETURNING *`,
      [ref, p.subjectId, p.subjectKind, p.program, p.jurisdiction ?? 'GB',
       ml.score, ml.band, sla,
       JSON.stringify([...(p.reasons ?? []), ...(ml.reasons ?? [])]),
       JSON.stringify(ml.flags ?? []),
       JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async transitionCase(id: string, to: string, queue: string) {
    const r = await this.ds.query(
      `UPDATE vc_cases SET status=$1, queue=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [to, queue, id],
    );
    return r[0];
  }
  async assignCase(id: string, assigneeId: string | null, queue?: string) {
    const cols = ['assigned_to=$1','updated_at=now()']; const vals: any[] = [assigneeId];
    if (queue) { cols.push(`queue=$${vals.length+1}`); vals.push(queue); }
    vals.push(id);
    const r = await this.ds.query(`UPDATE vc_cases SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }
  async claimNext(queue: string, assigneeId: string) {
    const rows = await this.ds.query(
      `SELECT id FROM vc_cases
        WHERE queue=$1 AND assigned_to IS NULL AND status NOT IN ('approved','rejected','archived','expired')
        ORDER BY risk_score DESC, created_at ASC
        FOR UPDATE SKIP LOCKED LIMIT 1`,
      [queue],
    );
    if (!rows.length) return null;
    const r = await this.ds.query(
      `UPDATE vc_cases
          SET assigned_to=$1,
              status=CASE WHEN status='pending' THEN 'reviewing' ELSE status END,
              updated_at=now()
        WHERE id=$2 RETURNING *`,
      [assigneeId, rows[0].id],
    );
    return r[0];
  }
  async setExpiry(id: string, expiresAt: Date | null) {
    const r = await this.ds.query(`UPDATE vc_cases SET expires_at=$1, updated_at=now() WHERE id=$2 RETURNING *`, [expiresAt, id]);
    return r[0];
  }

  // ── Decisions ────────────────────────────────────────
  async recordDecision(p: { caseId: string; actorId: string; decision: string; rationale: string; durationDays?: number; appealable: string }) {
    const r = await this.ds.query(
      `INSERT INTO vc_decisions (case_id, actor_id, decision, rationale, duration_days, appealable)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [p.caseId, p.actorId, p.decision, p.rationale, p.durationDays ?? null, p.appealable],
    );
    return r[0];
  }

  // ── Documents ────────────────────────────────────────
  async addDocument(p: any) {
    const r = await this.ds.query(
      `INSERT INTO vc_documents
         (case_id, kind, filename, storage_url, mime_type, bytes, hash_sha256, ocr_fields, liveness_score, match_score, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,'pending') RETURNING *`,
      [p.caseId, p.kind, p.filename, p.storageUrl, p.mimeType ?? null, p.bytes ?? null, p.hashSha256 ?? null,
       JSON.stringify(p.ocrFields ?? {}), p.livenessScore ?? null, p.matchScore ?? null],
    );
    return r[0];
  }
  async reviewDocument(id: string, status: string, reviewerId: string) {
    const r = await this.ds.query(
      `UPDATE vc_documents SET status=$1, reviewed_by=$2, reviewed_at=now() WHERE id=$3 RETURNING *`,
      [status, reviewerId, id],
    );
    return r[0];
  }

  // ── Checks ───────────────────────────────────────────
  async recordCheck(p: { caseId: string; provider: string; checkType: string; result: string; score?: number; payload?: any; externalId?: string }) {
    const r = await this.ds.query(
      `INSERT INTO vc_checks (case_id, provider, check_type, result, score, payload, external_id, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7, CASE WHEN $4='pending' THEN NULL ELSE now() END) RETURNING *`,
      [p.caseId, p.provider, p.checkType, p.result, p.score ?? null, JSON.stringify(p.payload ?? {}), p.externalId ?? null],
    );
    return r[0];
  }

  // ── Watchlist ────────────────────────────────────────
  async listWatchlist(filter: { subjectKind?: string; severity?: string }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.subjectKind) { w.push(`subject_kind=$${i++}`); v.push(filter.subjectKind); }
    if (filter.severity)    { w.push(`severity=$${i++}`);     v.push(filter.severity); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    return this.ds.query(`SELECT * FROM vc_watchlist ${where} ORDER BY created_at DESC LIMIT 500`, v);
  }
  async addWatchlist(p: any, addedBy: string) {
    const r = await this.ds.query(
      `INSERT INTO vc_watchlist (subject_id, subject_kind, reason, severity, added_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (subject_id, subject_kind, reason)
       DO UPDATE SET severity=EXCLUDED.severity, added_by=EXCLUDED.added_by, expires_at=EXCLUDED.expires_at
       RETURNING *`,
      [p.subjectId, p.subjectKind, p.reason, p.severity, addedBy, p.expiresAt ?? null],
    );
    return r[0];
  }
  async removeWatchlist(id: string) { await this.ds.query(`DELETE FROM vc_watchlist WHERE id=$1`, [id]); }

  // ── Events ───────────────────────────────────────────
  async logEvent(caseId: string | null, subjectId: string | null, actorId: string | null, action: string, fromS: string | null, toS: string | null, diff: any, ip?: string) {
    await this.ds.query(
      `INSERT INTO vc_events (case_id, subject_id, actor_id, action, from_state, to_state, diff, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::inet)`,
      [caseId, subjectId, actorId, action, fromS, toS, JSON.stringify(diff ?? {}), ip ?? null],
    );
  }

  // ── KPIs ─────────────────────────────────────────────
  async kpis() {
    const [byStatus, byQueue, byBand, byProgram, sla, expiring, watchlist] = await Promise.all([
      this.ds.query(`SELECT status, COUNT(*)::int c FROM vc_cases GROUP BY status`),
      this.ds.query(`SELECT queue,  COUNT(*)::int c FROM vc_cases WHERE status NOT IN ('approved','rejected','archived','expired') GROUP BY queue`),
      this.ds.query(`SELECT risk_band, COUNT(*)::int c FROM vc_cases WHERE status NOT IN ('approved','rejected','archived','expired') GROUP BY risk_band`),
      this.ds.query(`SELECT program, COUNT(*)::int c FROM vc_cases GROUP BY program`),
      this.ds.query(`SELECT COUNT(*)::int c FROM vc_cases WHERE sla_due_at < now() AND status NOT IN ('approved','rejected','archived','expired')`),
      this.ds.query(`SELECT COUNT(*)::int c FROM vc_cases WHERE status='approved' AND expires_at IS NOT NULL AND expires_at < now()+interval '30 days'`),
      this.ds.query(`SELECT COUNT(*)::int c FROM vc_watchlist`),
    ]);
    return {
      casesByStatus:  Object.fromEntries(byStatus.map((r: any)  => [r.status, r.c])),
      casesByQueue:   Object.fromEntries(byQueue.map((r: any)   => [r.queue, r.c])),
      casesByBand:    Object.fromEntries(byBand.map((r: any)    => [r.risk_band, r.c])),
      casesByProgram: Object.fromEntries(byProgram.map((r: any) => [r.program, r.c])),
      slaBreached:    sla[0]?.c ?? 0,
      expiringSoon:   expiring[0]?.c ?? 0,
      watchlist:      watchlist[0]?.c ?? 0,
    };
  }
}

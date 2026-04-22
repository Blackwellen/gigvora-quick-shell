import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DisputeOpsRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async listCases(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    for (const [c, k] of [
      ['status','status'],['queue','queue'],['category','category'],
      ['severity','severity'],['assignee_id','assigneeId'],
    ] as const) {
      if (filter[k] !== undefined) { w.push(`${c}=$${i++}`); v.push(filter[k]); }
    }
    if (filter.q) { w.push(`(reference ILIKE $${i} OR subject ILIKE $${i})`); v.push(`%${filter.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(
        `SELECT * FROM dop_cases ${where} ORDER BY priority_score DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM dop_cases ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async caseById(id: string) {
    const r = await this.ds.query(`SELECT * FROM dop_cases WHERE id=$1`, [id]);
    return r[0] ?? null;
  }
  async caseDetail(id: string) {
    const c = await this.caseById(id);
    if (!c) return null;
    const [messages, evidence, events, arbitration] = await Promise.all([
      this.ds.query(`SELECT * FROM dop_messages  WHERE case_id=$1 ORDER BY created_at ASC LIMIT 500`, [id]),
      this.ds.query(`SELECT * FROM dop_evidence  WHERE case_id=$1 ORDER BY created_at DESC LIMIT 200`, [id]),
      this.ds.query(`SELECT * FROM dop_events    WHERE case_id=$1 ORDER BY created_at DESC LIMIT 200`, [id]),
      this.ds.query(`SELECT * FROM dop_arbitration WHERE case_id=$1 ORDER BY opened_at DESC LIMIT 5`, [id]),
    ]);
    return { case: c, messages, evidence, events, arbitration };
  }
  async createCase(p: any, priority: number) {
    const ref = `DOP-${Math.random().toString(36).slice(2,10).toUpperCase()}`;
    const sla = new Date(Date.now() + (p.severity === 'critical' ? 1 : p.severity === 'high' ? 2 : 5) * 86_400_000);
    const r = await this.ds.query(
      `INSERT INTO dop_cases
       (reference, subject, description, category, severity, amount_minor, currency,
        claimant_id, respondent_id, source_kind, source_id, status, queue, priority_score, sla_due_at, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending','triage',$12,$13,$14::jsonb)
       RETURNING *`,
      [ref, p.subject, p.description, p.category, p.severity, p.amountMinor, p.currency,
       p.claimantId, p.respondentId ?? null, p.sourceKind ?? null, p.sourceId ?? null,
       priority, sla, JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async transitionCase(id: string, to: string, queue: string) {
    const cols = ['status=$1','queue=$2','updated_at=now()']; const vals: any[] = [to, queue];
    if (to === 'resolved' || to === 'dismissed' || to === 'closed') cols.push(`resolved_at=COALESCE(resolved_at, now())`);
    vals.push(id);
    const r = await this.ds.query(`UPDATE dop_cases SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }
  async assignCase(id: string, assigneeId: string | null, queue?: string) {
    const cols = ['assignee_id=$1','updated_at=now()']; const vals: any[] = [assigneeId];
    if (queue) { cols.push(`queue=$${vals.length+1}`); vals.push(queue); }
    vals.push(id);
    const r = await this.ds.query(`UPDATE dop_cases SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }
  async setOutcome(id: string, outcome: string, amountMinor?: number) {
    const r = await this.ds.query(
      `UPDATE dop_cases SET outcome=$1, outcome_amount_minor=$2, status='resolved', queue='closed', resolved_at=now(), updated_at=now()
       WHERE id=$3 RETURNING *`,
      [outcome, amountMinor ?? null, id],
    );
    return r[0];
  }
  async postMessage(p: any) {
    const r = await this.ds.query(
      `INSERT INTO dop_messages (case_id, author_id, author_role, body, attachments, visibility)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,
      [p.caseId, p.authorId, p.authorRole, p.body, JSON.stringify(p.attachments ?? []), p.visibility ?? 'parties'],
    );
    return r[0];
  }
  async addEvidence(p: any) {
    const r = await this.ds.query(
      `INSERT INTO dop_evidence (case_id, uploaded_by, party, kind, label, url, bytes, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *`,
      [p.caseId, p.uploadedBy, p.party, p.kind, p.label, p.url ?? null, p.bytes ?? null, JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async logEvent(caseId: string | null, actorId: string | null, action: string, fromState: string | null, toState: string | null, diff: any) {
    await this.ds.query(
      `INSERT INTO dop_events (case_id, actor_id, action, from_state, to_state, diff)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [caseId, actorId, action, fromState, toState, JSON.stringify(diff ?? {})],
    );
  }
  async openArbitration(p: { caseId: string; panel: any[]; openedBy: string }) {
    const r = await this.ds.query(
      `INSERT INTO dop_arbitration (case_id, panel, opened_by) VALUES ($1,$2::jsonb,$3) RETURNING *`,
      [p.caseId, JSON.stringify(p.panel), p.openedBy],
    );
    return r[0];
  }
  async decideArbitration(p: { caseId: string; decision: string; amountMinor?: number; rationale: string; decidedBy: string }) {
    const r = await this.ds.query(
      `UPDATE dop_arbitration SET decision=$1, decision_amount_minor=$2, rationale=$3,
              decided_at=now(), decided_by=$4
        WHERE case_id=$5 AND decided_at IS NULL
        RETURNING *`,
      [p.decision, p.amountMinor ?? null, p.rationale, p.decidedBy, p.caseId],
    );
    return r[0] ?? null;
  }

  // Queue jump — claim next case (deterministic, lock-safe).
  async claimNext(queue: string, assigneeId: string) {
    const rows = await this.ds.query(
      `SELECT id FROM dop_cases
        WHERE queue=$1 AND assignee_id IS NULL AND status NOT IN ('resolved','dismissed','closed')
        ORDER BY priority_score DESC, created_at ASC
        FOR UPDATE SKIP LOCKED LIMIT 1`,
      [queue],
    );
    if (!rows.length) return null;
    const r = await this.ds.query(
      `UPDATE dop_cases SET assignee_id=$1, updated_at=now() WHERE id=$2 RETURNING *`,
      [assigneeId, rows[0].id],
    );
    return r[0];
  }

  async kpis() {
    const [byStatus, byQueue, bySeverity, slaBreached] = await Promise.all([
      this.ds.query(`SELECT status, COUNT(*)::int c FROM dop_cases GROUP BY status`),
      this.ds.query(`SELECT queue,  COUNT(*)::int c FROM dop_cases WHERE status NOT IN ('resolved','dismissed','closed') GROUP BY queue`),
      this.ds.query(`SELECT severity, COUNT(*)::int c FROM dop_cases WHERE status NOT IN ('resolved','dismissed','closed') GROUP BY severity`),
      this.ds.query(`SELECT COUNT(*)::int c FROM dop_cases WHERE sla_due_at < now() AND status NOT IN ('resolved','dismissed','closed')`),
    ]);
    return {
      byStatus:   Object.fromEntries(byStatus.map((r: any)   => [r.status,   r.c])),
      byQueue:    Object.fromEntries(byQueue.map((r: any)    => [r.queue,    r.c])),
      bySeverity: Object.fromEntries(bySeverity.map((r: any) => [r.severity, r.c])),
      slaBreached: slaBreached[0]?.c ?? 0,
    };
  }
}

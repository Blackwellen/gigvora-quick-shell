import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ModeratorDashboardRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async listItems(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    for (const [c, k] of [
      ['status','status'],['queue','queue'],['surface','surface'],
      ['reason_code','reasonCode'],['severity','severity'],['assigned_to','assigneeId'],
    ] as const) {
      if (filter[k] !== undefined) { w.push(`${c}=$${i++}`); v.push(filter[k]); }
    }
    if (filter.q) { w.push(`(reference ILIKE $${i} OR target_id ILIKE $${i})`); v.push(`%${filter.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM mod_queue_items ${where} ORDER BY ml_score DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM mod_queue_items ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async itemById(id: string) {
    const r = await this.ds.query(`SELECT * FROM mod_queue_items WHERE id=$1`, [id]);
    return r[0] ?? null;
  }
  async itemDetail(id: string) {
    const item = await this.itemById(id); if (!item) return null;
    const [actions, events] = await Promise.all([
      this.ds.query(`SELECT * FROM mod_actions WHERE item_id=$1 ORDER BY created_at DESC LIMIT 100`, [id]),
      this.ds.query(`SELECT * FROM mod_events  WHERE item_id=$1 ORDER BY created_at DESC LIMIT 200`, [id]),
    ]);
    return { item, actions, events };
  }
  async createItem(p: any, ml: { score: number; band: string; reasons: string[] }) {
    const ref = `MOD-${Math.random().toString(36).slice(2,10).toUpperCase()}`;
    const sla = new Date(Date.now() + (p.severity === 'critical' ? 1 : p.severity === 'high' ? 3 : 12) * 3_600_000);
    const r = await this.ds.query(
      `INSERT INTO mod_queue_items
        (reference, surface, target_id, reason_code, reason_detail, reporter_id, evidence,
         severity, ml_score, ml_band, ml_reasons, status, queue, sla_due_at, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11::jsonb,'open','triage',$12,$13::jsonb)
       RETURNING *`,
      [ref, p.surface, p.targetId, p.reasonCode, p.reasonDetail ?? null, p.reporterId ?? null,
       JSON.stringify(p.evidence ?? []), p.severity, ml.score, ml.band, JSON.stringify(ml.reasons ?? []),
       sla, JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async transitionItem(id: string, to: string, queue: string) {
    const r = await this.ds.query(
      `UPDATE mod_queue_items SET status=$1, queue=$2, updated_at=now() WHERE id=$3 RETURNING *`,
      [to, queue, id],
    );
    return r[0];
  }
  async assignItem(id: string, assigneeId: string | null, queue?: string) {
    const cols = ['assigned_to=$1','updated_at=now()']; const vals: any[] = [assigneeId];
    if (queue) { cols.push(`queue=$${vals.length+1}`); vals.push(queue); }
    vals.push(id);
    const r = await this.ds.query(`UPDATE mod_queue_items SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }
  async recordAction(p: { itemId: string; actorId: string; action: string; rationale: string; durationH?: number; appealable: string }) {
    const r = await this.ds.query(
      `INSERT INTO mod_actions (item_id, actor_id, action, rationale, duration_h, appealable)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [p.itemId, p.actorId, p.action, p.rationale, p.durationH ?? null, p.appealable],
    );
    return r[0];
  }
  async logEvent(itemId: string | null, incidentId: string | null, actorId: string | null, action: string, fromS: string | null, toS: string | null, diff: any) {
    await this.ds.query(
      `INSERT INTO mod_events (item_id, incident_id, actor_id, action, from_state, to_state, diff)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [itemId, incidentId, actorId, action, fromS, toS, JSON.stringify(diff ?? {})],
    );
  }
  async claimNext(queue: string, assigneeId: string) {
    const rows = await this.ds.query(
      `SELECT id FROM mod_queue_items
        WHERE queue=$1 AND assigned_to IS NULL AND status NOT IN ('actioned','dismissed','closed')
        ORDER BY ml_score DESC, created_at ASC
        FOR UPDATE SKIP LOCKED LIMIT 1`,
      [queue],
    );
    if (!rows.length) return null;
    const r = await this.ds.query(
      `UPDATE mod_queue_items SET assigned_to=$1, status=CASE WHEN status='open' THEN 'triaging' ELSE status END, updated_at=now()
        WHERE id=$2 RETURNING *`,
      [assigneeId, rows[0].id],
    );
    return r[0];
  }

  async listIncidents(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.status) { w.push(`status=$${i++}`); v.push(filter.status); }
    if (filter.signal) { w.push(`signal=$${i++}`); v.push(filter.signal); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM mod_messaging_incidents ${where} ORDER BY ml_score DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM mod_messaging_incidents ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async reviewIncident(id: string, to: string, reviewerId: string) {
    const r = await this.ds.query(
      `UPDATE mod_messaging_incidents
          SET status=$1, reviewed_by=$2, reviewed_at=now()
        WHERE id=$3 RETURNING *`,
      [to, reviewerId, id],
    );
    return r[0];
  }

  async macros() { return this.ds.query(`SELECT * FROM mod_macros ORDER BY label ASC`); }

  async kpis() {
    const [byStatus, byQueue, bySeverity, sla, msg] = await Promise.all([
      this.ds.query(`SELECT status, COUNT(*)::int c FROM mod_queue_items GROUP BY status`),
      this.ds.query(`SELECT queue,  COUNT(*)::int c FROM mod_queue_items WHERE status NOT IN ('actioned','dismissed','closed') GROUP BY queue`),
      this.ds.query(`SELECT severity, COUNT(*)::int c FROM mod_queue_items WHERE status NOT IN ('actioned','dismissed','closed') GROUP BY severity`),
      this.ds.query(`SELECT COUNT(*)::int c FROM mod_queue_items WHERE sla_due_at < now() AND status NOT IN ('actioned','dismissed','closed')`),
      this.ds.query(`SELECT status, COUNT(*)::int c FROM mod_messaging_incidents GROUP BY status`),
    ]);
    return {
      byStatus:   Object.fromEntries(byStatus.map((r: any)   => [r.status,   r.c])),
      byQueue:    Object.fromEntries(byQueue.map((r: any)    => [r.queue,    r.c])),
      bySeverity: Object.fromEntries(bySeverity.map((r: any) => [r.severity, r.c])),
      slaBreached: sla[0]?.c ?? 0,
      messagingByStatus: Object.fromEntries(msg.map((r: any) => [r.status, r.c])),
    };
  }
}

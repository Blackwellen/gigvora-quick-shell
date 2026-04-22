import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CustomerServiceRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Tickets ────────────────────────────────────────
  async list(filter: any) {
    const where: string[] = []; const vals: any[] = []; let i = 1;
    for (const [col, key] of [
      ['status','status'], ['priority','priority'], ['category','category'],
      ['queue_slug','queueSlug'], ['assignee_id','assigneeId'], ['requester_id','requesterId'],
    ] as const) {
      if (filter[key] !== undefined) { where.push(`${col}=$${i++}`); vals.push(filter[key]); }
    }
    if (filter.q) {
      where.push(`(subject ILIKE $${i} OR reference ILIKE $${i} OR requester_email ILIKE $${i})`);
      vals.push(`%${filter.q}%`); i++;
    }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(
        `SELECT * FROM cs_tickets ${w}
          ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                   sla_due_at NULLS LAST, created_at DESC
          LIMIT ${limit} OFFSET ${offset}`,
        vals,
      ),
      this.ds.query(`SELECT COUNT(*)::int AS c FROM cs_tickets ${w}`, vals),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }

  async byId(id: string) {
    const r = await this.ds.query(`SELECT * FROM cs_tickets WHERE id=$1 LIMIT 1`, [id]);
    return r[0] ?? null;
  }

  async create(p: any) {
    const ref = `CS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const r = await this.ds.query(
      `INSERT INTO cs_tickets (reference, requester_id, requester_email, subject, body, category, priority, channel, status, queue_slug, sla_due_at, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10,$11::jsonb)
       RETURNING *`,
      [ref, p.requesterId, p.requesterEmail, p.subject, p.body ?? '',
       p.category ?? 'general', p.priority ?? 'normal', p.channel ?? 'web',
       p.queueSlug ?? this.queueForCategory(p.category ?? 'general'),
       p.slaDueAt ?? this.defaultSla(p.priority ?? 'normal'),
       JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }

  async update(id: string, patch: any) {
    const map: Record<string,string> = {
      subject:'subject', priority:'priority', category:'category', queueSlug:'queue_slug',
      assigneeId:'assignee_id', slaDueAt:'sla_due_at', csatScore:'csat_score',
    };
    const fields: string[] = []; const vals: any[] = []; let i = 1;
    for (const [k,c] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${c}=$${i++}`); vals.push(patch[k]); }
    }
    if (patch.meta !== undefined) { fields.push(`meta=$${i++}::jsonb`); vals.push(JSON.stringify(patch.meta)); }
    if (!fields.length) return this.byId(id);
    fields.push(`updated_at=now()`);
    vals.push(id);
    const r = await this.ds.query(`UPDATE cs_tickets SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return r[0];
  }

  async transition(id: string, to: string) {
    const resolvedAt = ['resolved','closed','refunded'].includes(to) ? 'now()' : 'NULL';
    const r = await this.ds.query(
      `UPDATE cs_tickets SET status=$1, resolved_at=COALESCE(resolved_at, ${resolvedAt}), updated_at=now()
        WHERE id=$2 RETURNING *`,
      [to, id],
    );
    return r[0];
  }

  // ── Messages + events ──────────────────────────────
  listMessages(ticketId: string) {
    return this.ds.query(
      `SELECT * FROM cs_ticket_messages WHERE ticket_id=$1 ORDER BY created_at ASC`, [ticketId],
    );
  }
  async postMessage(ticketId: string, authorId: string, authorKind: string, body: string, visibility: string, attachments: any[]) {
    const r = await this.ds.query(
      `INSERT INTO cs_ticket_messages (ticket_id, author_id, author_kind, body, visibility, attachments)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *`,
      [ticketId, authorId, authorKind, body, visibility, JSON.stringify(attachments)],
    );
    return r[0];
  }
  listEvents(ticketId: string) {
    return this.ds.query(
      `SELECT * FROM cs_ticket_events WHERE ticket_id=$1 ORDER BY created_at DESC LIMIT 200`, [ticketId],
    );
  }
  async event(ticketId: string, actorId: string | null, action: string, diff: any) {
    await this.ds.query(
      `INSERT INTO cs_ticket_events (ticket_id, actor_id, action, diff) VALUES ($1,$2,$3,$4::jsonb)`,
      [ticketId, actorId, action, JSON.stringify(diff ?? {})],
    );
  }

  // ── Macros ─────────────────────────────────────────
  listMacros() {
    return this.ds.query(`SELECT * FROM cs_macros WHERE enabled=TRUE ORDER BY label`);
  }

  // ── KPIs ───────────────────────────────────────────
  async kpis() {
    const [byStatus, byPriority, breaches, csat] = await Promise.all([
      this.ds.query(`SELECT status, COUNT(*)::int c FROM cs_tickets GROUP BY status`),
      this.ds.query(`SELECT priority, COUNT(*)::int c FROM cs_tickets WHERE status NOT IN ('closed','archived','resolved') GROUP BY priority`),
      this.ds.query(`SELECT COUNT(*)::int c FROM cs_tickets WHERE sla_due_at IS NOT NULL AND sla_due_at < now() AND status NOT IN ('closed','resolved','archived')`),
      this.ds.query(`SELECT AVG(csat_score)::float a, COUNT(csat_score)::int c FROM cs_tickets WHERE csat_score IS NOT NULL`),
    ]);
    return {
      byStatus:   Object.fromEntries(byStatus.map((r: any) => [r.status, r.c])),
      byPriority: Object.fromEntries(byPriority.map((r: any) => [r.priority, r.c])),
      breaches:   breaches[0]?.c ?? 0,
      csat:       { avg: csat[0]?.a ?? null, count: csat[0]?.c ?? 0 },
    };
  }

  private queueForCategory(c: string) {
    const map: Record<string,string> = {
      billing:'billing', refund:'refunds', dispute:'disputes', account:'account',
      technical:'technical', trust_safety:'trust', enterprise:'enterprise',
      escalation:'escalations', general:'general',
    };
    return map[c] ?? 'general';
  }
  private defaultSla(priority: string) {
    const hours = { urgent: 1, high: 4, normal: 24, low: 72 }[priority as 'urgent'] ?? 24;
    return new Date(Date.now() + hours * 3600_000).toISOString();
  }
}

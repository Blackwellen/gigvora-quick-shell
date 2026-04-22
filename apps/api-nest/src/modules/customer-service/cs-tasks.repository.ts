import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CsTasksRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  list(filter: { status?: string; assigneeId?: string; priority?: string; q?: string; page: number; pageSize: number }) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.status)     { w.push(`status=$${i++}`);      v.push(filter.status); }
    if (filter.priority)   { w.push(`priority=$${i++}`);    v.push(filter.priority); }
    if (filter.assigneeId) { w.push(`assignee_id=$${i++}`); v.push(filter.assigneeId); }
    if (filter.q)          { w.push(`(title ILIKE $${i} OR reference ILIKE $${i})`); v.push(`%${filter.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize; const offset = (filter.page - 1) * limit;
    return Promise.all([
      this.ds.query(`SELECT * FROM cs_tasks ${where}
        ORDER BY CASE status WHEN 'in_progress' THEN 0 WHEN 'open' THEN 1 WHEN 'blocked' THEN 2 ELSE 3 END,
                 CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                 due_at NULLS LAST, created_at DESC
        LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM cs_tasks ${where}`, v),
    ]).then(([items, count]) => ({ items, total: count[0]?.c ?? 0 }));
  }

  async create(p: { title: string; detail?: string; assigneeId?: string; createdBy?: string; ticketId?: string; priority?: string; dueAt?: string; meta?: any }) {
    const ref = `TSK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const r = await this.ds.query(
      `INSERT INTO cs_tasks (reference, title, detail, assignee_id, created_by, ticket_id, priority, due_at, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) RETURNING *`,
      [ref, p.title, p.detail ?? null, p.assigneeId ?? null, p.createdBy ?? null, p.ticketId ?? null,
       p.priority ?? 'normal', p.dueAt ?? null, JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }

  async update(id: string, patch: any) {
    const map: Record<string, string> = {
      title: 'title', detail: 'detail', assigneeId: 'assignee_id',
      priority: 'priority', status: 'status', dueAt: 'due_at',
    };
    const fields: string[] = []; const vals: any[] = []; let i = 1;
    for (const [k, c] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${c}=$${i++}`); vals.push(patch[k]); }
    }
    if (patch.meta !== undefined) { fields.push(`meta=$${i++}::jsonb`); vals.push(JSON.stringify(patch.meta)); }
    if (!fields.length) return this.byId(id);
    fields.push(`updated_at=now()`); vals.push(id);
    const r = await this.ds.query(`UPDATE cs_tasks SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return r[0];
  }

  byId(id: string) {
    return this.ds.query(`SELECT * FROM cs_tasks WHERE id=$1 LIMIT 1`, [id]).then((r) => r[0] ?? null);
  }
}

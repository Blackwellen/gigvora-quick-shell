import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Raw SQL repository for the Internal Admin Shell.
 * Returns plain rows; the service shapes envelopes.
 */
@Injectable()
export class InternalAdminShellRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Workspaces ──────────────────────────────────────
  listWorkspaces() {
    return this.ds.query(`SELECT * FROM ias_workspaces WHERE status<>'archived' ORDER BY position ASC, label ASC`);
  }
  async getWorkspaceBySlug(slug: string) {
    const r = await this.ds.query(`SELECT * FROM ias_workspaces WHERE slug=$1 LIMIT 1`, [slug]);
    return r[0] ?? null;
  }
  async createWorkspace(dto: any) {
    const r = await this.ds.query(
      `INSERT INTO ias_workspaces (slug,label,description,icon,route,required_role,risk_band,status,position,meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) RETURNING *`,
      [dto.slug, dto.label, dto.description ?? '', dto.icon ?? 'shield', dto.route,
       dto.requiredRole ?? 'operator', dto.riskBand ?? 'low', dto.status ?? 'active',
       dto.position ?? 0, JSON.stringify(dto.meta ?? {})],
    );
    return r[0];
  }
  async updateWorkspace(id: string, patch: any) {
    const fields: string[] = []; const vals: any[] = []; let i = 1;
    const map: Record<string,string> = {
      label:'label', description:'description', icon:'icon', route:'route',
      requiredRole:'required_role', riskBand:'risk_band', status:'status', position:'position',
    };
    for (const [k,c] of Object.entries(map)) {
      if (patch[k] !== undefined) { fields.push(`${c}=$${i++}`); vals.push(patch[k]); }
    }
    if (patch.meta !== undefined) { fields.push(`meta=$${i++}::jsonb`); vals.push(JSON.stringify(patch.meta)); }
    if (!fields.length) {
      const r = await this.ds.query(`SELECT * FROM ias_workspaces WHERE id=$1`, [id]); return r[0];
    }
    fields.push(`updated_at=now()`);
    vals.push(id);
    const r = await this.ds.query(`UPDATE ias_workspaces SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return r[0];
  }

  // ── Queues ──────────────────────────────────────────
  listQueues(opts: { workspaceSlug?: string; domain?: string } = {}) {
    const where: string[] = [`q.status<>'archived'`]; const vals: any[] = []; let i = 1;
    if (opts.workspaceSlug) { where.push(`w.slug=$${i++}`); vals.push(opts.workspaceSlug); }
    if (opts.domain) { where.push(`q.domain=$${i++}`); vals.push(opts.domain); }
    return this.ds.query(
      `SELECT q.*, w.slug AS workspace_slug, w.label AS workspace_label
         FROM ias_queues q
         LEFT JOIN ias_workspaces w ON w.id=q.workspace_id
        WHERE ${where.join(' AND ')}
        ORDER BY q.health DESC, q.depth DESC, q.label ASC`,
      vals,
    );
  }
  async getQueueBySlug(slug: string) {
    const r = await this.ds.query(`SELECT * FROM ias_queues WHERE slug=$1 LIMIT 1`, [slug]);
    return r[0] ?? null;
  }
  async createQueue(workspaceId: string | null, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO ias_queues (workspace_id, slug, label, domain, status, sla_minutes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [workspaceId, dto.slug, dto.label, dto.domain, dto.status ?? 'active', dto.slaMinutes ?? 60],
    );
    return r[0];
  }

  // ── Queue items ─────────────────────────────────────
  listQueueItems(queueId: string, limit = 100) {
    return this.ds.query(
      `SELECT * FROM ias_queue_items WHERE queue_id=$1
        ORDER BY CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                 due_at NULLS LAST, created_at ASC
        LIMIT $2`,
      [queueId, limit],
    );
  }
  async getQueueItem(id: string) {
    const r = await this.ds.query(`SELECT * FROM ias_queue_items WHERE id=$1 LIMIT 1`, [id]);
    return r[0] ?? null;
  }
  async createQueueItem(queueId: string, dto: any) {
    const r = await this.ds.query(
      `INSERT INTO ias_queue_items (queue_id, reference, subject, priority, due_at, payload)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING *`,
      [queueId, dto.reference, dto.subject ?? '', dto.priority ?? 'normal',
       dto.dueAt ?? null, JSON.stringify(dto.payload ?? {})],
    );
    return r[0];
  }
  async transitionQueueItem(id: string, state: string, assigneeId: string | null) {
    const r = await this.ds.query(
      `UPDATE ias_queue_items SET state=$1, assignee_id=COALESCE($2, assignee_id), updated_at=now()
        WHERE id=$3 RETURNING *`,
      [state, assigneeId, id],
    );
    return r[0];
  }

  /**
   * Pick the next queue item across the operator's accessible queues.
   * Deterministic: highest priority, then oldest due_at, then earliest created.
   * Locks the row using FOR UPDATE SKIP LOCKED so two operators never claim it.
   */
  async claimNextItem(opts: {
    workspaceSlug?: string; domain?: string; priority?: string; assigneeId: string;
  }) {
    const where: string[] = [`qi.state='pending'`, `q.status='active'`]; const vals: any[] = []; let i = 1;
    if (opts.workspaceSlug) { where.push(`w.slug=$${i++}`); vals.push(opts.workspaceSlug); }
    if (opts.domain)        { where.push(`q.domain=$${i++}`); vals.push(opts.domain); }
    if (opts.priority)      { where.push(`qi.priority=$${i++}`); vals.push(opts.priority); }
    vals.push(opts.assigneeId);
    const sql = `
      WITH picked AS (
        SELECT qi.id
          FROM ias_queue_items qi
          JOIN ias_queues q ON q.id=qi.queue_id
          LEFT JOIN ias_workspaces w ON w.id=q.workspace_id
         WHERE ${where.join(' AND ')}
         ORDER BY CASE qi.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                  qi.due_at NULLS LAST, qi.created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED
      )
      UPDATE ias_queue_items qi SET state='active', assignee_id=$${i}, updated_at=now()
        FROM picked WHERE qi.id=picked.id
      RETURNING qi.*`;
    const r = await this.ds.query(sql, vals);
    return r[0] ?? null;
  }

  async refreshQueueDepths() {
    await this.ds.query(`
      UPDATE ias_queues q SET depth=sub.cnt, updated_at=now()
        FROM (
          SELECT queue_id, COUNT(*)::int AS cnt FROM ias_queue_items
           WHERE state IN ('pending','active','escalated','blocked')
           GROUP BY queue_id
        ) sub
       WHERE q.id=sub.queue_id`);
    await this.ds.query(`
      UPDATE ias_queues q SET health =
        CASE
          WHEN depth >= 100 THEN 'blocked'
          WHEN depth >=  50 THEN 'degraded'
          WHEN depth >=  20 THEN 'caution'
          ELSE 'healthy'
        END
       WHERE TRUE`);
  }

  // ── Shortcuts ───────────────────────────────────────
  listShortcuts(role: string) {
    const order = ['operator','moderator','trust_safety','finance','super_admin'];
    const idx = order.indexOf(role);
    const allowed = idx >= 0 ? order.slice(0, idx + 1) : ['operator'];
    return this.ds.query(
      `SELECT * FROM ias_shortcuts WHERE enabled=TRUE AND required_role = ANY($1) ORDER BY scope, combo`,
      [allowed],
    );
  }
  async upsertShortcut(dto: any) {
    const r = await this.ds.query(
      `INSERT INTO ias_shortcuts (combo, label, action, payload, scope, required_role, enabled)
       VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)
       ON CONFLICT (combo, scope) DO UPDATE
         SET label=EXCLUDED.label, action=EXCLUDED.action, payload=EXCLUDED.payload,
             required_role=EXCLUDED.required_role, enabled=EXCLUDED.enabled
       RETURNING *`,
      [dto.combo, dto.label, dto.action, JSON.stringify(dto.payload ?? {}),
       dto.scope ?? 'global', dto.requiredRole ?? 'operator', dto.enabled !== false],
    );
    return r[0];
  }

  // ── Shell audit ─────────────────────────────────────
  async audit(p: {
    operatorId?: string | null; identityId?: string | null; action: string;
    workspaceSlug?: string | null; queueSlug?: string | null;
    targetType?: string | null; targetId?: string | null;
    diff?: any; ip?: string | null; userAgent?: string | null;
  }) {
    await this.ds.query(
      `INSERT INTO ias_shell_audit (operator_id, identity_id, action, workspace_slug, queue_slug, target_type, target_id, diff, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)`,
      [p.operatorId ?? null, p.identityId ?? null, p.action, p.workspaceSlug ?? null,
       p.queueSlug ?? null, p.targetType ?? null, p.targetId ?? null,
       JSON.stringify(p.diff ?? {}), p.ip ?? null, p.userAgent ?? null],
    );
  }
  recentAudit(limit = 100) {
    return this.ds.query(
      `SELECT * FROM ias_shell_audit ORDER BY created_at DESC LIMIT $1`, [limit],
    );
  }
}

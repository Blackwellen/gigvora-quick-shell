import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { KpiCreate, KpiUpdate, KpiAssign } from './dto';

@Injectable()
export class KpiRegistryRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(opts: { portal?: string; status?: string; tenantId?: string }) {
    const where: string[] = []; const args: any[] = [];
    if (opts.tenantId) { args.push(opts.tenantId); where.push(`d.tenant_id=$${args.length}`); }
    if (opts.status)   { args.push(opts.status);   where.push(`d.status=$${args.length}`); }
    let sql = `
      SELECT d.*, COALESCE(json_agg(DISTINCT jsonb_build_object(
                'portal', a.portal, 'position', a.position, 'visibility', a.visibility))
                FILTER (WHERE a.id IS NOT NULL), '[]') AS assignments
      FROM kpi_definitions d
      LEFT JOIN kpi_assignments a ON a.kpi_id=d.id`;
    if (opts.portal) { args.push(opts.portal); sql += ` AND a.portal=$${args.length}`; }
    if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
    sql += ` GROUP BY d.id ORDER BY d.updated_at DESC LIMIT 500`;
    return this.ds.query(sql, args).catch(() => []);
  }

  async byId(id: string) {
    const r = await this.ds.query(`SELECT * FROM kpi_definitions WHERE id=$1`, [id]).catch(() => []);
    return r[0] ?? null;
  }

  async create(input: KpiCreate, ownerId: string | null, tenantId: string) {
    const r = await this.ds.query(
      `INSERT INTO kpi_definitions
        (tenant_id, title, target_type, value_mode, unset_state, description,
         metric_key, source, source_query, unit, format, decimals, target_value,
         filters, schedule_cron, status, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17)
       RETURNING *`,
      [tenantId, input.title, input.target_type, input.value_mode, input.unset_state,
       input.description ?? null, input.metric_key, input.source, input.source_query ?? null,
       input.unit ?? null, input.format, input.decimals, input.target_value ?? null,
       JSON.stringify(input.filters ?? {}), input.schedule_cron ?? null, input.status, ownerId],
    );
    return r[0];
  }

  async update(id: string, patch: KpiUpdate) {
    const sets: string[] = []; const args: any[] = [id];
    for (const [k, v] of Object.entries(patch)) {
      args.push(k === 'filters' ? JSON.stringify(v ?? {}) : v);
      sets.push(`${k}=$${args.length}${k === 'filters' ? '::jsonb' : ''}`);
    }
    if (!sets.length) return this.byId(id);
    const r = await this.ds.query(
      `UPDATE kpi_definitions SET ${sets.join(', ')} WHERE id=$1 RETURNING *`, args);
    return r[0] ?? null;
  }

  async assign(id: string, a: KpiAssign, by: string | null) {
    const r = await this.ds.query(
      `INSERT INTO kpi_assignments (kpi_id, portal, position, visibility, assigned_by)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (kpi_id, portal) DO UPDATE
         SET position=EXCLUDED.position, visibility=EXCLUDED.visibility, assigned_at=now()
       RETURNING *`,
      [id, a.portal, a.position, a.visibility, by],
    );
    return r[0];
  }

  async unassign(id: string, portal: string) {
    await this.ds.query(`DELETE FROM kpi_assignments WHERE kpi_id=$1 AND portal=$2`, [id, portal])
      .catch(() => null);
    return { ok: true };
  }

  async portalCards(portal: string) {
    return this.ds.query(
      `SELECT d.id, d.title, d.target_type, d.value_mode, d.unset_state,
              d.format, d.unit, d.decimals, d.target_value, d.metric_key,
              a.position, a.visibility,
              (SELECT row_to_json(s.*) FROM (
                SELECT value, prev_value, delta_pct, bucket_at
                FROM kpi_snapshots WHERE kpi_id=d.id
                ORDER BY bucket_at DESC LIMIT 1
              ) s) AS latest
         FROM kpi_definitions d
         JOIN kpi_assignments a ON a.kpi_id=d.id
        WHERE a.portal=$1 AND d.status='live'
        ORDER BY a.position ASC, d.title ASC`,
      [portal],
    ).catch(() => []);
  }

  async writeSnapshot(kpiId: string, bucket: string, bucketAt: Date, value: number, prev?: number) {
    const delta = prev != null && prev !== 0 ? ((value - prev) / Math.abs(prev)) * 100 : null;
    await this.ds.query(
      `INSERT INTO kpi_snapshots (kpi_id, bucket, bucket_at, value, prev_value, delta_pct)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (kpi_id, bucket, bucket_at) DO UPDATE
         SET value=EXCLUDED.value, prev_value=EXCLUDED.prev_value, delta_pct=EXCLUDED.delta_pct,
             computed_at=now()`,
      [kpiId, bucket, bucketAt, value, prev ?? null, delta],
    ).catch(() => null);
  }

  async series(kpiId: string, bucket: 'hour'|'day'|'week'|'month', limit = 90) {
    return this.ds.query(
      `SELECT bucket_at, value, prev_value, delta_pct
         FROM kpi_snapshots WHERE kpi_id=$1 AND bucket=$2
         ORDER BY bucket_at DESC LIMIT $3`,
      [kpiId, bucket, limit],
    ).catch(() => []);
  }

  async audit(action: string, kpiId: string | null, actor: string | null, before: any, after: any, ip: string | null) {
    await this.ds.query(
      `INSERT INTO kpi_audit (kpi_id, actor_id, action, before_doc, after_doc, ip)
       VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6)`,
      [kpiId, actor, action, JSON.stringify(before ?? null), JSON.stringify(after ?? null), ip],
    ).catch(() => null);
  }
}

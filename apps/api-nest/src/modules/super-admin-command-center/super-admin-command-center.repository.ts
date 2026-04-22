import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SuperAdminCommandCenterRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  // ── Feature flags ────────────────────────────────────
  async listFlags(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.status) { w.push(`status=$${i++}`); v.push(filter.status); }
    if (filter.q)      { w.push(`(key ILIKE $${i} OR name ILIKE $${i})`); v.push(`%${filter.q}%`); i++; }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM sa_feature_flags ${where} ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM sa_feature_flags ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async flagById(id: string) {
    const r = await this.ds.query(`SELECT * FROM sa_feature_flags WHERE id=$1`, [id]); return r[0] ?? null;
  }
  async createFlag(p: any, createdBy: string) {
    const r = await this.ds.query(
      `INSERT INTO sa_feature_flags
        (key, name, description, enabled, rollout_pct, status, environments, segments, variants, owner_id, created_by)
       VALUES ($1,$2,$3,$4,$5,'draft',$6::jsonb,$7::jsonb,$8::jsonb,$9,$10) RETURNING *`,
      [p.key, p.name, p.description ?? '', p.enabled ?? false, p.rolloutPct ?? 0,
       JSON.stringify(p.environments ?? ['production']),
       JSON.stringify(p.segments ?? []),
       JSON.stringify(p.variants ?? []),
       p.ownerId ?? null, createdBy],
    );
    return r[0];
  }
  async updateFlag(id: string, p: any) {
    const cols: string[] = []; const vals: any[] = []; let i = 1;
    const map: Array<[string, string, (v: any) => any]> = [
      ['name','name', (v) => v], ['description','description', (v) => v],
      ['enabled','enabled', (v) => v], ['rolloutPct','rollout_pct', (v) => v],
      ['ownerId','owner_id', (v) => v],
      ['environments','environments', (v) => JSON.stringify(v)],
      ['segments','segments', (v) => JSON.stringify(v)],
      ['variants','variants', (v) => JSON.stringify(v)],
    ];
    for (const [k, c, t] of map) {
      if (p[k] !== undefined) { cols.push(`${c}=$${i++}${c.endsWith('s') && (c==='environments'||c==='segments'||c==='variants') ? '::jsonb' : ''}`); vals.push(t(p[k])); }
    }
    if (!cols.length) return this.flagById(id);
    cols.push('updated_at=now()'); vals.push(id);
    const r = await this.ds.query(`UPDATE sa_feature_flags SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }
  async setFlagStatus(id: string, status: string) {
    const r = await this.ds.query(`UPDATE sa_feature_flags SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`, [status, id]); return r[0];
  }
  async setFlagEnabled(id: string, enabled: boolean) {
    const r = await this.ds.query(`UPDATE sa_feature_flags SET enabled=$1, updated_at=now() WHERE id=$2 RETURNING *`, [enabled, id]); return r[0];
  }
  async setFlagRollout(id: string, pct: number) {
    const r = await this.ds.query(`UPDATE sa_feature_flags SET rollout_pct=$1, updated_at=now() WHERE id=$2 RETURNING *`, [pct, id]); return r[0];
  }

  // ── Overrides ────────────────────────────────────────
  async listOverrides(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    for (const [c, k] of [['scope','scope'], ['kind','kind'], ['status','status']] as const) {
      if (filter[k]) { w.push(`${c}=$${i++}`); v.push(filter[k]); }
    }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 25;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM sa_overrides ${where} ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM sa_overrides ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }
  async overrideById(id: string) {
    const r = await this.ds.query(`SELECT * FROM sa_overrides WHERE id=$1`, [id]); return r[0] ?? null;
  }
  async createOverride(p: any, createdBy: string) {
    const r = await this.ds.query(
      `INSERT INTO sa_overrides (scope, scope_id, kind, value, reason, status, created_by, expires_at)
       VALUES ($1,$2,$3,$4::jsonb,$5,'active',$6,$7) RETURNING *`,
      [p.scope, p.scopeId ?? null, p.kind, JSON.stringify(p.value ?? {}), p.reason, createdBy, p.expiresAt ?? null],
    );
    return r[0];
  }
  async updateOverride(id: string, p: any) {
    const cols: string[] = []; const vals: any[] = []; let i = 1;
    if (p.value !== undefined)    { cols.push(`value=$${i++}::jsonb`); vals.push(JSON.stringify(p.value)); }
    if (p.status !== undefined)   { cols.push(`status=$${i++}`); vals.push(p.status); }
    if (p.reason !== undefined)   { cols.push(`reason=$${i++}`); vals.push(p.reason); }
    if (p.expiresAt !== undefined){ cols.push(`expires_at=$${i++}`); vals.push(p.expiresAt); }
    if (!cols.length) return this.overrideById(id);
    cols.push('updated_at=now()'); vals.push(id);
    const r = await this.ds.query(`UPDATE sa_overrides SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }

  // ── Incidents ────────────────────────────────────────
  async listIncidents(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.status) { w.push(`status=$${i++}`); v.push(filter.status); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    return this.ds.query(`SELECT * FROM sa_incidents ${where} ORDER BY opened_at DESC LIMIT 100`, v);
  }
  async incidentById(id: string) {
    const r = await this.ds.query(`SELECT * FROM sa_incidents WHERE id=$1`, [id]); return r[0] ?? null;
  }
  async createIncident(p: any, commander: string) {
    const r = await this.ds.query(
      `INSERT INTO sa_incidents (title, severity, status, scope, commander, notes)
       VALUES ($1,$2,'open',$3,$4,$5) RETURNING *`,
      [p.title, p.severity, p.scope ?? 'platform', commander, p.notes ?? ''],
    );
    return r[0];
  }
  async transitionIncident(id: string, to: string, notes?: string) {
    const cols = [`status=$1`]; const vals: any[] = [to];
    if (to === 'mitigated') cols.push(`mitigated_at=now()`);
    if (to === 'resolved')  cols.push(`resolved_at=now()`);
    if (notes !== undefined) { cols.push(`notes=$${vals.length+1}`); vals.push(notes); }
    vals.push(id);
    const r = await this.ds.query(`UPDATE sa_incidents SET ${cols.join(',')} WHERE id=$${vals.length} RETURNING *`, vals);
    return r[0];
  }

  // ── Audit ────────────────────────────────────────────
  async logAudit(p: { actorId?: string | null; domain: string; targetId?: string | null; action: string; fromState?: string | null; toState?: string | null; diff?: any; ip?: string; userAgent?: string }) {
    await this.ds.query(
      `INSERT INTO sa_audit (actor_id, domain, target_id, action, from_state, to_state, diff, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::inet,$9)`,
      [p.actorId ?? null, p.domain, p.targetId ?? null, p.action, p.fromState ?? null, p.toState ?? null,
       JSON.stringify(p.diff ?? {}), p.ip ?? null, p.userAgent ?? null],
    );
  }
  async listAudit(filter: any) {
    const w: string[] = []; const v: any[] = []; let i = 1;
    if (filter.domain)   { w.push(`domain=$${i++}`);    v.push(filter.domain); }
    if (filter.actorId)  { w.push(`actor_id=$${i++}`);  v.push(filter.actorId); }
    if (filter.targetId) { w.push(`target_id=$${i++}`); v.push(filter.targetId); }
    const where = w.length ? `WHERE ${w.join(' AND ')}` : '';
    const limit = filter.pageSize ?? 50;
    const offset = ((filter.page ?? 1) - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM sa_audit ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, v),
      this.ds.query(`SELECT COUNT(*)::int c FROM sa_audit ${where}`, v),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }

  // ── KPIs ────────────────────────────────────────────
  async kpis() {
    const [flagsByStatus, ovByStatus, ovByKind, incByStatus, incBySev, audit24h, killSwitches] = await Promise.all([
      this.ds.query(`SELECT status, COUNT(*)::int c FROM sa_feature_flags GROUP BY status`),
      this.ds.query(`SELECT status, COUNT(*)::int c FROM sa_overrides GROUP BY status`),
      this.ds.query(`SELECT kind,   COUNT(*)::int c FROM sa_overrides WHERE status='active' GROUP BY kind`),
      this.ds.query(`SELECT status, COUNT(*)::int c FROM sa_incidents GROUP BY status`),
      this.ds.query(`SELECT severity, COUNT(*)::int c FROM sa_incidents WHERE status NOT IN ('resolved','archived') GROUP BY severity`),
      this.ds.query(`SELECT COUNT(*)::int c FROM sa_audit WHERE created_at > now()-interval '24 hours'`),
      this.ds.query(`SELECT COUNT(*)::int c FROM sa_overrides WHERE kind='kill_switch' AND status='active'`),
    ]);
    return {
      flagsByStatus:    Object.fromEntries(flagsByStatus.map((r: any) => [r.status, r.c])),
      overridesByStatus:Object.fromEntries(ovByStatus.map((r: any) => [r.status, r.c])),
      overridesByKind:  Object.fromEntries(ovByKind.map((r: any) => [r.kind, r.c])),
      incidentsByStatus:Object.fromEntries(incByStatus.map((r: any) => [r.status, r.c])),
      openIncidentsBySev:Object.fromEntries(incBySev.map((r: any) => [r.severity, r.c])),
      auditEvents24h:   audit24h[0]?.c ?? 0,
      killSwitchesActive: killSwitches[0]?.c ?? 0,
    };
  }
}

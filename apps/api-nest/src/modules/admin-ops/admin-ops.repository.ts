import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

type Entity = 'company' | 'user' | 'mentor';
const TABLE: Record<Entity, string> = {
  company: 'admin_ops_companies',
  user:    'admin_ops_users',
  mentor:  'admin_ops_mentors',
};

@Injectable()
export class AdminOpsRepository {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async list(entity: Entity, filter: { q?: string; status?: string; plan?: string; page: number; pageSize: number }) {
    const t = TABLE[entity];
    const where: string[] = []; const vals: any[] = []; let i = 1;
    if (filter.status) { where.push(`status=$${i++}`); vals.push(filter.status); }
    if (filter.plan && entity !== 'mentor') { where.push(`plan=$${i++}`); vals.push(filter.plan); }
    if (filter.q) {
      const cols = entity === 'company' ? '(reference ILIKE $X OR name ILIKE $X OR slug ILIKE $X)'
                : entity === 'user'    ? '(reference ILIKE $X OR handle ILIKE $X OR email ILIKE $X)'
                                       : '(reference ILIKE $X OR display_name ILIKE $X OR speciality ILIKE $X)';
      where.push(cols.replaceAll('$X', `$${i}`));
      vals.push(`%${filter.q}%`); i++;
    }
    const w = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = filter.pageSize; const offset = (filter.page - 1) * limit;
    const [rows, count] = await Promise.all([
      this.ds.query(`SELECT * FROM ${t} ${w} ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}`, vals),
      this.ds.query(`SELECT COUNT(*)::int c FROM ${t} ${w}`, vals),
    ]);
    return { items: rows, total: count[0]?.c ?? 0 };
  }

  byId(entity: Entity, id: string) {
    return this.ds.query(`SELECT * FROM ${TABLE[entity]} WHERE id=$1 LIMIT 1`, [id]).then((r) => r[0] ?? null);
  }

  async upsertCompany(p: any) {
    const ref = p.reference ?? `co_${Math.random().toString(36).slice(2, 8)}`;
    if (p.id) {
      const r = await this.ds.query(
        `UPDATE admin_ops_companies SET name=$1, slug=$2, verification=$3, plan=$4, headcount=$5,
          region=$6, status=$7, risk_score=$8, meta=$9::jsonb, updated_at=now() WHERE id=$10 RETURNING *`,
        [p.name, p.slug ?? null, p.verification, p.plan, p.headcount, p.region ?? null, p.status, p.riskScore, JSON.stringify(p.meta ?? {}), p.id],
      );
      return r[0];
    }
    const r = await this.ds.query(
      `INSERT INTO admin_ops_companies (reference, name, slug, verification, plan, headcount, region, status, risk_score, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb) RETURNING *`,
      [ref, p.name, p.slug ?? null, p.verification, p.plan, p.headcount, p.region ?? null, p.status, p.riskScore, JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async upsertUser(p: any) {
    const ref = p.reference ?? `u_${Math.random().toString(36).slice(2, 8)}`;
    if (p.id) {
      const r = await this.ds.query(
        `UPDATE admin_ops_users SET handle=$1, email=$2, plan=$3, region=$4, status=$5, risk_score=$6, meta=$7::jsonb, updated_at=now()
          WHERE id=$8 RETURNING *`,
        [p.handle, p.email ?? null, p.plan, p.region ?? null, p.status, p.riskScore, JSON.stringify(p.meta ?? {}), p.id],
      );
      return r[0];
    }
    const r = await this.ds.query(
      `INSERT INTO admin_ops_users (reference, handle, email, plan, region, status, risk_score, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb) RETURNING *`,
      [ref, p.handle, p.email ?? null, p.plan, p.region ?? null, p.status, p.riskScore, JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }
  async upsertMentor(p: any) {
    const ref = p.reference ?? `mn_${Math.random().toString(36).slice(2, 8)}`;
    if (p.id) {
      const r = await this.ds.query(
        `UPDATE admin_ops_mentors SET display_name=$1, speciality=$2, rating=$3, sessions=$4, status=$5, meta=$6::jsonb, updated_at=now()
          WHERE id=$7 RETURNING *`,
        [p.displayName, p.speciality, p.rating, p.sessions, p.status, JSON.stringify(p.meta ?? {}), p.id],
      );
      return r[0];
    }
    const r = await this.ds.query(
      `INSERT INTO admin_ops_mentors (reference, display_name, speciality, rating, sessions, status, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING *`,
      [ref, p.displayName, p.speciality, p.rating, p.sessions, p.status, JSON.stringify(p.meta ?? {})],
    );
    return r[0];
  }

  async setStatus(entity: Entity, id: string, status: string) {
    const r = await this.ds.query(
      `UPDATE ${TABLE[entity]} SET status=$1, updated_at=now() WHERE id=$2 RETURNING *`,
      [status, id],
    );
    return r[0] ?? null;
  }
  async setVerification(id: string, verification: string) {
    const r = await this.ds.query(
      `UPDATE admin_ops_companies SET verification=$1, updated_at=now() WHERE id=$2 RETURNING *`,
      [verification, id],
    );
    return r[0] ?? null;
  }

  audit(entity: Entity, entityId: string, actorId: string | null, action: string, before: any, after: any, ip?: string, ua?: string) {
    return this.ds.query(
      `INSERT INTO admin_ops_audit (entity, entity_id, actor_id, action, before, after, ip, user_agent)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8)`,
      [entity, entityId, actorId, action, JSON.stringify(before ?? null), JSON.stringify(after ?? null), ip ?? null, ua ?? null],
    );
  }
  auditList(entity: Entity, entityId: string) {
    return this.ds.query(
      `SELECT * FROM admin_ops_audit WHERE entity=$1 AND entity_id=$2 ORDER BY created_at DESC LIMIT 100`,
      [entity, entityId],
    );
  }
}

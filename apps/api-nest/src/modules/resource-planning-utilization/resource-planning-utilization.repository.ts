import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql, gte, lte } from 'drizzle-orm';
import {
  rpuResources, rpuProjects, rpuAssignments, rpuTimeOff, rpuAuditEvents,
} from '@gigvora/db/schema/resource-planning-utilization';

export type DrizzleDb = any;

@Injectable()
export class ResourcePlanningUtilizationRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Resources
  async listResources(orgId: string, q: any) {
    const conds = [eq(rpuResources.orgIdentityId, orgId)];
    if (q.status) conds.push(eq(rpuResources.status, q.status));
    if (q.team) conds.push(eq(rpuResources.team, q.team));
    if (q.search) conds.push(or(ilike(rpuResources.fullName, `%${q.search}%`), ilike(rpuResources.email, `%${q.search}%`))!);
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(rpuResources).where(and(...conds))
      .orderBy(desc(rpuResources.updatedAt)).limit(q.pageSize).offset(offset);
    const tr = await this.db.execute(sql`SELECT COUNT(*)::int AS c FROM rpu_resources WHERE org_identity_id = ${orgId}${q.status ? sql` AND status = ${q.status}` : sql``}`);
    return { items, page: q.page, pageSize: q.pageSize, total: Number(((tr as any).rows ?? tr)[0]?.c ?? 0) };
  }
  async getResource(orgId: string, id: string) {
    const rows = await this.db.select().from(rpuResources)
      .where(and(eq(rpuResources.id, id), eq(rpuResources.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async createResource(values: any) { const [row] = await this.db.insert(rpuResources).values(values).returning(); return row; }
  async updateResource(id: string, patch: any) {
    const [row] = await this.db.update(rpuResources).set({ ...patch, updatedAt: new Date() }).where(eq(rpuResources.id, id)).returning();
    return row;
  }

  // Projects
  async listProjects(orgId: string, q: any) {
    const conds = [eq(rpuProjects.orgIdentityId, orgId)];
    if (q.status) conds.push(eq(rpuProjects.status, q.status));
    if (q.search) conds.push(or(ilike(rpuProjects.name, `%${q.search}%`), ilike(rpuProjects.code, `%${q.search}%`))!);
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(rpuProjects).where(and(...conds))
      .orderBy(desc(rpuProjects.updatedAt)).limit(q.pageSize).offset(offset);
    const tr = await this.db.execute(sql`SELECT COUNT(*)::int AS c FROM rpu_projects WHERE org_identity_id = ${orgId}${q.status ? sql` AND status = ${q.status}` : sql``}`);
    return { items, page: q.page, pageSize: q.pageSize, total: Number(((tr as any).rows ?? tr)[0]?.c ?? 0) };
  }
  async getProject(orgId: string, id: string) {
    const rows = await this.db.select().from(rpuProjects)
      .where(and(eq(rpuProjects.id, id), eq(rpuProjects.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async getProjectByCode(orgId: string, code: string) {
    const rows = await this.db.select().from(rpuProjects)
      .where(and(eq(rpuProjects.code, code), eq(rpuProjects.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async createProject(values: any) { const [row] = await this.db.insert(rpuProjects).values(values).returning(); return row; }
  async updateProject(id: string, patch: any) {
    const [row] = await this.db.update(rpuProjects).set({ ...patch, updatedAt: new Date() }).where(eq(rpuProjects.id, id)).returning();
    return row;
  }
  async setProjectStatus(id: string, status: string) {
    const [row] = await this.db.update(rpuProjects).set({ status, updatedAt: new Date() }).where(eq(rpuProjects.id, id)).returning();
    return row;
  }

  // Assignments
  async listAssignments(orgId: string, q: any) {
    const conds = [eq(rpuAssignments.orgIdentityId, orgId)];
    if (q.status) conds.push(eq(rpuAssignments.status, q.status));
    if (q.resourceId) conds.push(eq(rpuAssignments.resourceId, q.resourceId));
    if (q.projectId) conds.push(eq(rpuAssignments.projectId, q.projectId));
    if (q.from) conds.push(gte(rpuAssignments.endDate, q.from));
    if (q.to) conds.push(lte(rpuAssignments.startDate, q.to));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(rpuAssignments).where(and(...conds))
      .orderBy(desc(rpuAssignments.updatedAt)).limit(q.pageSize).offset(offset);
    const tr = await this.db.execute(sql`SELECT COUNT(*)::int AS c FROM rpu_assignments WHERE org_identity_id = ${orgId}${q.status ? sql` AND status = ${q.status}` : sql``}`);
    return { items, page: q.page, pageSize: q.pageSize, total: Number(((tr as any).rows ?? tr)[0]?.c ?? 0) };
  }
  async getAssignment(orgId: string, id: string) {
    const rows = await this.db.select().from(rpuAssignments)
      .where(and(eq(rpuAssignments.id, id), eq(rpuAssignments.orgIdentityId, orgId))).limit(1);
    return rows[0] ?? null;
  }
  async createAssignment(values: any) { const [row] = await this.db.insert(rpuAssignments).values(values).returning(); return row; }
  async updateAssignment(id: string, patch: any) {
    const [row] = await this.db.update(rpuAssignments).set({ ...patch, updatedAt: new Date() }).where(eq(rpuAssignments.id, id)).returning();
    return row;
  }
  async setAssignmentStatus(id: string, status: string, extra: any = {}) {
    const patch: any = { status, updatedAt: new Date(), ...extra };
    if (status === 'proposed')  patch.proposedAt = new Date();
    if (status === 'confirmed') patch.confirmedAt = new Date();
    if (status === 'active')    patch.activatedAt = new Date();
    if (status === 'completed') patch.completedAt = new Date();
    if (status === 'cancelled') patch.cancelledAt = new Date();
    const [row] = await this.db.update(rpuAssignments).set(patch).where(eq(rpuAssignments.id, id)).returning();
    return row;
  }

  // Time-off
  async listTimeOff(orgId: string, resourceId?: string, from?: string, to?: string) {
    const conds = [eq(rpuTimeOff.orgIdentityId, orgId)];
    if (resourceId) conds.push(eq(rpuTimeOff.resourceId, resourceId));
    if (from) conds.push(gte(rpuTimeOff.endDate, from));
    if (to) conds.push(lte(rpuTimeOff.startDate, to));
    return this.db.select().from(rpuTimeOff).where(and(...conds)).orderBy(desc(rpuTimeOff.startDate));
  }
  async createTimeOff(values: any) { const [row] = await this.db.insert(rpuTimeOff).values(values).returning(); return row; }
  async deleteTimeOff(orgId: string, id: string) {
    await this.db.execute(sql`DELETE FROM rpu_time_off WHERE id = ${id} AND org_identity_id = ${orgId}`);
  }

  // Utilization (raw SQL for the windowed aggregate)
  async utilization(orgId: string, from: string, to: string, resourceId?: string, team?: string) {
    const res = await this.db.execute(sql`
      WITH res AS (
        SELECT id, full_name, team, weekly_capacity_hours
        FROM rpu_resources
        WHERE org_identity_id = ${orgId}
          AND status = 'active'
          ${resourceId ? sql` AND id = ${resourceId}` : sql``}
          ${team ? sql` AND team = ${team}` : sql``}
      ),
      asn AS (
        SELECT a.resource_id,
               SUM(a.hours_per_week
                   * GREATEST(0, LEAST(EXTRACT(EPOCH FROM (LEAST(a.end_date, ${to}::date) - GREATEST(a.start_date, ${from}::date) + 1)) / 86400.0, 9999) / 7.0)
               ) AS booked_hours
        FROM rpu_assignments a
        WHERE a.org_identity_id = ${orgId}
          AND a.status IN ('confirmed','active')
          AND a.start_date <= ${to}::date
          AND a.end_date   >= ${from}::date
        GROUP BY a.resource_id
      ),
      pto AS (
        SELECT t.resource_id,
               SUM(t.hours_per_day
                   * GREATEST(0, EXTRACT(EPOCH FROM (LEAST(t.end_date, ${to}::date) - GREATEST(t.start_date, ${from}::date) + 1)) / 86400.0)
               ) AS pto_hours
        FROM rpu_time_off t
        WHERE t.org_identity_id = ${orgId}
          AND t.start_date <= ${to}::date
          AND t.end_date   >= ${from}::date
        GROUP BY t.resource_id
      ),
      win AS (
        SELECT (EXTRACT(EPOCH FROM (${to}::date - ${from}::date + 1)) / 86400.0 / 7.0)::numeric AS weeks
      )
      SELECT res.id              AS resource_id,
             res.full_name,
             res.team,
             res.weekly_capacity_hours,
             ROUND((res.weekly_capacity_hours * win.weeks)::numeric, 2)              AS capacity_hours,
             COALESCE(ROUND(asn.booked_hours::numeric, 2), 0)                        AS booked_hours,
             COALESCE(ROUND(pto.pto_hours::numeric, 2), 0)                           AS pto_hours,
             ROUND(GREATEST(0,
               (res.weekly_capacity_hours * win.weeks)
               - COALESCE(asn.booked_hours, 0)
               - COALESCE(pto.pto_hours, 0)
             )::numeric, 2)                                                          AS available_hours,
             CASE WHEN res.weekly_capacity_hours = 0 THEN 0
                  ELSE ROUND((COALESCE(asn.booked_hours,0) / NULLIF(res.weekly_capacity_hours * win.weeks, 0))::numeric, 4)
             END                                                                    AS utilization_ratio
      FROM res
      CROSS JOIN win
      LEFT JOIN asn ON asn.resource_id = res.id
      LEFT JOIN pto ON pto.resource_id = res.id
      ORDER BY res.full_name
    `);
    return ((res as any).rows ?? res) as any[];
  }

  // Audit
  async recordAudit(orgId: string, actorId: string | null, action: string,
                     target: { type?: string; id?: string } = {}, diff: any = {},
                     req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(rpuAuditEvents).values({
      orgIdentityId: orgId, actorIdentityId: actorId ?? null, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(orgId: string, limit = 100) {
    return this.db.select().from(rpuAuditEvents)
      .where(eq(rpuAuditEvents.orgIdentityId, orgId))
      .orderBy(desc(rpuAuditEvents.createdAt)).limit(limit);
  }
}

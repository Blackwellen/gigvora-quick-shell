import { Injectable, Inject } from '@nestjs/common';
import { sql, and, eq, desc, gte } from 'drizzle-orm';
import {
  amdEngagements, amdDeliverables, amdUtilization, amdInvoices, amdEvents,
} from '@gigvora/db/schema/agency-management-dashboard';

export type DrizzleDb = any;

@Injectable()
export class AgencyManagementDashboardRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Engagements
  async listEngagements(agencyId: string, q: any) {
    const conds = [eq(amdEngagements.agencyIdentityId, agencyId)];
    if (q.status) conds.push(eq(amdEngagements.status, q.status));
    if (q.clientIdentityId) conds.push(eq(amdEngagements.clientIdentityId, q.clientIdentityId));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(amdEngagements)
      .where(and(...conds)).orderBy(desc(amdEngagements.updatedAt))
      .limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize };
  }

  async getEngagement(agencyId: string, id: string) {
    const rows = await this.db.select().from(amdEngagements)
      .where(and(eq(amdEngagements.id, id), eq(amdEngagements.agencyIdentityId, agencyId))).limit(1);
    return rows[0] ?? null;
  }

  async updateEngagementStatus(id: string, status: string) {
    const [row] = await this.db.update(amdEngagements)
      .set({ status, updatedAt: new Date() })
      .where(eq(amdEngagements.id, id)).returning();
    return row;
  }

  // Deliverables
  async listDeliverables(agencyId: string, q: any) {
    const conds = [eq(amdDeliverables.agencyIdentityId, agencyId)];
    if (q.status) conds.push(eq(amdDeliverables.status, q.status));
    if (q.engagementId) conds.push(eq(amdDeliverables.engagementId, q.engagementId));
    if (q.priority) conds.push(eq(amdDeliverables.priority, q.priority));
    return this.db.select().from(amdDeliverables).where(and(...conds))
      .orderBy(desc(amdDeliverables.createdAt)).limit(200);
  }

  async getDeliverable(agencyId: string, id: string) {
    const rows = await this.db.select().from(amdDeliverables)
      .where(and(eq(amdDeliverables.id, id), eq(amdDeliverables.agencyIdentityId, agencyId))).limit(1);
    return rows[0] ?? null;
  }

  async updateDeliverableStatus(id: string, status: string, extra: { blockedReason?: string | null } = {}) {
    const patch: any = { status };
    if (status === 'blocked') patch.blockedReason = extra.blockedReason ?? null;
    if (status === 'done') patch.completedAt = new Date();
    const [row] = await this.db.update(amdDeliverables).set(patch)
      .where(eq(amdDeliverables.id, id)).returning();
    return row;
  }

  // Utilization
  async utilization(agencyId: string, q: any) {
    const since = new Date(Date.now() - q.windowDays * 86400_000).toISOString().slice(0, 10);
    const conds = [eq(amdUtilization.agencyIdentityId, agencyId), gte(amdUtilization.capturedOn, since)];
    if (q.memberIdentityId) conds.push(eq(amdUtilization.memberIdentityId, q.memberIdentityId));
    return this.db.select().from(amdUtilization).where(and(...conds))
      .orderBy(desc(amdUtilization.capturedOn)).limit(500);
  }

  async utilizationSummary(agencyId: string, windowDays: number) {
    const since = new Date(Date.now() - windowDays * 86400_000).toISOString().slice(0, 10);
    const rows = await this.db.execute(sql`
      SELECT member_identity_id, member_name, role,
             AVG(utilization_rate)::float AS avg_utilization,
             SUM(billable_hours)::float AS billable,
             SUM(capacity_hours)::float AS capacity
      FROM amd_utilization
      WHERE agency_identity_id = ${agencyId} AND captured_on >= ${since}
      GROUP BY member_identity_id, member_name, role
      ORDER BY avg_utilization DESC
    `);
    return (rows as any).rows ?? rows;
  }

  // Invoices
  async listInvoices(agencyId: string, q: any) {
    const conds = [eq(amdInvoices.agencyIdentityId, agencyId)];
    if (q.status) conds.push(eq(amdInvoices.status, q.status));
    if (q.clientIdentityId) conds.push(eq(amdInvoices.clientIdentityId, q.clientIdentityId));
    return this.db.select().from(amdInvoices).where(and(...conds))
      .orderBy(desc(amdInvoices.createdAt)).limit(200);
  }

  async getInvoice(agencyId: string, id: string) {
    const rows = await this.db.select().from(amdInvoices)
      .where(and(eq(amdInvoices.id, id), eq(amdInvoices.agencyIdentityId, agencyId))).limit(1);
    return rows[0] ?? null;
  }

  async updateInvoiceStatus(id: string, status: string, paidOn?: string | null) {
    const patch: any = { status };
    if (status === 'paid') patch.paidOn = paidOn ?? new Date().toISOString().slice(0, 10);
    const [row] = await this.db.update(amdInvoices).set(patch)
      .where(eq(amdInvoices.id, id)).returning();
    return row;
  }

  async invoiceTotals(agencyId: string) {
    const rows = await this.db.execute(sql`
      SELECT status, COUNT(*)::int AS count, SUM(amount_cents)::bigint AS total_cents
      FROM amd_invoices WHERE agency_identity_id = ${agencyId}
      GROUP BY status
    `);
    return (rows as any).rows ?? rows;
  }

  // Audit
  async recordEvent(agencyId: string, actorId: string | null, action: string, target: { type?: string; id?: string } = {}, diff: any = {}) {
    await this.db.insert(amdEvents).values({
      agencyIdentityId: agencyId,
      actorIdentityId: actorId ?? null,
      action,
      targetType: target.type ?? null,
      targetId: target.id ?? null,
      diff,
    });
  }
}

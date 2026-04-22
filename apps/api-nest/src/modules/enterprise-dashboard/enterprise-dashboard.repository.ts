import { Injectable, Inject } from '@nestjs/common';
import { sql, and, eq, desc, gte } from 'drizzle-orm';
import {
  edRequisitions, edPurchaseOrders, edTeamMembers, edTeamTasks, edSpendLedger, edEvents,
} from '@gigvora/db/schema/enterprise-dashboard';

export type DrizzleDb = any;

@Injectable()
export class EnterpriseDashboardRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Requisitions
  async listRequisitions(entId: string, q: any) {
    const conds = [eq(edRequisitions.enterpriseIdentityId, entId)];
    if (q.status) conds.push(eq(edRequisitions.status, q.status));
    if (q.department) conds.push(eq(edRequisitions.department, q.department));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(edRequisitions)
      .where(and(...conds)).orderBy(desc(edRequisitions.updatedAt))
      .limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize };
  }

  async getRequisition(entId: string, id: string) {
    const rows = await this.db.select().from(edRequisitions)
      .where(and(eq(edRequisitions.id, id), eq(edRequisitions.enterpriseIdentityId, entId))).limit(1);
    return rows[0] ?? null;
  }

  async updateRequisitionStatus(id: string, status: string) {
    const [row] = await this.db.update(edRequisitions)
      .set({ status, updatedAt: new Date() })
      .where(eq(edRequisitions.id, id)).returning();
    return row;
  }

  // Purchase Orders
  async listPurchaseOrders(entId: string, q: any) {
    const conds = [eq(edPurchaseOrders.enterpriseIdentityId, entId)];
    if (q.status) conds.push(eq(edPurchaseOrders.status, q.status));
    if (q.category) conds.push(eq(edPurchaseOrders.category, q.category));
    return this.db.select().from(edPurchaseOrders).where(and(...conds))
      .orderBy(desc(edPurchaseOrders.createdAt)).limit(200);
  }

  async getPurchaseOrder(entId: string, id: string) {
    const rows = await this.db.select().from(edPurchaseOrders)
      .where(and(eq(edPurchaseOrders.id, id), eq(edPurchaseOrders.enterpriseIdentityId, entId))).limit(1);
    return rows[0] ?? null;
  }

  async updatePurchaseOrderStatus(id: string, status: string, extra: { receivedOn?: string | null } = {}) {
    const patch: any = { status };
    if (status === 'submitted') patch.submittedAt = new Date();
    if (status === 'approved' || status === 'rejected') patch.decidedAt = new Date();
    if (status === 'received') patch.receivedOn = extra.receivedOn ?? new Date().toISOString().slice(0, 10);
    const [row] = await this.db.update(edPurchaseOrders).set(patch)
      .where(eq(edPurchaseOrders.id, id)).returning();
    return row;
  }

  async poTotals(entId: string) {
    const rows = await this.db.execute(sql`
      SELECT status, COUNT(*)::int AS count, SUM(amount_cents)::bigint AS total_cents
      FROM ed_purchase_orders WHERE enterprise_identity_id = ${entId}
      GROUP BY status
    `);
    return (rows as any).rows ?? rows;
  }

  // Team
  async listTeamMembers(entId: string, q: any) {
    const conds = [eq(edTeamMembers.enterpriseIdentityId, entId)];
    if (q.status) conds.push(eq(edTeamMembers.status, q.status));
    if (q.department) conds.push(eq(edTeamMembers.department, q.department));
    return this.db.select().from(edTeamMembers).where(and(...conds)).limit(500);
  }

  async listTasks(entId: string, q: any) {
    const conds = [eq(edTeamTasks.enterpriseIdentityId, entId)];
    if (q.status) conds.push(eq(edTeamTasks.status, q.status));
    if (q.category) conds.push(eq(edTeamTasks.category, q.category));
    if (q.priority) conds.push(eq(edTeamTasks.priority, q.priority));
    return this.db.select().from(edTeamTasks).where(and(...conds))
      .orderBy(desc(edTeamTasks.createdAt)).limit(200);
  }

  async getTask(entId: string, id: string) {
    const rows = await this.db.select().from(edTeamTasks)
      .where(and(eq(edTeamTasks.id, id), eq(edTeamTasks.enterpriseIdentityId, entId))).limit(1);
    return rows[0] ?? null;
  }

  async updateTaskStatus(id: string, status: string, extra: { blockedReason?: string | null } = {}) {
    const patch: any = { status };
    if (status === 'blocked') patch.blockedReason = extra.blockedReason ?? null;
    if (status === 'done') patch.completedAt = new Date();
    const [row] = await this.db.update(edTeamTasks).set(patch)
      .where(eq(edTeamTasks.id, id)).returning();
    return row;
  }

  // Spend
  async spend(entId: string, q: any) {
    const since = new Date(Date.now() - q.windowDays * 86400_000).toISOString().slice(0, 10);
    const conds = [eq(edSpendLedger.enterpriseIdentityId, entId), gte(edSpendLedger.occurredOn, since)];
    if (q.category) conds.push(eq(edSpendLedger.category, q.category));
    return this.db.select().from(edSpendLedger).where(and(...conds))
      .orderBy(desc(edSpendLedger.occurredOn)).limit(500);
  }

  async spendByCategory(entId: string, windowDays: number) {
    const since = new Date(Date.now() - windowDays * 86400_000).toISOString().slice(0, 10);
    const rows = await this.db.execute(sql`
      SELECT category, COUNT(*)::int AS count, SUM(amount_cents)::bigint AS total_cents
      FROM ed_spend_ledger
      WHERE enterprise_identity_id = ${entId} AND occurred_on >= ${since}
      GROUP BY category ORDER BY total_cents DESC
    `);
    return (rows as any).rows ?? rows;
  }

  // Audit
  async recordEvent(entId: string, actorId: string | null, action: string, target: { type?: string; id?: string } = {}, diff: any = {}) {
    await this.db.insert(edEvents).values({
      enterpriseIdentityId: entId,
      actorIdentityId: actorId ?? null,
      action,
      targetType: target.type ?? null,
      targetId: target.id ?? null,
      diff,
    });
  }
}

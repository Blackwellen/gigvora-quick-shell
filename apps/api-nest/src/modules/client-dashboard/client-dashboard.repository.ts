import { Injectable, Inject } from '@nestjs/common';
import { sql, and, eq, desc, gte, lte } from 'drizzle-orm';
import {
  clientSpendLedger,
  clientProposals,
  clientOversightProjects,
  clientSavedItems,
  clientApprovals,
  clientDashboardEvents,
} from '@gigvora/db/schema/client-dashboard';

export type DrizzleDb = any;

@Injectable()
export class ClientDashboardRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // ---- Spend
  async listSpend(clientId: string, q: any) {
    const conds = [eq(clientSpendLedger.clientIdentityId, clientId)];
    if (q.category) conds.push(eq(clientSpendLedger.category, q.category));
    if (q.status) conds.push(eq(clientSpendLedger.status, q.status));
    if (q.fromIso) conds.push(gte(clientSpendLedger.spendAt, new Date(q.fromIso)));
    if (q.toIso) conds.push(lte(clientSpendLedger.spendAt, new Date(q.toIso)));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(clientSpendLedger)
      .where(and(...conds)).orderBy(desc(clientSpendLedger.spendAt))
      .limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize };
  }

  async spendTotals(clientId: string, windowDays: number) {
    const since = new Date(Date.now() - windowDays * 86400_000);
    const rows = await this.db.execute(sql`
      SELECT category,
             SUM(CASE WHEN status='cleared' THEN amount_cents ELSE 0 END)::int AS cleared_cents,
             SUM(CASE WHEN status='pending' THEN amount_cents ELSE 0 END)::int AS pending_cents,
             SUM(CASE WHEN status='refunded' THEN amount_cents ELSE 0 END)::int AS refunded_cents,
             COUNT(*)::int AS count
      FROM client_spend_ledger
      WHERE client_identity_id = ${clientId} AND spend_at >= ${since}
      GROUP BY category
    `);
    return (rows as any).rows ?? rows;
  }

  // ---- Proposals
  async listProposals(clientId: string, q: any) {
    const conds = [eq(clientProposals.clientIdentityId, clientId)];
    if (q.status) conds.push(eq(clientProposals.status, q.status));
    if (q.projectId) conds.push(eq(clientProposals.projectId, q.projectId));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(clientProposals)
      .where(and(...conds)).orderBy(desc(clientProposals.createdAt))
      .limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize };
  }

  async getProposal(clientId: string, id: string) {
    const rows = await this.db.select().from(clientProposals)
      .where(and(eq(clientProposals.id, id), eq(clientProposals.clientIdentityId, clientId))).limit(1);
    return rows[0] ?? null;
  }

  async updateProposalStatus(id: string, status: string, reason?: string) {
    const [row] = await this.db.update(clientProposals)
      .set({ status, decisionAt: new Date(), decisionReason: reason ?? null })
      .where(eq(clientProposals.id, id)).returning();
    return row;
  }

  async setProposalScores(items: { id: string; matchScore: number }[]) {
    for (const it of items) {
      await this.db.update(clientProposals)
        .set({ matchScore: String(it.matchScore) })
        .where(eq(clientProposals.id, it.id));
    }
  }

  // ---- Oversight projects
  async listOversight(clientId: string, q: any) {
    const conds = [eq(clientOversightProjects.clientIdentityId, clientId)];
    if (q.status) conds.push(eq(clientOversightProjects.status, q.status));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(clientOversightProjects)
      .where(and(...conds)).orderBy(desc(clientOversightProjects.lastActivityAt))
      .limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize };
  }

  async getOversight(clientId: string, id: string) {
    const rows = await this.db.select().from(clientOversightProjects)
      .where(and(eq(clientOversightProjects.id, id), eq(clientOversightProjects.clientIdentityId, clientId))).limit(1);
    return rows[0] ?? null;
  }

  async updateOversightStatus(id: string, status: string) {
    const patch: any = { status, lastActivityAt: new Date() };
    if (status === 'completed') patch.completedAt = new Date();
    const [row] = await this.db.update(clientOversightProjects)
      .set(patch).where(eq(clientOversightProjects.id, id)).returning();
    return row;
  }

  // ---- Saved items
  async listSaved(clientId: string) {
    return this.db.select().from(clientSavedItems)
      .where(eq(clientSavedItems.clientIdentityId, clientId))
      .orderBy(desc(clientSavedItems.createdAt));
  }

  async saveItem(clientId: string, dto: any) {
    const [row] = await this.db.insert(clientSavedItems).values({
      clientIdentityId: clientId, itemType: dto.itemType, itemId: dto.itemId,
      label: dto.label ?? null, notes: dto.notes ?? null,
    }).onConflictDoNothing().returning();
    return row;
  }

  async unsaveItem(clientId: string, id: string) {
    await this.db.delete(clientSavedItems)
      .where(and(eq(clientSavedItems.id, id), eq(clientSavedItems.clientIdentityId, clientId)));
    return { ok: true };
  }

  // ---- Approvals
  async listApprovals(clientId: string, status?: string) {
    const conds = [eq(clientApprovals.clientIdentityId, clientId)];
    if (status) conds.push(eq(clientApprovals.status, status));
    return this.db.select().from(clientApprovals).where(and(...conds))
      .orderBy(desc(clientApprovals.createdAt)).limit(200);
  }

  async getApproval(clientId: string, id: string) {
    const rows = await this.db.select().from(clientApprovals)
      .where(and(eq(clientApprovals.id, id), eq(clientApprovals.clientIdentityId, clientId))).limit(1);
    return rows[0] ?? null;
  }

  async decideApproval(id: string, decision: string, note?: string) {
    const [row] = await this.db.update(clientApprovals)
      .set({ status: decision, decidedAt: new Date(), decisionNote: note ?? null })
      .where(eq(clientApprovals.id, id)).returning();
    return row;
  }

  // ---- Audit
  async recordEvent(clientId: string, actorId: string | null, action: string, target: { type?: string; id?: string } = {}, diff: any = {}) {
    await this.db.insert(clientDashboardEvents).values({
      clientIdentityId: clientId,
      actorIdentityId: actorId ?? null,
      action,
      targetType: target.type ?? null,
      targetId: target.id ?? null,
      diff,
    });
  }
}

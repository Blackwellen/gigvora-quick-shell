import { Injectable, Inject } from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import {
  pefPayoutAccounts, pefPayouts, pefPayoutSchedules,
  pefEscrows, pefHolds, pefDisputes, pefLedgerEntries,
  pefReconciliationRuns, pefWebhookDeliveries, pefAuditEvents,
} from '@gigvora/db/schema/payouts-escrow-finops';

export type DrizzleDb = any;

@Injectable()
export class PayoutsEscrowFinopsRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Accounts
  listAccounts(ownerId: string) {
    return this.db.select().from(pefPayoutAccounts).where(eq(pefPayoutAccounts.ownerIdentityId, ownerId)).orderBy(desc(pefPayoutAccounts.createdAt));
  }
  async getAccount(id: string) {
    const r = await this.db.select().from(pefPayoutAccounts).where(eq(pefPayoutAccounts.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createAccount(ownerId: string, dto: any) {
    if (dto.isDefault) {
      await this.db.update(pefPayoutAccounts).set({ isDefault: false }).where(eq(pefPayoutAccounts.ownerIdentityId, ownerId));
    }
    const [row] = await this.db.insert(pefPayoutAccounts).values({ ownerIdentityId: ownerId, ...dto }).returning();
    return row;
  }
  async updateAccount(id: string, patch: any) {
    const [row] = await this.db.update(pefPayoutAccounts).set(patch).where(eq(pefPayoutAccounts.id, id)).returning();
    return row;
  }

  // Payouts
  async listPayouts(ownerId: string, q: any) {
    const conds: any[] = [eq(pefPayouts.ownerIdentityId, ownerId)];
    if (q.status) conds.push(eq(pefPayouts.status, q.status));
    if (q.from) conds.push(gte(pefPayouts.initiatedAt, new Date(q.from)));
    if (q.to) conds.push(lte(pefPayouts.initiatedAt, new Date(q.to)));
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(pefPayouts).where(and(...conds))
      .orderBy(desc(pefPayouts.initiatedAt)).limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize, total: items.length };
  }
  async getPayout(id: string) {
    const r = await this.db.select().from(pefPayouts).where(eq(pefPayouts.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createPayout(values: any) { const [row] = await this.db.insert(pefPayouts).values(values).returning(); return row; }
  async updatePayout(id: string, patch: any) {
    const [row] = await this.db.update(pefPayouts).set(patch).where(eq(pefPayouts.id, id)).returning();
    return row;
  }

  // Schedule
  async getSchedule(ownerId: string) {
    const r = await this.db.select().from(pefPayoutSchedules).where(eq(pefPayoutSchedules.ownerIdentityId, ownerId)).limit(1);
    return r[0] ?? null;
  }
  async upsertSchedule(ownerId: string, dto: any) {
    const existing = await this.getSchedule(ownerId);
    if (existing) {
      const [row] = await this.db.update(pefPayoutSchedules).set(dto).where(eq(pefPayoutSchedules.ownerIdentityId, ownerId)).returning();
      return row;
    }
    const [row] = await this.db.insert(pefPayoutSchedules).values({ ownerIdentityId: ownerId, ...dto }).returning();
    return row;
  }

  // Escrows
  async listEscrows(filter: { payeeIdentityId?: string; payerIdentityId?: string; contextType?: string; contextId?: string; status?: string }) {
    const conds: any[] = [];
    if (filter.payeeIdentityId) conds.push(eq(pefEscrows.payeeIdentityId, filter.payeeIdentityId));
    if (filter.payerIdentityId) conds.push(eq(pefEscrows.payerIdentityId, filter.payerIdentityId));
    if (filter.contextType) conds.push(eq(pefEscrows.contextType, filter.contextType));
    if (filter.contextId) conds.push(eq(pefEscrows.contextId, filter.contextId));
    if (filter.status) conds.push(eq(pefEscrows.status, filter.status));
    const q = conds.length ? this.db.select().from(pefEscrows).where(and(...conds)) : this.db.select().from(pefEscrows);
    return q.orderBy(desc(pefEscrows.heldAt));
  }
  async getEscrow(id: string) {
    const r = await this.db.select().from(pefEscrows).where(eq(pefEscrows.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createEscrow(values: any) { const [row] = await this.db.insert(pefEscrows).values(values).returning(); return row; }
  async updateEscrow(id: string, patch: any) {
    const [row] = await this.db.update(pefEscrows).set(patch).where(eq(pefEscrows.id, id)).returning();
    return row;
  }

  // Holds
  async listHolds(filter: { ownerIdentityId?: string; status?: string; subjectType?: string }) {
    const conds: any[] = [];
    if (filter.ownerIdentityId) conds.push(eq(pefHolds.ownerIdentityId, filter.ownerIdentityId));
    if (filter.status) conds.push(eq(pefHolds.status, filter.status));
    if (filter.subjectType) conds.push(eq(pefHolds.subjectType, filter.subjectType));
    const q = conds.length ? this.db.select().from(pefHolds).where(and(...conds)) : this.db.select().from(pefHolds);
    return q.orderBy(desc(pefHolds.openedAt));
  }
  async getHold(id: string) {
    const r = await this.db.select().from(pefHolds).where(eq(pefHolds.id, id)).limit(1);
    return r[0] ?? null;
  }
  async openHold(values: any) { const [row] = await this.db.insert(pefHolds).values(values).returning(); return row; }
  async updateHold(id: string, patch: any) {
    const [row] = await this.db.update(pefHolds).set(patch).where(eq(pefHolds.id, id)).returning();
    return row;
  }

  // Disputes
  listDisputes(filter: { status?: string }) {
    const q = filter.status
      ? this.db.select().from(pefDisputes).where(eq(pefDisputes.status, filter.status))
      : this.db.select().from(pefDisputes);
    return q.orderBy(desc(pefDisputes.openedAt));
  }
  async getDispute(id: string) {
    const r = await this.db.select().from(pefDisputes).where(eq(pefDisputes.id, id)).limit(1);
    return r[0] ?? null;
  }
  async openDispute(values: any) { const [row] = await this.db.insert(pefDisputes).values(values).returning(); return row; }
  async updateDispute(id: string, patch: any) {
    const [row] = await this.db.update(pefDisputes).set(patch).where(eq(pefDisputes.id, id)).returning();
    return row;
  }

  // Ledger
  async appendLedger(values: any) { await this.db.insert(pefLedgerEntries).values(values); }
  listLedger(ownerId: string, limit = 200) {
    return this.db.select().from(pefLedgerEntries).where(eq(pefLedgerEntries.ownerIdentityId, ownerId))
      .orderBy(desc(pefLedgerEntries.occurredAt)).limit(limit);
  }
  async balance(ownerId: string) {
    const r = await this.db.execute(sql`
      SELECT
        COALESCE(SUM(CASE WHEN entry_type IN ('credit','release','refund','adjustment') THEN amount_minor ELSE 0 END), 0)::bigint AS credits,
        COALESCE(SUM(CASE WHEN entry_type IN ('debit','reserve','fee','hold') THEN amount_minor ELSE 0 END), 0)::bigint AS debits,
        COALESCE(SUM(CASE WHEN entry_type IN ('reserve','hold') THEN amount_minor ELSE 0 END), 0)::bigint AS reserved,
        COALESCE(SUM(CASE WHEN entry_type = 'hold_release' THEN amount_minor ELSE 0 END), 0)::bigint AS hold_released
      FROM pef_ledger_entries WHERE owner_identity_id = ${ownerId}
    `);
    return ((r as any).rows ?? r)[0] ?? { credits: 0, debits: 0, reserved: 0, hold_released: 0 };
  }

  // Reconciliation
  async createRecon(values: any) { const [row] = await this.db.insert(pefReconciliationRuns).values(values).returning(); return row; }
  listRecon(provider?: string) {
    const q = provider
      ? this.db.select().from(pefReconciliationRuns).where(eq(pefReconciliationRuns.provider, provider))
      : this.db.select().from(pefReconciliationRuns);
    return q.orderBy(desc(pefReconciliationRuns.startedAt));
  }
  async updateRecon(id: string, patch: any) {
    const [row] = await this.db.update(pefReconciliationRuns).set(patch).where(eq(pefReconciliationRuns.id, id)).returning();
    return row;
  }

  // Webhooks
  async hasWebhook(provider: string, eventId: string) {
    const r = await this.db.select().from(pefWebhookDeliveries)
      .where(and(eq(pefWebhookDeliveries.provider, provider), eq(pefWebhookDeliveries.eventId, eventId))).limit(1);
    return !!r[0];
  }
  async recordWebhook(values: any) { await this.db.insert(pefWebhookDeliveries).values(values).onConflictDoNothing(); }

  // Audit
  async recordAudit(ownerId: string | null, actorId: string | null, actorRole: string, action: string,
                     target: { type?: string; id?: string } = {}, diff: any = {},
                     req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(pefAuditEvents).values({
      ownerIdentityId: ownerId, actorIdentityId: actorId, actorRole, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(ownerId: string, limit = 200) {
    return this.db.select().from(pefAuditEvents).where(eq(pefAuditEvents.ownerIdentityId, ownerId))
      .orderBy(desc(pefAuditEvents.createdAt)).limit(limit);
  }
  listAdminAudit(limit = 500) {
    return this.db.select().from(pefAuditEvents).orderBy(desc(pefAuditEvents.createdAt)).limit(limit);
  }
}

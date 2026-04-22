import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, ilike, or, sql, gte, lte } from 'drizzle-orm';
import {
  wcpWallets, wcpPackages, wcpPurchases, wcpPayouts,
  wcpLedgerEntries, wcpAuditEvents, wcpWebhookDeliveries,
} from '@gigvora/db/schema/wallet-credits-packages';

export type DrizzleDb = any;

@Injectable()
export class WalletCreditsPackagesRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Wallets
  async getOrCreateWallet(ownerId: string, currency = 'GBP') {
    const rows = await this.db.select().from(wcpWallets)
      .where(and(eq(wcpWallets.ownerIdentityId, ownerId), eq(wcpWallets.currency, currency))).limit(1);
    if (rows[0]) return rows[0];
    const [row] = await this.db.insert(wcpWallets).values({ ownerIdentityId: ownerId, currency }).returning();
    return row;
  }
  async getWalletById(id: string) {
    const rows = await this.db.select().from(wcpWallets).where(eq(wcpWallets.id, id)).limit(1);
    return rows[0] ?? null;
  }
  async adjustWalletBalances(walletId: string, deltas: { cashMinor?: number; credit?: number; heldMinor?: number }) {
    await this.db.execute(sql`
      UPDATE wcp_wallets SET
        cash_balance_minor = cash_balance_minor + ${deltas.cashMinor ?? 0},
        credit_balance     = credit_balance + ${deltas.credit ?? 0},
        held_balance_minor = held_balance_minor + ${deltas.heldMinor ?? 0},
        updated_at         = now()
      WHERE id = ${walletId}
    `);
  }

  // Packages
  async listPackages(ownerId: string, q: any) {
    const conds = [eq(wcpPackages.ownerIdentityId, ownerId)];
    if (q.status) conds.push(eq(wcpPackages.status, q.status));
    if (q.kind) conds.push(eq(wcpPackages.kind, q.kind));
    if (q.search) conds.push(or(ilike(wcpPackages.name, `%${q.search}%`), ilike(wcpPackages.slug, `%${q.search}%`))!);
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(wcpPackages).where(and(...conds))
      .orderBy(desc(wcpPackages.updatedAt)).limit(q.pageSize).offset(offset);
    const tr = await this.db.execute(sql`SELECT COUNT(*)::int AS c FROM wcp_packages WHERE owner_identity_id = ${ownerId}${q.status ? sql` AND status = ${q.status}` : sql``}`);
    return { items, page: q.page, pageSize: q.pageSize, total: Number(((tr as any).rows ?? tr)[0]?.c ?? 0) };
  }
  async listActivePackagesForBuyer(q: any) {
    const conds = [eq(wcpPackages.status, 'active')];
    if (q.kind) conds.push(eq(wcpPackages.kind, q.kind));
    if (q.search) conds.push(or(ilike(wcpPackages.name, `%${q.search}%`), ilike(wcpPackages.slug, `%${q.search}%`))!);
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(wcpPackages).where(and(...conds))
      .orderBy(desc(wcpPackages.updatedAt)).limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize, total: items.length };
  }
  async getPackage(id: string) {
    const rows = await this.db.select().from(wcpPackages).where(eq(wcpPackages.id, id)).limit(1);
    return rows[0] ?? null;
  }
  async getPackageBySlug(ownerId: string, slug: string) {
    const rows = await this.db.select().from(wcpPackages)
      .where(and(eq(wcpPackages.ownerIdentityId, ownerId), eq(wcpPackages.slug, slug))).limit(1);
    return rows[0] ?? null;
  }
  async createPackage(values: any) { const [row] = await this.db.insert(wcpPackages).values(values).returning(); return row; }
  async updatePackage(id: string, patch: any) {
    const [row] = await this.db.update(wcpPackages).set({ ...patch, updatedAt: new Date() }).where(eq(wcpPackages.id, id)).returning();
    return row;
  }
  async setPackageStatus(id: string, status: string) {
    const [row] = await this.db.update(wcpPackages).set({ status, updatedAt: new Date() }).where(eq(wcpPackages.id, id)).returning();
    return row;
  }

  // Purchases
  async listPurchases(buyerOrAnyId: string | null, q: any) {
    const conds: any[] = [];
    if (buyerOrAnyId) conds.push(eq(wcpPurchases.buyerIdentityId, buyerOrAnyId));
    if (q.status) conds.push(eq(wcpPurchases.status, q.status));
    if (q.packageId) conds.push(eq(wcpPurchases.packageId, q.packageId));
    if (q.from) conds.push(gte(wcpPurchases.createdAt, new Date(q.from)));
    if (q.to) conds.push(lte(wcpPurchases.createdAt, new Date(q.to)));
    const offset = (q.page - 1) * q.pageSize;
    const where = conds.length ? and(...conds) : undefined;
    const items = await this.db.select().from(wcpPurchases).where(where!)
      .orderBy(desc(wcpPurchases.createdAt)).limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize, total: items.length };
  }
  async getPurchase(id: string) {
    const rows = await this.db.select().from(wcpPurchases).where(eq(wcpPurchases.id, id)).limit(1);
    return rows[0] ?? null;
  }
  async getPurchaseByIdempotency(buyerId: string, key: string) {
    const rows = await this.db.select().from(wcpPurchases)
      .where(and(eq(wcpPurchases.buyerIdentityId, buyerId), eq(wcpPurchases.idempotencyKey, key))).limit(1);
    return rows[0] ?? null;
  }
  async getPurchaseByProviderRef(provider: string, ref: string) {
    const rows = await this.db.select().from(wcpPurchases)
      .where(and(eq(wcpPurchases.provider, provider), eq(wcpPurchases.providerRef, ref))).limit(1);
    return rows[0] ?? null;
  }
  async createPurchase(values: any) { const [row] = await this.db.insert(wcpPurchases).values(values).returning(); return row; }
  async updatePurchase(id: string, patch: any) {
    const [row] = await this.db.update(wcpPurchases).set({ ...patch, updatedAt: new Date() }).where(eq(wcpPurchases.id, id)).returning();
    return row;
  }

  // Payouts
  async listPayouts(walletId: string) {
    return this.db.select().from(wcpPayouts).where(eq(wcpPayouts.walletId, walletId)).orderBy(desc(wcpPayouts.createdAt));
  }
  async createPayout(values: any) { const [row] = await this.db.insert(wcpPayouts).values(values).returning(); return row; }

  // Ledger
  async appendLedger(entry: any) {
    const [row] = await this.db.insert(wcpLedgerEntries).values(entry).returning();
    return row;
  }
  async listLedger(walletId: string, limit = 200) {
    return this.db.select().from(wcpLedgerEntries)
      .where(eq(wcpLedgerEntries.walletId, walletId))
      .orderBy(desc(wcpLedgerEntries.createdAt)).limit(limit);
  }
  async sumLedger(walletId: string) {
    const r = await this.db.execute(sql`
      SELECT COALESCE(SUM(amount_minor),0)::int AS cash,
             COALESCE(SUM(credits),0)::int      AS credits
      FROM wcp_ledger_entries WHERE wallet_id = ${walletId}
    `);
    return ((r as any).rows ?? r)[0] ?? { cash: 0, credits: 0 };
  }

  // Audit
  async recordAudit(ownerId: string | null, actorId: string | null, action: string,
                     target: { type?: string; id?: string } = {}, diff: any = {},
                     req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(wcpAuditEvents).values({
      ownerIdentityId: ownerId, actorIdentityId: actorId, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(ownerId: string, limit = 100) {
    return this.db.select().from(wcpAuditEvents)
      .where(eq(wcpAuditEvents.ownerIdentityId, ownerId))
      .orderBy(desc(wcpAuditEvents.createdAt)).limit(limit);
  }

  // Webhook idempotency
  async hasWebhook(provider: string, eventId: string) {
    const rows = await this.db.select().from(wcpWebhookDeliveries)
      .where(and(eq(wcpWebhookDeliveries.provider, provider), eq(wcpWebhookDeliveries.eventId, eventId))).limit(1);
    return !!rows[0];
  }
  async recordWebhook(values: any) { await this.db.insert(wcpWebhookDeliveries).values(values).onConflictDoNothing(); }
}

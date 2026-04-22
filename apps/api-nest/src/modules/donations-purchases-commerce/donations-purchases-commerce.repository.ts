import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
  dpcStorefronts, dpcProducts, dpcPatronageTiers, dpcPledges,
  dpcOrders, dpcDonations, dpcLedger, dpcAuditEvents,
} from '@gigvora/db/schema/donations-purchases-commerce';

export type DrizzleDb = any;

@Injectable()
export class DonationsPurchasesCommerceRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Storefront
  async getStorefrontByOwner(ownerId: string) {
    const r = await this.db.select().from(dpcStorefronts).where(eq(dpcStorefronts.ownerIdentityId, ownerId)).limit(1);
    return r[0] ?? null;
  }
  async getStorefront(id: string) {
    const r = await this.db.select().from(dpcStorefronts).where(eq(dpcStorefronts.id, id)).limit(1);
    return r[0] ?? null;
  }
  async getStorefrontByHandle(handle: string) {
    const r = await this.db.select().from(dpcStorefronts).where(eq(dpcStorefronts.handle, handle)).limit(1);
    return r[0] ?? null;
  }
  async createStorefront(values: any) {
    const [r] = await this.db.insert(dpcStorefronts).values(values).returning(); return r;
  }
  async updateStorefront(id: string, patch: any) {
    const [r] = await this.db.update(dpcStorefronts).set({ ...patch, updatedAt: new Date() })
      .where(eq(dpcStorefronts.id, id)).returning(); return r;
  }

  // Products
  listProducts(storefrontId: string, status?: string) {
    const conds: any[] = [eq(dpcProducts.storefrontId, storefrontId)];
    if (status) conds.push(eq(dpcProducts.status, status));
    return this.db.select().from(dpcProducts).where(and(...conds)).orderBy(desc(dpcProducts.updatedAt));
  }
  async getProduct(id: string) {
    const r = await this.db.select().from(dpcProducts).where(eq(dpcProducts.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createProduct(values: any) { const [r] = await this.db.insert(dpcProducts).values(values).returning(); return r; }
  async updateProduct(id: string, patch: any) {
    const [r] = await this.db.update(dpcProducts).set({ ...patch, updatedAt: new Date() })
      .where(eq(dpcProducts.id, id)).returning(); return r;
  }
  async decrementInventory(id: string, qty: number) {
    await this.db.update(dpcProducts)
      .set({ inventoryRemaining: sql`GREATEST(0, COALESCE(${dpcProducts.inventoryRemaining}, 0) - ${qty})` })
      .where(and(eq(dpcProducts.id, id), sql`${dpcProducts.inventoryRemaining} IS NOT NULL`));
  }

  // Tiers
  listTiers(storefrontId: string, status?: string) {
    const conds: any[] = [eq(dpcPatronageTiers.storefrontId, storefrontId)];
    if (status) conds.push(eq(dpcPatronageTiers.status, status));
    return this.db.select().from(dpcPatronageTiers).where(and(...conds)).orderBy(desc(dpcPatronageTiers.updatedAt));
  }
  async getTier(id: string) {
    const r = await this.db.select().from(dpcPatronageTiers).where(eq(dpcPatronageTiers.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createTier(values: any) { const [r] = await this.db.insert(dpcPatronageTiers).values(values).returning(); return r; }
  async updateTier(id: string, patch: any) {
    const [r] = await this.db.update(dpcPatronageTiers).set({ ...patch, updatedAt: new Date() })
      .where(eq(dpcPatronageTiers.id, id)).returning(); return r;
  }

  // Pledges
  listPledgesByPatron(patronId: string, status?: string) {
    const conds: any[] = [eq(dpcPledges.patronIdentityId, patronId)];
    if (status) conds.push(eq(dpcPledges.status, status));
    return this.db.select().from(dpcPledges).where(and(...conds)).orderBy(desc(dpcPledges.startedAt));
  }
  listPledgesByCreator(creatorId: string, status?: string) {
    const conds: any[] = [eq(dpcPledges.ownerIdentityId, creatorId)];
    if (status) conds.push(eq(dpcPledges.status, status));
    return this.db.select().from(dpcPledges).where(and(...conds)).orderBy(desc(dpcPledges.startedAt));
  }
  async getPledge(id: string) {
    const r = await this.db.select().from(dpcPledges).where(eq(dpcPledges.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createPledge(values: any) { const [r] = await this.db.insert(dpcPledges).values(values).returning(); return r; }
  async updatePledge(id: string, patch: any) {
    const [r] = await this.db.update(dpcPledges).set(patch).where(eq(dpcPledges.id, id)).returning(); return r;
  }

  // Orders
  listOrdersByBuyer(buyerId: string, status?: string) {
    const conds: any[] = [eq(dpcOrders.buyerIdentityId, buyerId)];
    if (status) conds.push(eq(dpcOrders.status, status));
    return this.db.select().from(dpcOrders).where(and(...conds)).orderBy(desc(dpcOrders.createdAt));
  }
  listOrdersByCreator(creatorId: string, status?: string) {
    const conds: any[] = [eq(dpcOrders.ownerIdentityId, creatorId)];
    if (status) conds.push(eq(dpcOrders.status, status));
    return this.db.select().from(dpcOrders).where(and(...conds)).orderBy(desc(dpcOrders.createdAt));
  }
  async getOrder(id: string) {
    const r = await this.db.select().from(dpcOrders).where(eq(dpcOrders.id, id)).limit(1);
    return r[0] ?? null;
  }
  async getOrderByIdempotency(key: string) {
    const r = await this.db.select().from(dpcOrders).where(eq(dpcOrders.idempotencyKey, key)).limit(1);
    return r[0] ?? null;
  }
  async createOrder(values: any) { const [r] = await this.db.insert(dpcOrders).values(values).returning(); return r; }
  async updateOrder(id: string, patch: any) {
    const [r] = await this.db.update(dpcOrders).set({ ...patch, updatedAt: new Date() })
      .where(eq(dpcOrders.id, id)).returning(); return r;
  }

  // Donations
  listDonationsByCreator(creatorId: string, status?: string) {
    const conds: any[] = [eq(dpcDonations.ownerIdentityId, creatorId)];
    if (status) conds.push(eq(dpcDonations.status, status));
    return this.db.select().from(dpcDonations).where(and(...conds)).orderBy(desc(dpcDonations.createdAt));
  }
  listDonationsByDonor(donorId: string) {
    return this.db.select().from(dpcDonations).where(eq(dpcDonations.donorIdentityId, donorId))
      .orderBy(desc(dpcDonations.createdAt));
  }
  async getDonation(id: string) {
    const r = await this.db.select().from(dpcDonations).where(eq(dpcDonations.id, id)).limit(1);
    return r[0] ?? null;
  }
  async getDonationByIdempotency(key: string) {
    const r = await this.db.select().from(dpcDonations).where(eq(dpcDonations.idempotencyKey, key)).limit(1);
    return r[0] ?? null;
  }
  async createDonation(values: any) { const [r] = await this.db.insert(dpcDonations).values(values).returning(); return r; }
  async updateDonation(id: string, patch: any) {
    const [r] = await this.db.update(dpcDonations).set(patch).where(eq(dpcDonations.id, id)).returning(); return r;
  }

  // Ledger (append-only)
  async appendLedger(values: any) { const [r] = await this.db.insert(dpcLedger).values(values).returning(); return r; }
  listLedger(ownerId: string, limit = 200) {
    return this.db.select().from(dpcLedger).where(eq(dpcLedger.ownerIdentityId, ownerId))
      .orderBy(desc(dpcLedger.occurredAt)).limit(limit);
  }
  async sumLedger(ownerId: string) {
    const r = await this.db.select({
      entryType: dpcLedger.entryType,
      total: sql<number>`COALESCE(SUM(${dpcLedger.amountMinor}), 0)::bigint`,
    }).from(dpcLedger).where(eq(dpcLedger.ownerIdentityId, ownerId)).groupBy(dpcLedger.entryType);
    return r;
  }

  // Audit
  async recordAudit(ownerId: string | null, actorId: string | null, actorRole: string,
                    action: string, target: { type?: string; id?: string } = {}, diff: any = {},
                    req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(dpcAuditEvents).values({
      ownerIdentityId: ownerId, actorIdentityId: actorId, actorRole, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
}

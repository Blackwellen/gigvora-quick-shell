import { Injectable, Inject } from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import {
  ppmPriceBooks, ppmPriceEntries, ppmOfferPackages,
  ppmPromotions, ppmPromoRedemptions, ppmQuotes, ppmAuditEvents,
} from '@gigvora/db/schema/pricing-promotions-monetization';

export type DrizzleDb = any;

@Injectable()
export class PricingPromotionsMonetizationRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Price books
  listBooks(ownerId: string) {
    return this.db.select().from(ppmPriceBooks)
      .where(eq(ppmPriceBooks.ownerIdentityId, ownerId))
      .orderBy(desc(ppmPriceBooks.updatedAt));
  }
  async getBook(id: string) {
    const r = await this.db.select().from(ppmPriceBooks).where(eq(ppmPriceBooks.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createBook(values: any) { const [r] = await this.db.insert(ppmPriceBooks).values(values).returning(); return r; }
  async updateBook(id: string, patch: any) {
    const [r] = await this.db.update(ppmPriceBooks).set({ ...patch, updatedAt: new Date() })
      .where(eq(ppmPriceBooks.id, id)).returning(); return r;
  }
  async clearDefaultsExcept(ownerId: string, exceptId: string) {
    await this.db.update(ppmPriceBooks).set({ isDefault: false })
      .where(and(eq(ppmPriceBooks.ownerIdentityId, ownerId), sql`${ppmPriceBooks.id} <> ${exceptId}`));
  }

  // Entries
  listEntries(bookId: string) {
    return this.db.select().from(ppmPriceEntries)
      .where(eq(ppmPriceEntries.priceBookId, bookId))
      .orderBy(asc(ppmPriceEntries.sku), asc(ppmPriceEntries.tier), desc(ppmPriceEntries.validFrom));
  }
  async getEntry(id: string) {
    const r = await this.db.select().from(ppmPriceEntries).where(eq(ppmPriceEntries.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createEntry(values: any) { const [r] = await this.db.insert(ppmPriceEntries).values(values).returning(); return r; }
  async deleteEntry(id: string) { await this.db.delete(ppmPriceEntries).where(eq(ppmPriceEntries.id, id)); }
  async findActivePrice(bookId: string, sku: string, tier: string, atDate = new Date()) {
    const r = await this.db.select().from(ppmPriceEntries).where(and(
      eq(ppmPriceEntries.priceBookId, bookId),
      eq(ppmPriceEntries.sku, sku),
      eq(ppmPriceEntries.tier, tier),
      sql`${ppmPriceEntries.validFrom} <= ${atDate}`,
      sql`(${ppmPriceEntries.validUntil} IS NULL OR ${ppmPriceEntries.validUntil} > ${atDate})`,
    )).orderBy(desc(ppmPriceEntries.validFrom)).limit(1);
    return r[0] ?? null;
  }

  // Packages
  listPackages(ownerId: string, status?: string) {
    const conds: any[] = [eq(ppmOfferPackages.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(ppmOfferPackages.status, status));
    return this.db.select().from(ppmOfferPackages).where(and(...conds))
      .orderBy(asc(ppmOfferPackages.position), asc(ppmOfferPackages.priceMinor));
  }
  async getPackage(id: string) {
    const r = await this.db.select().from(ppmOfferPackages).where(eq(ppmOfferPackages.id, id)).limit(1);
    return r[0] ?? null;
  }
  async getPackageBySlug(ownerId: string, slug: string) {
    const r = await this.db.select().from(ppmOfferPackages).where(and(
      eq(ppmOfferPackages.ownerIdentityId, ownerId), eq(ppmOfferPackages.slug, slug),
    )).limit(1);
    return r[0] ?? null;
  }
  async createPackage(values: any) { const [r] = await this.db.insert(ppmOfferPackages).values(values).returning(); return r; }
  async updatePackage(id: string, patch: any) {
    const [r] = await this.db.update(ppmOfferPackages).set({ ...patch, updatedAt: new Date() })
      .where(eq(ppmOfferPackages.id, id)).returning(); return r;
  }

  // Promotions
  listPromos(ownerId: string, status?: string) {
    const conds: any[] = [eq(ppmPromotions.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(ppmPromotions.status, status));
    return this.db.select().from(ppmPromotions).where(and(...conds))
      .orderBy(desc(ppmPromotions.updatedAt));
  }
  async getPromo(id: string) {
    const r = await this.db.select().from(ppmPromotions).where(eq(ppmPromotions.id, id)).limit(1);
    return r[0] ?? null;
  }
  async getPromoByCode(ownerId: string, code: string) {
    const r = await this.db.select().from(ppmPromotions).where(and(
      eq(ppmPromotions.ownerIdentityId, ownerId), eq(ppmPromotions.code, code),
    )).limit(1);
    return r[0] ?? null;
  }
  async createPromo(values: any) { const [r] = await this.db.insert(ppmPromotions).values(values).returning(); return r; }
  async updatePromo(id: string, patch: any) {
    const [r] = await this.db.update(ppmPromotions).set({ ...patch, updatedAt: new Date() })
      .where(eq(ppmPromotions.id, id)).returning(); return r;
  }
  async incrementRedeemed(id: string) {
    await this.db.update(ppmPromotions)
      .set({ redeemedCount: sql`${ppmPromotions.redeemedCount} + 1` })
      .where(eq(ppmPromotions.id, id));
  }

  // Redemptions
  async appendRedemption(values: any) {
    const [r] = await this.db.insert(ppmPromoRedemptions).values(values).returning(); return r;
  }
  async countRedemptionsByUser(promoId: string, userId: string): Promise<number> {
    const r = await this.db.select({ c: sql<number>`COUNT(*)::int` })
      .from(ppmPromoRedemptions).where(and(
        eq(ppmPromoRedemptions.promotionId, promoId),
        eq(ppmPromoRedemptions.redeemedByIdentityId, userId),
      ));
    return r[0]?.c ?? 0;
  }
  listRedemptions(promoId: string, limit = 200) {
    return this.db.select().from(ppmPromoRedemptions)
      .where(eq(ppmPromoRedemptions.promotionId, promoId))
      .orderBy(desc(ppmPromoRedemptions.redeemedAt)).limit(limit);
  }

  // Quotes
  listQuotesByOwner(ownerId: string, status?: string) {
    const conds: any[] = [eq(ppmQuotes.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(ppmQuotes.status, status));
    return this.db.select().from(ppmQuotes).where(and(...conds))
      .orderBy(desc(ppmQuotes.createdAt));
  }
  listQuotesByCustomer(customerId: string, status?: string) {
    const conds: any[] = [eq(ppmQuotes.customerIdentityId, customerId)];
    if (status) conds.push(eq(ppmQuotes.status, status));
    return this.db.select().from(ppmQuotes).where(and(...conds))
      .orderBy(desc(ppmQuotes.createdAt));
  }
  async getQuote(id: string) {
    const r = await this.db.select().from(ppmQuotes).where(eq(ppmQuotes.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createQuote(values: any) { const [r] = await this.db.insert(ppmQuotes).values(values).returning(); return r; }
  async updateQuote(id: string, patch: any) {
    const [r] = await this.db.update(ppmQuotes).set({ ...patch, updatedAt: new Date() })
      .where(eq(ppmQuotes.id, id)).returning(); return r;
  }

  // Audit
  async recordAudit(ownerId: string | null, actorId: string | null, actorRole: string,
                    action: string, target: { type?: string; id?: string } = {}, diff: any = {},
                    req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(ppmAuditEvents).values({
      ownerIdentityId: ownerId, actorIdentityId: actorId, actorRole, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
}

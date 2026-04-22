import { Injectable, Inject } from '@nestjs/common';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import {
  ambCampaigns, ambAdGroups, ambCreatives, ambAdGroupCreatives,
  ambRoutingRules, ambMetricSnapshots, ambModerationReviews, ambSearchIndex,
  ambWebhookDeliveries, ambAuditEvents,
} from '@gigvora/db/schema/ads-manager-builder';

export type DrizzleDb = any;

@Injectable()
export class AdsManagerBuilderRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // ─── Campaigns ───────────────────────────────────────
  async listCampaigns(ownerId: string, q: any) {
    const conds: any[] = [eq(ambCampaigns.ownerIdentityId, ownerId)];
    if (q.status) conds.push(eq(ambCampaigns.status, q.status));
    if (q.objective) conds.push(eq(ambCampaigns.objective, q.objective));
    const sortCol = ({
      createdAt: ambCampaigns.createdAt,
      spentMinor: ambCampaigns.spentMinor,
      budgetMinor: ambCampaigns.budgetMinor,
      name: ambCampaigns.name,
    } as any)[q.sort] ?? ambCampaigns.createdAt;
    const order = q.dir === 'asc' ? asc(sortCol) : desc(sortCol);
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(ambCampaigns).where(and(...conds))
      .orderBy(order).limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize, total: items.length };
  }
  async getCampaign(id: string) {
    const r = await this.db.select().from(ambCampaigns).where(eq(ambCampaigns.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createCampaign(values: any) { const [row] = await this.db.insert(ambCampaigns).values(values).returning(); return row; }
  async updateCampaign(id: string, patch: any) {
    const [row] = await this.db.update(ambCampaigns).set({ ...patch, updatedAt: new Date() }).where(eq(ambCampaigns.id, id)).returning();
    return row;
  }

  // ─── Ad groups ───────────────────────────────────────
  listAdGroups(campaignId: string) {
    return this.db.select().from(ambAdGroups).where(eq(ambAdGroups.campaignId, campaignId)).orderBy(desc(ambAdGroups.createdAt));
  }
  async getAdGroup(id: string) {
    const r = await this.db.select().from(ambAdGroups).where(eq(ambAdGroups.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createAdGroup(values: any) { const [row] = await this.db.insert(ambAdGroups).values(values).returning(); return row; }
  async updateAdGroup(id: string, patch: any) {
    const [row] = await this.db.update(ambAdGroups).set(patch).where(eq(ambAdGroups.id, id)).returning();
    return row;
  }

  // ─── Creatives ───────────────────────────────────────
  async listCreatives(ownerId: string, opts: { format?: string; status?: string; q?: string } = {}) {
    const conds: any[] = [eq(ambCreatives.ownerIdentityId, ownerId)];
    if (opts.format) conds.push(eq(ambCreatives.format, opts.format));
    if (opts.status) conds.push(eq(ambCreatives.status, opts.status));
    if (opts.q) conds.push(or(ilike(ambCreatives.name, `%${opts.q}%`), ilike(ambCreatives.headline, `%${opts.q}%`)));
    return this.db.select().from(ambCreatives).where(and(...conds)).orderBy(desc(ambCreatives.createdAt));
  }
  async getCreative(id: string) {
    const r = await this.db.select().from(ambCreatives).where(eq(ambCreatives.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createCreative(values: any) { const [row] = await this.db.insert(ambCreatives).values(values).returning(); return row; }
  async updateCreative(id: string, patch: any) {
    const [row] = await this.db.update(ambCreatives).set({ ...patch, updatedAt: new Date() }).where(eq(ambCreatives.id, id)).returning();
    return row;
  }

  // ─── Ad group ↔ creative ────────────────────────────
  listAdGroupCreatives(adGroupId: string) {
    return this.db.select().from(ambAdGroupCreatives).where(eq(ambAdGroupCreatives.adGroupId, adGroupId));
  }
  async attachCreative(adGroupId: string, creativeId: string, weight: number) {
    const [row] = await this.db.insert(ambAdGroupCreatives).values({ adGroupId, creativeId, weight, status: 'active' })
      .onConflictDoUpdate({ target: [ambAdGroupCreatives.adGroupId, ambAdGroupCreatives.creativeId], set: { weight, status: 'active' } })
      .returning();
    return row;
  }
  async detachCreative(adGroupId: string, creativeId: string) {
    await this.db.delete(ambAdGroupCreatives)
      .where(and(eq(ambAdGroupCreatives.adGroupId, adGroupId), eq(ambAdGroupCreatives.creativeId, creativeId)));
  }

  // ─── Routing rules ──────────────────────────────────
  listRoutingRules(campaignId: string) {
    return this.db.select().from(ambRoutingRules).where(eq(ambRoutingRules.campaignId, campaignId)).orderBy(asc(ambRoutingRules.priority));
  }
  async createRoutingRule(values: any) { const [row] = await this.db.insert(ambRoutingRules).values(values).returning(); return row; }
  async deleteRoutingRule(id: string) { await this.db.delete(ambRoutingRules).where(eq(ambRoutingRules.id, id)); }

  // ─── Metrics ─────────────────────────────────────────
  async metricsForCampaign(campaignId: string, fromDate?: string, toDate?: string) {
    const conds: any[] = [eq(ambMetricSnapshots.campaignId, campaignId)];
    if (fromDate) conds.push(sql`${ambMetricSnapshots.date} >= ${fromDate}`);
    if (toDate) conds.push(sql`${ambMetricSnapshots.date} <= ${toDate}`);
    return this.db.select().from(ambMetricSnapshots).where(and(...conds)).orderBy(asc(ambMetricSnapshots.date));
  }
  async appendMetric(values: any) {
    await this.db.insert(ambMetricSnapshots).values(values).onConflictDoNothing();
  }
  async campaignTotals(campaignId: string) {
    const r = await this.db.execute(sql`
      SELECT COALESCE(SUM(impressions),0)::bigint AS impressions,
             COALESCE(SUM(clicks),0)::bigint AS clicks,
             COALESCE(SUM(conversions),0)::bigint AS conversions,
             COALESCE(SUM(spend_minor),0)::bigint AS spend_minor
        FROM amb_metric_snapshots WHERE campaign_id = ${campaignId}
    `);
    return ((r as any).rows ?? r)[0] ?? { impressions: 0, clicks: 0, conversions: 0, spend_minor: 0 };
  }

  // ─── Moderation ─────────────────────────────────────
  async appendModeration(values: any) { const [row] = await this.db.insert(ambModerationReviews).values(values).returning(); return row; }
  listModeration(subjectType: string, subjectId: string) {
    return this.db.select().from(ambModerationReviews)
      .where(and(eq(ambModerationReviews.subjectType, subjectType), eq(ambModerationReviews.subjectId, subjectId)))
      .orderBy(desc(ambModerationReviews.reviewedAt));
  }

  // ─── Search index ───────────────────────────────────
  async upsertSearch(values: any) {
    await this.db.insert(ambSearchIndex).values(values)
      .onConflictDoUpdate({ target: [ambSearchIndex.subjectType, ambSearchIndex.subjectId],
        set: { searchText: values.searchText, facets: values.facets, rankingScore: values.rankingScore, indexedAt: new Date() } });
  }
  async search(ownerId: string, q: any) {
    const conds: any[] = [eq(ambSearchIndex.ownerIdentityId, ownerId)];
    if (q.subjectType) conds.push(eq(ambSearchIndex.subjectType, q.subjectType));
    if (q.q) conds.push(sql`to_tsvector('english', ${ambSearchIndex.searchText}) @@ plainto_tsquery('english', ${q.q})`);
    const offset = (q.page - 1) * q.pageSize;
    const items = await this.db.select().from(ambSearchIndex).where(and(...conds))
      .orderBy(desc(ambSearchIndex.rankingScore), desc(ambSearchIndex.indexedAt))
      .limit(q.pageSize).offset(offset);
    return { items, page: q.page, pageSize: q.pageSize, total: items.length };
  }

  // ─── Webhooks ────────────────────────────────────────
  async hasWebhook(provider: string, eventId: string) {
    const r = await this.db.select().from(ambWebhookDeliveries)
      .where(and(eq(ambWebhookDeliveries.provider, provider), eq(ambWebhookDeliveries.eventId, eventId))).limit(1);
    return !!r[0];
  }
  async recordWebhook(values: any) { await this.db.insert(ambWebhookDeliveries).values(values).onConflictDoNothing(); }

  // ─── Audit ───────────────────────────────────────────
  async recordAudit(ownerId: string | null, actorId: string | null, actorRole: string, action: string,
                    target: { type?: string; id?: string } = {}, diff: any = {},
                    req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(ambAuditEvents).values({
      ownerIdentityId: ownerId, actorIdentityId: actorId, actorRole, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(ownerId: string, limit = 200) {
    return this.db.select().from(ambAuditEvents).where(eq(ambAuditEvents.ownerIdentityId, ownerId))
      .orderBy(desc(ambAuditEvents.createdAt)).limit(limit);
  }
}

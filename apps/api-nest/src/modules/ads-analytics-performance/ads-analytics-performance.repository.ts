import { Injectable, Inject } from '@nestjs/common';
import { and, asc, desc, eq, sql, inArray, gte, lte } from 'drizzle-orm';
import {
  aapDailyFacts, aapCreativeScores, aapSavedReports, aapAlerts, aapAlertEvents,
  aapExportJobs, aapAnomalies, aapAuditEvents,
} from '@gigvora/db/schema/ads-analytics-performance';

export type DrizzleDb = any;

const GROUP_COL: Record<string, any> = {
  date: aapDailyFacts.date,
  campaign: aapDailyFacts.campaignId,
  ad_group: aapDailyFacts.adGroupId,
  creative: aapDailyFacts.creativeId,
  country: aapDailyFacts.country,
  device: aapDailyFacts.device,
  placement: aapDailyFacts.placement,
};

@Injectable()
export class AdsAnalyticsPerformanceRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // ─── Facts (aggregated query) ───────────────────────
  async query(ownerId: string, q: any) {
    const f = q.filters;
    const conds: any[] = [
      eq(aapDailyFacts.ownerIdentityId, ownerId),
      gte(aapDailyFacts.date, f.dateFrom),
      lte(aapDailyFacts.date, f.dateTo),
    ];
    if (f.campaignIds?.length) conds.push(inArray(aapDailyFacts.campaignId, f.campaignIds));
    if (f.creativeIds?.length) conds.push(inArray(aapDailyFacts.creativeId, f.creativeIds));
    if (f.country?.length) conds.push(inArray(aapDailyFacts.country, f.country));
    if (f.device?.length) conds.push(inArray(aapDailyFacts.device, f.device));
    if (f.placement?.length) conds.push(inArray(aapDailyFacts.placement, f.placement));

    const groupCols = (q.groupBy as string[]).map((g) => GROUP_COL[g]).filter(Boolean);
    const select: Record<string, any> = {
      impressions: sql<number>`COALESCE(SUM(${aapDailyFacts.impressions}),0)::bigint`,
      clicks: sql<number>`COALESCE(SUM(${aapDailyFacts.clicks}),0)::bigint`,
      installs: sql<number>`COALESCE(SUM(${aapDailyFacts.installs}),0)::bigint`,
      conversions: sql<number>`COALESCE(SUM(${aapDailyFacts.conversions}),0)::bigint`,
      spend_minor: sql<number>`COALESCE(SUM(${aapDailyFacts.spendMinor}),0)::bigint`,
      revenue_minor: sql<number>`COALESCE(SUM(${aapDailyFacts.revenueMinor}),0)::bigint`,
    };
    (q.groupBy as string[]).forEach((g, i) => { select[g] = groupCols[i]; });

    let qb = this.db.select(select).from(aapDailyFacts).where(and(...conds));
    if (groupCols.length) qb = qb.groupBy(...groupCols).orderBy(...groupCols.map((c: any) => asc(c)));
    const offset = (q.page - 1) * q.pageSize;
    const rows = await qb.limit(q.pageSize).offset(offset);
    return { rows, page: q.page, pageSize: q.pageSize };
  }

  async appendFact(values: any) { await this.db.insert(aapDailyFacts).values(values).onConflictDoNothing(); }

  async ownerTotalsByDate(ownerId: string, fromDate: string, toDate: string) {
    return this.db.select({
      date: aapDailyFacts.date,
      impressions: sql<number>`COALESCE(SUM(${aapDailyFacts.impressions}),0)::bigint`,
      clicks: sql<number>`COALESCE(SUM(${aapDailyFacts.clicks}),0)::bigint`,
      installs: sql<number>`COALESCE(SUM(${aapDailyFacts.installs}),0)::bigint`,
      conversions: sql<number>`COALESCE(SUM(${aapDailyFacts.conversions}),0)::bigint`,
      spend_minor: sql<number>`COALESCE(SUM(${aapDailyFacts.spendMinor}),0)::bigint`,
      revenue_minor: sql<number>`COALESCE(SUM(${aapDailyFacts.revenueMinor}),0)::bigint`,
    }).from(aapDailyFacts)
      .where(and(eq(aapDailyFacts.ownerIdentityId, ownerId), gte(aapDailyFacts.date, fromDate), lte(aapDailyFacts.date, toDate)))
      .groupBy(aapDailyFacts.date).orderBy(asc(aapDailyFacts.date));
  }

  // ─── Creative scores ────────────────────────────────
  listCreativeScores(ownerId: string, opts: { windowDays: number; band?: string }) {
    const conds: any[] = [eq(aapCreativeScores.ownerIdentityId, ownerId), eq(aapCreativeScores.windowDays, opts.windowDays)];
    if (opts.band) conds.push(eq(aapCreativeScores.band, opts.band));
    return this.db.select().from(aapCreativeScores).where(and(...conds))
      .orderBy(desc(aapCreativeScores.performanceScore));
  }
  async upsertCreativeScore(values: any) {
    await this.db.insert(aapCreativeScores).values(values)
      .onConflictDoUpdate({ target: [aapCreativeScores.creativeId, aapCreativeScores.windowDays],
        set: { ...values, computedAt: new Date() } });
  }
  rawCreativeWindow(ownerId: string, creativeId: string, days: number) {
    return this.db.select({
      impressions: sql<number>`COALESCE(SUM(${aapDailyFacts.impressions}),0)::bigint`,
      clicks: sql<number>`COALESCE(SUM(${aapDailyFacts.clicks}),0)::bigint`,
      installs: sql<number>`COALESCE(SUM(${aapDailyFacts.installs}),0)::bigint`,
      conversions: sql<number>`COALESCE(SUM(${aapDailyFacts.conversions}),0)::bigint`,
      spend_minor: sql<number>`COALESCE(SUM(${aapDailyFacts.spendMinor}),0)::bigint`,
      revenue_minor: sql<number>`COALESCE(SUM(${aapDailyFacts.revenueMinor}),0)::bigint`,
    }).from(aapDailyFacts).where(and(
      eq(aapDailyFacts.ownerIdentityId, ownerId),
      eq(aapDailyFacts.creativeId, creativeId),
      gte(aapDailyFacts.date, sql`(CURRENT_DATE - (${days} || ' days')::interval)`),
    ));
  }

  // ─── Saved reports ──────────────────────────────────
  listSavedReports(ownerId: string, status?: string) {
    const conds: any[] = [eq(aapSavedReports.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(aapSavedReports.status, status));
    return this.db.select().from(aapSavedReports).where(and(...conds)).orderBy(desc(aapSavedReports.updatedAt));
  }
  async getSavedReport(id: string) {
    const r = await this.db.select().from(aapSavedReports).where(eq(aapSavedReports.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createSavedReport(values: any) { const [r] = await this.db.insert(aapSavedReports).values(values).returning(); return r; }
  async updateSavedReport(id: string, patch: any) {
    const [r] = await this.db.update(aapSavedReports).set({ ...patch, updatedAt: new Date() })
      .where(eq(aapSavedReports.id, id)).returning();
    return r;
  }

  // ─── Alerts ─────────────────────────────────────────
  listAlerts(ownerId: string, status?: string) {
    const conds: any[] = [eq(aapAlerts.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(aapAlerts.status, status));
    return this.db.select().from(aapAlerts).where(and(...conds)).orderBy(desc(aapAlerts.createdAt));
  }
  async getAlert(id: string) {
    const r = await this.db.select().from(aapAlerts).where(eq(aapAlerts.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createAlert(values: any) { const [r] = await this.db.insert(aapAlerts).values(values).returning(); return r; }
  async updateAlert(id: string, patch: any) {
    const [r] = await this.db.update(aapAlerts).set(patch).where(eq(aapAlerts.id, id)).returning();
    return r;
  }
  async appendAlertEvent(values: any) { const [r] = await this.db.insert(aapAlertEvents).values(values).returning(); return r; }
  listAlertEvents(alertId: string, limit = 100) {
    return this.db.select().from(aapAlertEvents).where(eq(aapAlertEvents.alertId, alertId))
      .orderBy(desc(aapAlertEvents.triggeredAt)).limit(limit);
  }

  // ─── Export jobs ────────────────────────────────────
  listExports(ownerId: string, status?: string) {
    const conds: any[] = [eq(aapExportJobs.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(aapExportJobs.status, status));
    return this.db.select().from(aapExportJobs).where(and(...conds))
      .orderBy(desc(aapExportJobs.createdAt)).limit(200);
  }
  async getExport(id: string) {
    const r = await this.db.select().from(aapExportJobs).where(eq(aapExportJobs.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createExport(values: any) { const [r] = await this.db.insert(aapExportJobs).values(values).returning(); return r; }
  async updateExport(id: string, patch: any) {
    const [r] = await this.db.update(aapExportJobs).set(patch).where(eq(aapExportJobs.id, id)).returning();
    return r;
  }

  // ─── Anomalies ──────────────────────────────────────
  listAnomalies(ownerId: string, status?: string) {
    const conds: any[] = [eq(aapAnomalies.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(aapAnomalies.status, status));
    return this.db.select().from(aapAnomalies).where(and(...conds))
      .orderBy(desc(aapAnomalies.detectedAt)).limit(200);
  }
  async getAnomaly(id: string) {
    const r = await this.db.select().from(aapAnomalies).where(eq(aapAnomalies.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createAnomaly(values: any) { const [r] = await this.db.insert(aapAnomalies).values(values).returning(); return r; }
  async updateAnomaly(id: string, patch: any) {
    const [r] = await this.db.update(aapAnomalies).set(patch).where(eq(aapAnomalies.id, id)).returning();
    return r;
  }

  // ─── Audit ──────────────────────────────────────────
  async recordAudit(ownerId: string | null, actorId: string | null, actorRole: string, action: string,
                    target: { type?: string; id?: string } = {}, diff: any = {},
                    req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(aapAuditEvents).values({
      ownerIdentityId: ownerId, actorIdentityId: actorId, actorRole, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(ownerId: string, limit = 200) {
    return this.db.select().from(aapAuditEvents).where(eq(aapAuditEvents.ownerIdentityId, ownerId))
      .orderBy(desc(aapAuditEvents.createdAt)).limit(limit);
  }
}

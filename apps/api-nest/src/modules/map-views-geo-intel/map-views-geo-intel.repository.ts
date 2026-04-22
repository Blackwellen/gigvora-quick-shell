import { Injectable, Inject } from '@nestjs/common';
import { and, desc, eq, sql, gte, lte } from 'drizzle-orm';
import {
  mvgPlaces, mvgGeofences, mvgAudiences, mvgPlaceMedia,
  mvgLocationSignals, mvgHeatmapCells, mvgAuditEvents,
} from '@gigvora/db/schema/map-views-geo-intel';

export type DrizzleDb = any;

@Injectable()
export class MapViewsGeoIntelRepository {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  // Places
  listPlaces(ownerId: string, status?: string) {
    const conds: any[] = [eq(mvgPlaces.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(mvgPlaces.status, status));
    return this.db.select().from(mvgPlaces).where(and(...conds)).orderBy(desc(mvgPlaces.updatedAt));
  }
  async getPlace(id: string) {
    const r = await this.db.select().from(mvgPlaces).where(eq(mvgPlaces.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createPlace(values: any) { const [r] = await this.db.insert(mvgPlaces).values(values).returning(); return r; }
  async updatePlace(id: string, patch: any) {
    const [r] = await this.db.update(mvgPlaces).set({ ...patch, updatedAt: new Date() })
      .where(eq(mvgPlaces.id, id)).returning();
    return r;
  }

  // Geofences
  listGeofences(ownerId: string, status?: string) {
    const conds: any[] = [eq(mvgGeofences.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(mvgGeofences.status, status));
    return this.db.select().from(mvgGeofences).where(and(...conds)).orderBy(desc(mvgGeofences.updatedAt));
  }
  async getGeofence(id: string) {
    const r = await this.db.select().from(mvgGeofences).where(eq(mvgGeofences.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createGeofence(values: any) { const [r] = await this.db.insert(mvgGeofences).values(values).returning(); return r; }
  async updateGeofence(id: string, patch: any) {
    const [r] = await this.db.update(mvgGeofences).set({ ...patch, updatedAt: new Date() })
      .where(eq(mvgGeofences.id, id)).returning();
    return r;
  }

  // Audiences
  listAudiences(ownerId: string, status?: string) {
    const conds: any[] = [eq(mvgAudiences.ownerIdentityId, ownerId)];
    if (status) conds.push(eq(mvgAudiences.status, status));
    return this.db.select().from(mvgAudiences).where(and(...conds)).orderBy(desc(mvgAudiences.updatedAt));
  }
  async getAudience(id: string) {
    const r = await this.db.select().from(mvgAudiences).where(eq(mvgAudiences.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createAudience(values: any) { const [r] = await this.db.insert(mvgAudiences).values(values).returning(); return r; }
  async updateAudience(id: string, patch: any) {
    const [r] = await this.db.update(mvgAudiences).set({ ...patch, updatedAt: new Date() })
      .where(eq(mvgAudiences.id, id)).returning();
    return r;
  }

  // Media
  listPlaceMedia(placeId: string) {
    return this.db.select().from(mvgPlaceMedia).where(eq(mvgPlaceMedia.placeId, placeId))
      .orderBy(desc(mvgPlaceMedia.createdAt));
  }
  async getMedia(id: string) {
    const r = await this.db.select().from(mvgPlaceMedia).where(eq(mvgPlaceMedia.id, id)).limit(1);
    return r[0] ?? null;
  }
  async createMedia(values: any) { const [r] = await this.db.insert(mvgPlaceMedia).values(values).returning(); return r; }
  async updateMedia(id: string, patch: any) {
    const [r] = await this.db.update(mvgPlaceMedia).set(patch).where(eq(mvgPlaceMedia.id, id)).returning();
    return r;
  }

  // Signals
  async appendSignal(values: any) { const [r] = await this.db.insert(mvgLocationSignals).values(values).returning(); return r; }
  signalsForOwner(ownerId: string, fromIso: string, toIso: string, limit = 5000) {
    return this.db.select().from(mvgLocationSignals).where(and(
      eq(mvgLocationSignals.ownerIdentityId, ownerId),
      gte(mvgLocationSignals.occurredAt, new Date(fromIso)),
      lte(mvgLocationSignals.occurredAt, new Date(toIso)),
    )).orderBy(desc(mvgLocationSignals.occurredAt)).limit(limit);
  }
  countSignalsByPlace(ownerId: string) {
    return this.db.select({
      placeId: mvgLocationSignals.placeId,
      total: sql<number>`COUNT(*)::bigint`,
      conversions: sql<number>`SUM(CASE WHEN ${mvgLocationSignals.eventType} = 'conversion' THEN 1 ELSE 0 END)::bigint`,
    }).from(mvgLocationSignals).where(eq(mvgLocationSignals.ownerIdentityId, ownerId)).groupBy(mvgLocationSignals.placeId);
  }

  // Heatmap cells
  listHeatmap(ownerId: string, resolution: number) {
    return this.db.select().from(mvgHeatmapCells)
      .where(and(eq(mvgHeatmapCells.ownerIdentityId, ownerId), eq(mvgHeatmapCells.resolution, resolution)))
      .orderBy(desc(mvgHeatmapCells.intensity)).limit(2000);
  }
  async upsertCell(values: any) {
    await this.db.insert(mvgHeatmapCells).values(values)
      .onConflictDoUpdate({
        target: [mvgHeatmapCells.ownerIdentityId, mvgHeatmapCells.cellId, mvgHeatmapCells.resolution],
        set: { signals: values.signals, conversions: values.conversions, intensity: values.intensity, computedAt: new Date() },
      });
  }

  // Audit
  async recordAudit(ownerId: string | null, actorId: string | null, actorRole: string, action: string,
                    target: { type?: string; id?: string } = {}, diff: any = {},
                    req?: { ip?: string; userAgent?: string }) {
    await this.db.insert(mvgAuditEvents).values({
      ownerIdentityId: ownerId, actorIdentityId: actorId, actorRole, action,
      targetType: target.type ?? null, targetId: target.id ?? null, diff,
      ip: req?.ip ?? null, userAgent: req?.userAgent ?? null,
    });
  }
  listAudit(ownerId: string, limit = 200) {
    return this.db.select().from(mvgAuditEvents).where(eq(mvgAuditEvents.ownerIdentityId, ownerId))
      .orderBy(desc(mvgAuditEvents.createdAt)).limit(limit);
  }
}

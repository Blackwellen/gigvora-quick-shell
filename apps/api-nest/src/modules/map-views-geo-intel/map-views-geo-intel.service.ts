import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { MapViewsGeoIntelRepository } from './map-views-geo-intel.repository';
import {
  AUDIENCE_TRANSITIONS, GEOFENCE_TRANSITIONS, MEDIA_TRANSITIONS, PLACE_TRANSITIONS,
  gridCell, haversineMeters, pointInPolygon, truncCoord,
} from './dto';

const ML_BASE = process.env.ML_PYTHON_URL ?? 'http://localhost:8088';
const ANALYTICS_BASE = process.env.ANALYTICS_PYTHON_URL ?? 'http://localhost:8089';

@Injectable()
export class MapViewsGeoIntelService {
  private readonly logger = new Logger(MapViewsGeoIntelService.name);
  constructor(private readonly repo: MapViewsGeoIntelRepository) {}

  // ─── Overview ───────────────────────────────────────
  async overview(ownerId: string) {
    const [places, geofences, audiences, byPlace] = await Promise.all([
      this.repo.listPlaces(ownerId, 'active'),
      this.repo.listGeofences(ownerId, 'active'),
      this.repo.listAudiences(ownerId, 'active'),
      this.repo.countSignalsByPlace(ownerId),
    ]);
    const totals = byPlace.reduce((acc: any, r: any) => ({
      signals: acc.signals + Number(r.total ?? 0),
      conversions: acc.conversions + Number(r.conversions ?? 0),
    }), { signals: 0, conversions: 0 });
    const insights = await this.fetchInsights(ownerId, { totals, places: places.length }).catch(() =>
      this.fallbackInsights(totals, places.length));
    return {
      kpis: { places: places.length, geofences: geofences.length, audiences: audiences.length, ...totals },
      topPlaces: byPlace.slice(0, 10),
      insights, computedAt: new Date().toISOString(),
    };
  }
  private async fetchInsights(ownerId: string, signals: any) {
    try {
      const r = await fetch(`${ANALYTICS_BASE}/map-views-geo-intel/insights`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, signals }), signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return (await r.json()).insights ?? [];
    } catch (e) { this.logger.warn(`analytics down: ${(e as Error).message}`); }
    return this.fallbackInsights(signals.totals, signals.places);
  }
  private fallbackInsights(totals: any, places: number) {
    const out: any[] = [];
    if (places === 0) out.push({ id: 'no_places', severity: 'info', title: 'No active places yet', body: 'Add a place to start collecting signals.' });
    if (totals.signals === 0 && places > 0) out.push({ id: 'no_signals', severity: 'warn', title: 'No location signals captured', body: 'Wire SDK or webhook to start ingesting visits.' });
    if (totals.signals > 0 && totals.conversions === 0) out.push({ id: 'no_conversions', severity: 'warn', title: 'Signals captured but no conversions', body: 'Check conversion event mapping.' });
    if (!out.length) out.push({ id: 'healthy', severity: 'success', title: 'Geo telemetry healthy' });
    return out;
  }

  // ─── Places ─────────────────────────────────────────
  listPlaces(ownerId: string, status?: string) { return this.repo.listPlaces(ownerId, status); }
  async getPlace(ownerId: string, id: string) {
    const r = await this.repo.getPlace(id);
    if (!r) throw new NotFoundException('place not found');
    if (r.ownerIdentityId !== ownerId) throw new ForbiddenException('not your place');
    return r;
  }
  async createPlace(ownerId: string, dto: any, actorId: string, req?: any) {
    const r = await this.repo.createPlace({ ownerIdentityId: ownerId, status: 'active', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'place.created', { type: 'place', id: r.id }, dto, req);
    return r;
  }
  async updatePlace(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    await this.getPlace(ownerId, id);
    const r = await this.repo.updatePlace(id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'place.updated', { type: 'place', id }, dto, req);
    return r;
  }
  async transitionPlace(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.getPlace(ownerId, id);
    const allowed = PLACE_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updatePlace(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `place.${status}`, { type: 'place', id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Geofences ──────────────────────────────────────
  listGeofences(ownerId: string, status?: string) { return this.repo.listGeofences(ownerId, status); }
  async getGeofence(ownerId: string, id: string) {
    const r = await this.repo.getGeofence(id);
    if (!r) throw new NotFoundException('geofence not found');
    if (r.ownerIdentityId !== ownerId) throw new ForbiddenException('not your geofence');
    return r;
  }
  async createGeofence(ownerId: string, dto: any, actorId: string, req?: any) {
    // Compute bbox for fast pre-filtering
    let bbox: number[] | null = null;
    if (dto.shape === 'polygon' && dto.polygon) {
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const [lng, lat] of dto.polygon) {
        if (lng < minLng) minLng = lng; if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng; if (lat > maxLat) maxLat = lat;
      }
      bbox = [minLng, minLat, maxLng, maxLat];
    }
    const r = await this.repo.createGeofence({ ownerIdentityId: ownerId, status: 'active', ...dto, bbox });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'geofence.created', { type: 'geofence', id: r.id }, dto, req);
    return r;
  }
  async updateGeofence(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    await this.getGeofence(ownerId, id);
    const r = await this.repo.updateGeofence(id, dto);
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'geofence.updated', { type: 'geofence', id }, dto, req);
    return r;
  }
  async transitionGeofence(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.getGeofence(ownerId, id);
    const allowed = GEOFENCE_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updateGeofence(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `geofence.${status}`, { type: 'geofence', id }, { from: cur.status, to: status }, req);
    return r;
  }
  async testGeofence(ownerId: string, id: string, lat: number, lng: number) {
    const fence = await this.getGeofence(ownerId, id);
    if (fence.shape === 'circle') {
      const d = haversineMeters(lat, lng, fence.centerLat, fence.centerLng);
      return { hit: d <= fence.radiusMeters, distanceMeters: Math.round(d) };
    }
    return { hit: pointInPolygon(lat, lng, fence.polygon as number[][]), distanceMeters: null };
  }

  // ─── Audiences ──────────────────────────────────────
  listAudiences(ownerId: string, status?: string) { return this.repo.listAudiences(ownerId, status); }
  async getAudience(ownerId: string, id: string) {
    const r = await this.repo.getAudience(id);
    if (!r) throw new NotFoundException('audience not found');
    if (r.ownerIdentityId !== ownerId) throw new ForbiddenException('not your audience');
    return r;
  }
  async createAudience(ownerId: string, dto: any, actorId: string, req?: any) {
    const reach = await this.estimateReach(ownerId, dto);
    const r = await this.repo.createAudience({ ownerIdentityId: ownerId, status: 'active', ...dto, estimatedReach: reach });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'audience.created', { type: 'audience', id: r.id }, dto, req);
    return r;
  }
  async updateAudience(ownerId: string, id: string, dto: any, actorId: string, req?: any) {
    await this.getAudience(ownerId, id);
    const reach = await this.estimateReach(ownerId, dto);
    const r = await this.repo.updateAudience(id, { ...dto, estimatedReach: reach });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'audience.updated', { type: 'audience', id }, dto, req);
    return r;
  }
  async transitionAudience(ownerId: string, id: string, status: string, actorId: string, req?: any) {
    const cur = await this.getAudience(ownerId, id);
    const allowed = AUDIENCE_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    const r = await this.repo.updateAudience(id, { status });
    await this.repo.recordAudit(ownerId, actorId, 'owner', `audience.${status}`, { type: 'audience', id }, { from: cur.status, to: status }, req);
    return r;
  }
  /** Deterministic reach estimate from geofence radii + country priors. */
  private async estimateReach(ownerId: string, dto: any) {
    let reach = 0;
    for (const gid of dto.geofenceIds ?? []) {
      const g = await this.repo.getGeofence(gid).catch(() => null);
      if (!g || g.ownerIdentityId !== ownerId) continue;
      if (g.shape === 'circle') {
        const km2 = (Math.PI * (g.radiusMeters / 1000) ** 2);
        reach += Math.round(km2 * 350); // ~350 reachable per km² (urban prior)
      } else if (Array.isArray(g.bbox)) {
        const [minLng, minLat, maxLng, maxLat] = g.bbox;
        const km2 = Math.abs((maxLng - minLng) * (maxLat - minLat)) * 12321; // crude deg² → km²
        reach += Math.round(km2 * 250);
      }
    }
    const countryBoost = (dto.includeCountries ?? []).length * 50_000;
    return Math.max(0, reach + countryBoost);
  }

  // ─── Place media ────────────────────────────────────
  listPlaceMedia(ownerId: string, placeId: string) { return this.getPlace(ownerId, placeId).then(() => this.repo.listPlaceMedia(placeId)); }
  async createMedia(ownerId: string, dto: any, actorId: string, req?: any) {
    await this.getPlace(ownerId, dto.placeId);
    const m = await this.repo.createMedia({ ownerIdentityId: ownerId, status: 'pending', ...dto });
    await this.repo.recordAudit(ownerId, actorId, 'owner', 'media.created', { type: 'media', id: m.id }, dto, req);
    // Best-effort moderation scan inline; transitions to scanned/rejected.
    void this.scanMedia(ownerId, m.id, dto).catch((e) => this.logger.warn(`media ${m.id} scan failed: ${e.message}`));
    return m;
  }
  private async scanMedia(ownerId: string, id: string, dto: any) {
    const score = await this.fetchModerationScore(dto).catch(() => 0.05);
    const status = score > 0.85 ? 'rejected' : 'scanned';
    await this.repo.updateMedia(id, { status, moderationScore: score, moderationReason: status === 'rejected' ? 'auto:high-risk' : null });
    await this.repo.recordAudit(ownerId, null, 'system', `media.${status}`, { type: 'media', id }, { score });
  }
  private async fetchModerationScore(dto: any): Promise<number> {
    try {
      const r = await fetch(`${ML_BASE}/map-views-geo-intel/moderate-media`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: dto.kind, url: dto.url, bytes: dto.bytes }),
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) return Number((await r.json()).score ?? 0.05);
    } catch {}
    // Fallback heuristic — large unknown files lean slightly higher.
    if (dto.kind === 'video' && (dto.bytes ?? 0) > 200_000_000) return 0.4;
    return 0.05;
  }
  async transitionMedia(ownerId: string, id: string, status: string, actorId: string, actorRole: string, req?: any) {
    const cur = await this.repo.getMedia(id);
    if (!cur || cur.ownerIdentityId !== ownerId) throw new NotFoundException('media not found');
    const allowed = MEDIA_TRANSITIONS[cur.status] ?? [];
    if (!allowed.includes(status)) throw new BadRequestException(`invalid transition ${cur.status} → ${status}`);
    if ((status === 'approved' || status === 'rejected') && !['admin','moderator','owner'].includes(actorRole))
      throw new ForbiddenException('insufficient role');
    const r = await this.repo.updateMedia(id, { status });
    await this.repo.recordAudit(ownerId, actorId, actorRole, `media.${status}`, { type: 'media', id }, { from: cur.status, to: status }, req);
    return r;
  }

  // ─── Signals ────────────────────────────────────────
  async ingestSignal(ownerId: string, dto: any, actorId: string | null, req?: any) {
    const row = await this.repo.appendSignal({
      ownerIdentityId: ownerId,
      placeId: dto.placeId ?? null, geofenceId: dto.geofenceId ?? null,
      eventType: dto.eventType,
      lat: truncCoord(dto.lat ?? null), lng: truncCoord(dto.lng ?? null),
      countryCode: dto.countryCode ?? null,
      meta: dto.meta ?? {},
    });
    await this.repo.recordAudit(ownerId, actorId, 'system', `signal.${dto.eventType}`, { type: 'signal', id: row.id }, {}, req);
    return row;
  }

  // ─── Heatmap ────────────────────────────────────────
  async heatmap(ownerId: string, q: { resolution: number; bbox?: string }) {
    const cells = await this.repo.listHeatmap(ownerId, q.resolution);
    if (cells.length) return { cells, source: 'cache' };
    return { cells: await this.recomputeHeatmap(ownerId, q.resolution), source: 'recomputed' };
  }
  async recomputeHeatmap(ownerId: string, resolution: number) {
    const today = new Date(); const to = today.toISOString();
    const from = new Date(today.getTime() - 30 * 86400000).toISOString();
    const signals = await this.repo.signalsForOwner(ownerId, from, to);
    const buckets = new Map<string, { centerLat: number; centerLng: number; signals: number; conversions: number }>();
    for (const s of signals) {
      if (s.lat == null || s.lng == null) continue;
      const c = gridCell(s.lat, s.lng, resolution);
      const cur = buckets.get(c.cellId) ?? { centerLat: c.centerLat, centerLng: c.centerLng, signals: 0, conversions: 0 };
      cur.signals += 1; if (s.eventType === 'conversion') cur.conversions += 1;
      buckets.set(c.cellId, cur);
    }
    let max = 1;
    for (const v of buckets.values()) if (v.signals > max) max = v.signals;
    const out: any[] = [];
    for (const [cellId, v] of buckets) {
      const intensity = Math.min(1, v.signals / max);
      await this.repo.upsertCell({
        ownerIdentityId: ownerId, cellId, resolution,
        centerLat: v.centerLat, centerLng: v.centerLng,
        signals: v.signals, conversions: v.conversions, intensity,
      });
      out.push({ cellId, resolution, centerLat: v.centerLat, centerLng: v.centerLng,
                 signals: v.signals, conversions: v.conversions, intensity });
    }
    return out.sort((a, b) => b.intensity - a.intensity).slice(0, 2000);
  }

  audit(ownerId: string, limit = 200) { return this.repo.listAudit(ownerId, limit); }
}

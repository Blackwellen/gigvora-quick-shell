import { z } from 'zod';

export const PLACE_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['archived'], archived: ['active'],
};
export const GEOFENCE_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['paused', 'archived'],
  paused: ['active', 'archived'], archived: [],
};
export const AUDIENCE_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'], active: ['archived'], archived: ['active'],
};
export const MEDIA_TRANSITIONS: Record<string, string[]> = {
  pending: ['scanned', 'rejected'], scanned: ['approved', 'rejected'],
  approved: ['rejected'], rejected: [],
};

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);

export const PlaceSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['venue','office','retail','event','coworking','other']).optional(),
  lat, lng,
  country: z.string().length(2).optional(),
  region: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  postcode: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const GeofenceSchema = z.object({
  name: z.string().min(1).max(200),
  shape: z.enum(['circle','polygon']),
  centerLat: lat.optional(), centerLng: lng.optional(),
  radiusMeters: z.number().int().min(50).max(200000).optional(),
  polygon: z.array(z.tuple([lng, lat])).min(3).max(2000).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict().superRefine((v, ctx) => {
  if (v.shape === 'circle' && (v.centerLat == null || v.centerLng == null || v.radiusMeters == null))
    ctx.addIssue({ code: 'custom', path: ['shape'], message: 'circle requires centerLat/Lng/radiusMeters' });
  if (v.shape === 'polygon' && !v.polygon)
    ctx.addIssue({ code: 'custom', path: ['polygon'], message: 'polygon required' });
});

export const AudienceSchema = z.object({
  name: z.string().min(1).max(200),
  geofenceIds: z.array(z.string().uuid()).max(50).default([]),
  includeCountries: z.array(z.string().length(2)).max(50).default([]),
  excludeCountries: z.array(z.string().length(2)).max(50).default([]),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const PlaceMediaSchema = z.object({
  placeId: z.string().uuid(),
  kind: z.enum(['image','video','audio','document']),
  url: z.string().url().max(2000),
  thumbUrl: z.string().url().max(2000).optional(),
  bytes: z.number().int().min(0).max(524288000).optional(),
  durationMs: z.number().int().min(0).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const SignalSchema = z.object({
  placeId: z.string().uuid().optional(),
  geofenceId: z.string().uuid().optional(),
  eventType: z.enum(['visit','click','impression','conversion']),
  lat: lat.optional(), lng: lng.optional(),
  countryCode: z.string().length(2).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).strict();

export const StatusBody = z.object({ status: z.string() });

export const HeatmapQuery = z.object({
  resolution: z.coerce.number().int().min(4).max(10).default(7),
  bbox: z.string().optional(), // "minLng,minLat,maxLng,maxLat"
});

/** Truncate a coordinate to ≤5 dp (~1.1 m at the equator). Privacy posture. */
export function truncCoord(n: number | null | undefined): number | null {
  if (n == null) return null;
  return Math.round(n * 1e5) / 1e5;
}

/** Cheap deterministic grid cell id at a given resolution (≈ degrees / 2^res). */
export function gridCell(lat: number, lng: number, resolution: number): { cellId: string; centerLat: number; centerLng: number } {
  const step = 1 / Math.pow(2, resolution); // res 7 → ~0.0078°
  const i = Math.floor((lat + 90) / step);
  const j = Math.floor((lng + 180) / step);
  const centerLat = (i + 0.5) * step - 90;
  const centerLng = (j + 0.5) * step - 180;
  return { cellId: `r${resolution}:${i}:${j}`, centerLat, centerLng };
}

/** Haversine distance in metres. */
export function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat); const dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Point-in-polygon (ray casting). polygon: [[lng,lat], ...]. */
export function pointInPolygon(lat: number, lng: number, polygon: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = [polygon[i][0], polygon[i][1]];
    const [xj, yj] = [polygon[j][0], polygon[j][1]];
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

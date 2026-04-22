/**
 * Domain 62 — Map Views, Location Targeting, Geo Intelligence & Place-Based Media hooks.
 *
 * Hooks: overview, places, geofences (+test), audiences, place media, signals
 * (ingest), heatmap (read + recompute). All accept `demoMode` where applicable.
 */
import { useCallback, useEffect, useState } from 'react';

export type PlaceStatus = 'draft'|'active'|'archived';
export type GeofenceStatus = 'draft'|'active'|'paused'|'archived';
export type AudienceStatus = 'draft'|'active'|'archived';
export type MediaStatus = 'pending'|'scanned'|'approved'|'rejected';
export type EventType = 'visit'|'click'|'impression'|'conversion';

export interface Place {
  id: string; ownerIdentityId: string; name: string; status: PlaceStatus;
  category: 'venue'|'office'|'retail'|'event'|'coworking'|'other'|null;
  lat: number; lng: number;
  country: string|null; region: string|null; city: string|null; postcode: string|null; address: string|null;
  meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface Geofence {
  id: string; ownerIdentityId: string; name: string; status: GeofenceStatus;
  shape: 'circle'|'polygon';
  centerLat: number|null; centerLng: number|null; radiusMeters: number|null;
  polygon: number[][]|null; bbox: number[]|null;
  meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface Audience {
  id: string; ownerIdentityId: string; name: string; status: AudienceStatus;
  geofenceIds: string[]; includeCountries: string[]; excludeCountries: string[];
  estimatedReach: number; meta: Record<string, unknown>; createdAt: string; updatedAt: string;
}
export interface PlaceMedia {
  id: string; placeId: string; ownerIdentityId: string;
  kind: 'image'|'video'|'audio'|'document'; status: MediaStatus;
  url: string; thumbUrl: string|null; bytes: number|null; durationMs: number|null;
  moderationScore: number|null; moderationReason: string|null;
  meta: Record<string, unknown>; createdAt: string;
}
export interface HeatmapCell {
  cellId: string; resolution: number; centerLat: number; centerLng: number;
  signals: number; conversions: number; intensity: number;
}
export interface MvgOverview {
  kpis: { places: number; geofences: number; audiences: number; signals: number; conversions: number };
  topPlaces: { placeId: string|null; total: number; conversions: number }[];
  insights: { id: string; severity: 'info'|'success'|'warn'|'critical'; title: string; body?: string }[];
  computedAt: string;
}

const API = '/api/v1/map-views-geo-intel';

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`request failed: ${res.status} ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}

const DEMO_OVERVIEW: MvgOverview = {
  kpis: { places: 0, geofences: 0, audiences: 0, signals: 0, conversions: 0 },
  topPlaces: [],
  insights: [{ id: 'demo', severity: 'info', title: 'Demo mode', body: 'Live geo data will appear once wired.' }],
  computedAt: new Date().toISOString(),
};

export function useMvgOverview(opts?: { demoMode?: boolean }) {
  const [data, setData] = useState<MvgOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (opts?.demoMode) { setData(DEMO_OVERVIEW); return; }
      setData(await getJson<MvgOverview>(`${API}/overview`));
    } catch (e) { setError(e as Error); if (opts?.demoMode !== false) setData(DEMO_OVERVIEW); }
    finally { setLoading(false); }
  }, [opts?.demoMode]);
  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useMvgPlaces(status?: PlaceStatus) {
  const [items, setItems] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<Place[]>(`${API}/places?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Place>) => {
    const r = await getJson<Place>(`${API}/places`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Place>) => {
    await getJson(`${API}/places/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, s: PlaceStatus) => {
    await getJson(`${API}/places/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: s }) });
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update, transition };
}

export function useMvgGeofences(status?: GeofenceStatus) {
  const [items, setItems] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<Geofence[]>(`${API}/geofences?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Geofence>) => {
    const r = await getJson<Geofence>(`${API}/geofences`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Geofence>) => {
    await getJson(`${API}/geofences/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, s: GeofenceStatus) => {
    await getJson(`${API}/geofences/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: s }) });
    await reload();
  }, [reload]);
  const test = useCallback((id: string, lat: number, lng: number) =>
    getJson<{ hit: boolean; distanceMeters: number|null }>(`${API}/geofences/${id}/test`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lat, lng }),
    }), []);
  return { items, loading, reload, create, update, transition, test };
}

export function useMvgAudiences(status?: AudienceStatus) {
  const [items, setItems] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(); if (status) params.set('status', status);
      setItems(await getJson<Audience[]>(`${API}/audiences?${params}`));
    } finally { setLoading(false); }
  }, [status]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<Audience>) => {
    const r = await getJson<Audience>(`${API}/audiences`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload(); return r;
  }, [reload]);
  const update = useCallback(async (id: string, dto: Partial<Audience>) => {
    await getJson(`${API}/audiences/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) });
    await reload();
  }, [reload]);
  const transition = useCallback(async (id: string, s: AudienceStatus) => {
    await getJson(`${API}/audiences/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: s }) });
    await reload();
  }, [reload]);
  return { items, loading, reload, create, update, transition };
}

export function useMvgPlaceMedia(placeId: string | null) {
  const [items, setItems] = useState<PlaceMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    try { setItems(await getJson<PlaceMedia[]>(`${API}/places/${placeId}/media`)); }
    finally { setLoading(false); }
  }, [placeId]);
  useEffect(() => { reload(); }, [reload]);
  const create = useCallback(async (dto: Partial<PlaceMedia>) => {
    if (!placeId) throw new Error('placeId required');
    const r = await getJson<PlaceMedia>(`${API}/places/${placeId}/media`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto),
    });
    await reload(); return r;
  }, [placeId, reload]);
  const transition = useCallback(async (id: string, s: MediaStatus) => {
    await getJson(`${API}/media/${id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: s }) });
    await reload();
  }, [reload]);
  return { items, loading, reload, create, transition };
}

export function useMvgSignals() {
  const ingest = useCallback((dto: { eventType: EventType; placeId?: string; geofenceId?: string; lat?: number; lng?: number; countryCode?: string; meta?: Record<string, unknown> }) =>
    getJson(`${API}/signals`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(dto) }), []);
  return { ingest };
}

export function useMvgHeatmap(resolution: 4|5|6|7|8|9|10 = 7) {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [source, setSource] = useState<'cache'|'recomputed'|null>(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getJson<{ cells: HeatmapCell[]; source: 'cache'|'recomputed' }>(`${API}/heatmap?resolution=${resolution}`);
      setCells(r.cells); setSource(r.source);
    } finally { setLoading(false); }
  }, [resolution]);
  useEffect(() => { reload(); }, [reload]);
  const recompute = useCallback(async () => {
    const r = await getJson<HeatmapCell[]>(`${API}/heatmap/recompute`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ resolution }),
    });
    setCells(r); setSource('recomputed');
  }, [resolution]);
  return { cells, source, loading, reload, recompute };
}

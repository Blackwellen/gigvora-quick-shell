# Domain 62 — Map Views, Location Targeting, Geo Intelligence & Place-Based Media

**Route family**: `/app/map-views-geo-intel`
**Module**: `apps/api-nest/src/modules/map-views-geo-intel/`
**Schema**: `packages/db/src/schema/map-views-geo-intel.ts`
**Migration**: `packages/db/migrations/0063_map_views_geo_intel.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useMvgOverview` | `GET /overview` |
| Places | `useMvgPlaces` | `GET/POST /places`, `PATCH /places/:id`, `PATCH /places/:id/status` |
| Geofences | `useMvgGeofences` | `GET/POST /geofences`, `PATCH /geofences/:id`, `PATCH /geofences/:id/status`, `POST /geofences/:id/test` |
| Audiences | `useMvgAudiences` | `GET/POST /audiences`, `PATCH /audiences/:id`, `PATCH /audiences/:id/status` |
| Place media | `useMvgPlaceMedia` | `GET/POST /places/:id/media`, `PATCH /media/:id/status` |
| Signal ingest | `useMvgSignals` | `POST /signals` |
| Heatmap | `useMvgHeatmap` | `GET /heatmap`, `POST /heatmap/recompute` |
| Audit | (controller) | `GET /audit` |

## State machines

- `mvg_places.status`: `draft → active → archived` (archive↔active permitted).
- `mvg_geofences.status`: `draft → active ↔ paused → archived`.
- `mvg_audiences.status`: `draft → active → archived` (archive↔active permitted).
- `mvg_place_media.status`: `pending → scanned → approved | rejected`;
  approve/reject restricted to `owner | admin | moderator` roles.

## Geometry rules

- `mvg_places`: `lat ∈ [-90,90]`, `lng ∈ [-180,180]`, ISO-2 country.
- `mvg_geofences`:
  - `circle` requires `centerLat`, `centerLng`, `radiusMeters ∈ [50, 200_000]`.
  - `polygon` requires ≥3 `[lng, lat]` vertices (max 2000); bbox computed
    server-side at create time for fast pre-filtering.
- `POST /geofences/:id/test` returns `{ hit, distanceMeters }`. Circle uses
  Haversine; polygon uses ray-casting point-in-polygon.

## Privacy posture (UK / GDPR)

- `lat`/`lng` on `mvg_location_signals` are **truncated to 5 decimal places**
  (~1.1 m at the equator) before insert. Raw IP is **never** stored — only
  `country_code` (ISO-2) is persisted.
- `mvg_location_signals` is **append-only** (Postgres trigger blocks
  `UPDATE/DELETE`). Retention is enforced via owner-scoped delete jobs at
  the platform level, not row-level mutations.
- All tables scoped per `owner_identity_id`; cross-tenant reads impossible.
- Audit `ip` + `user_agent` per write; rationale strings stored on media
  rejections for defensibility.

## Heatmap

- Cells are computed at a configurable `resolution ∈ [4, 10]` using a
  deterministic grid (`step = 1 / 2^resolution` degrees). Cell ID is
  `r{res}:{i}:{j}`.
- `GET /heatmap` returns cached cells; if none exist for the owner at that
  resolution, the service triggers a recompute over the last 30 days of
  signals. `POST /heatmap/recompute` forces a refresh.
- Intensity is normalised `[0, 1]` against the owner's max-cell signals.

## ML / Analytics

- `apps/ml-python/app/map_views_geo_intel.py`:
  - `POST /moderate-media` — deterministic 0..1 risk score with reason
    list. Heuristics: malformed host, oversized video, executable
    extensions. Falls back to `0.05` if the service is offline.
- `apps/analytics-python/app/map_views_geo_intel.py`:
  - `POST /insights` — operational insights (`no_places`, `no_signals`,
    `no_conversions`, `strong_perf`, `healthy`) with deterministic
    fallback in NestJS when the service is unreachable.

## Reach estimation

`createAudience` / `updateAudience` compute a deterministic
`estimatedReach` from geofence area + country prior (~350 reachable per
km² urban prior; +50,000 per included country). Stored on the audience
row so UI never has to recompute.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/map_views_geo_intel/`:
- Sticky KPI header (Places, Geofences, Signals, Conversions).
- Tabs: Places | Geofences | Audiences (RefreshIndicator on each).
- Pull-to-refresh, semantic icons per shape, status surfaced inline.

## Tests

- Playwright smoke: `tests/playwright/map-views-geo-intel.spec.ts`.
- Recommended Jest coverage:
  - `truncCoord`, `gridCell`, `haversineMeters`, `pointInPolygon` correctness.
  - All state-machine valid/invalid transitions.
  - Cross-tenant `403` on every controller method.
  - Polygon without vertices and circle without radius rejected.
  - `lat`/`lng` out-of-range rejected at DTO + DB CHECK.
  - Signal append-only trigger rejects `UPDATE/DELETE`.
  - ML moderation fallback when Python service offline.
  - Heatmap recompute idempotent (upsert on `(owner, cellId, resolution)`).

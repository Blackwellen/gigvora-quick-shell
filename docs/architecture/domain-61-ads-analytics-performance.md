# Domain 61 — Ads Analytics, CPC/CPM/CPI/CPA Reporting & Creative Performance

**Route family**: `/app/ads-analytics-performance`
**Module**: `apps/api-nest/src/modules/ads-analytics-performance/`
**Schema**: `packages/db/src/schema/ads-analytics-performance.ts`
**Migration**: `packages/db/migrations/0062_ads_analytics_performance.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useAapOverview` | `GET /overview` |
| Aggregated query (table) | `useAapQuery` | `POST /query` |
| Creative scores | `useAapCreativeScores` | `GET /creative-scores`, `POST /creative-scores/:id/recompute` |
| Saved reports | `useAapSavedReports` | `GET/POST /saved-reports`, `PATCH /saved-reports/:id`, `PATCH /saved-reports/:id/status` |
| Alerts + events | `useAapAlerts` | `GET/POST /alerts`, `PATCH /alerts/:id`, `PATCH /alerts/:id/status`, `GET /alerts/:id/events` |
| Export jobs | `useAapExports` | `GET/POST /exports`, `DELETE /exports/:id` |
| Anomalies | `useAapAnomalies` | `GET /anomalies`, `PATCH /anomalies/:id/status`, `POST /anomalies/detect` |
| Audit | (controller) | `GET /audit` |

## State machines

- `aap_saved_reports.status`: `draft → active → archived`; `active → draft` allowed.
- `aap_alerts.status`: `active ↔ paused → archived`; `active → triggered → acknowledged → active`.
- `aap_export_jobs.status`: `queued → running → succeeded | failed | cancelled`.
- `aap_anomalies.status`: `open → acknowledged → resolved`.

## Money & metric integrity

- All amounts in **minor units** (GBP default).
- Ratio integrity in DB: `clicks ≤ impressions`, `installs ≤ clicks`,
  `conversions ≤ clicks`, video quartile ladder enforced
  (`100 ≤ 75 ≤ 50 ≤ 25`).
- `aap_daily_facts` is **append-only** — Postgres trigger blocks `UPDATE/DELETE`.
- Unique on `(campaign_id, ad_group_id, creative_id, date, country, device, placement)` —
  webhook replays are no-ops via `ON CONFLICT DO NOTHING`.

## Derived metrics (single source of truth)

`computeDerived()` in `dto.ts` returns `{ ctr, cvr, cpc_minor, cpm_minor, cpi_minor, cpa_minor, roas }`:

- `CTR = clicks / impressions`
- `CVR = conversions / clicks`
- `CPC = spend_minor / clicks`
- `CPM = (spend_minor / impressions) × 1000`
- `CPI = spend_minor / installs`
- `CPA = spend_minor / conversions`
- `ROAS = revenue_minor / spend_minor`

All zero-denominator cases return `0` (never NaN/Infinity).

## Query DTO

`POST /query` accepts `{ filters, groupBy, metrics, sort, page, pageSize }`.

- `filters`: `dateFrom`/`dateTo` (max 366 days), optional arrays for
  `campaignIds`, `creativeIds`, `country`, `device`, `placement`.
- `groupBy`: any subset of `date | campaign | ad_group | creative | country | device | placement` (max 6).
- `metrics`: any subset of the 13 supported metrics (raw + derived).
- Sort runs in-application after derived metrics are computed.

## ML / Analytics

- `apps/ml-python/app/ads_analytics_performance.py`:
  - `POST /score-creative` — deterministic 0..1 performance + 0..1 fatigue,
    plus a `band` (`top|strong|average|weak|poor`) and an explanation blob.
- `apps/analytics-python/app/ads_analytics_performance.py`:
  - `POST /insights` — operational insights (`no_data`, `low_ctr`, `low_cvr`,
    `negative_roas`, `scale_now`, `healthy`, `warming`).
- All ML/analytics calls use a 2s timeout and fall back to deterministic
  in-process scoring/insights when unavailable. Anomaly detection uses
  z-score over the last 14 days of owner-wide CTR with `|z| ≥ 2` →
  `warn`, `|z| ≥ 3` → `critical`.

## Alerts

Validated metrics: `ctr|cvr|cpc|cpm|cpi|cpa|spend|roas`. Comparators:
`gt|lt|gte|lte|change_pct`. `webhook` channel requires `https://` target.
Cooldown 0..10080 minutes. Acknowledging an `active → triggered` alert
appends an `aap_alert_events` row with `acknowledged_by_identity_id` for audit.

## Exports

- `POST /exports` returns immediately with `queued`. The service runs the
  query inline and writes a `mem://exports/{id}.{format}` placeholder URL —
  swap for object storage in production via the existing storage adapter.
- `DELETE /exports/:id` only valid from `queued | running` (state-machine guarded).

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/ads_analytics_performance/`:
- Sticky KPI header (Spend, CTR, CPC, ROAS).
- Tabs: Insights | Alerts | Anomalies.
- Anomaly tap → inline `Ack` button (acknowledged-by recorded server-side).

## UK / GDPR / FCA posture

- All tables scoped per `owner_identity_id`; controllers filter by
  `req.user.orgId ?? req.user.sub` — cross-tenant reads are impossible.
- Audit `ip` + `user_agent` per write; rationale strings stored on
  anomalies for defensibility.
- No PII inside `aap_daily_facts` (counters + dimensions only).
- Spend is sourced from Domain 60's `amb_metric_snapshots` via the same
  webhook ingestion path; ledger truth lives in Domain 59.

## Tests

- Playwright smoke: `tests/playwright/ads-analytics-performance.spec.ts`.
- Recommended Jest coverage to add next:
  - `computeDerived` correctness on zero-denominator and rounding edges.
  - State-machine valid/invalid transitions for saved reports, alerts,
    exports, anomalies.
  - Cross-tenant `403` on every controller method.
  - `dateTo < dateFrom` and span > 366 days rejected.
  - Webhook channel target validation (`https://` required).
  - Append-only fact trigger rejects `UPDATE/DELETE`.
  - ML score-creative and insights fallback when Python service offline.
  - Anomaly detection produces `open` row when `|z| ≥ 2`.

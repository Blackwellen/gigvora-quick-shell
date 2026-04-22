# Domain 60 — Ads Manager: Campaign List, Builder, Creative Library & Routing

**Route family**: `/app/ads-manager-builder`
**Module**: `apps/api-nest/src/modules/ads-manager-builder/`
**Schema**: `packages/db/src/schema/ads-manager-builder.ts`
**Migration**: `packages/db/migrations/0061_ads_manager_builder.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useAmbOverview` | `GET /overview` |
| Campaign list + lifecycle | `useAmbCampaigns` | `GET/POST /campaigns`, `PATCH /campaigns/:id`, `PATCH /campaigns/:id/status` |
| Campaign detail | `useAmbCampaign` | `GET /campaigns/:id` |
| Creative library | `useAmbCreatives` | `GET/POST /creatives`, `PATCH /creatives/:id`, `PATCH /creatives/:id/status` |
| Ad groups + creative attach | `useAmbAdGroups` | `GET/POST /campaigns/:id/ad-groups`, `PATCH /ad-groups/:id/status`, `POST/DELETE /campaigns/:cid/ad-groups/:agid/creatives[/:crid]` |
| Routing rules | `useAmbRoutingRules` | `GET/POST/DELETE /campaigns/:id/routing-rules[/:rid]` |
| Metrics (timeseries + totals) | `useAmbMetrics` | `GET /campaigns/:id/metrics?from&to` |
| Search (campaigns + creatives) | `useAmbSearch` | `GET /search?q&subjectType` |
| Audit | (controller) | `GET /audit` |
| Moderation queue (admin) | (admin controller) | `GET /admin/.../moderation/:type/:id`, `POST /admin/.../moderation` |
| Provider webhook (metrics) | n/a | `POST /webhook/:provider` |

## State machines

- `amb_campaigns.status`: `draft → in_review → approved → active ↔ paused → completed | archived`;
  `in_review → rejected → draft`; `approved → archived`.
- `amb_creatives.status`: `draft → in_review → approved → archived`;
  `in_review → rejected → draft`.
- `amb_ad_groups.status`: `draft → active ↔ paused → archived`.

Approve/reject (campaign **and** creative) requires `admin | operator | moderator` —
owner-only `403`s. `rejected` requires a non-empty `reason`. `archived` requires
a `reason` for campaigns.

## Money & integrity invariants

- All amounts in **minor units** (GBP default). `daily_budget_minor ≤ budget_minor`.
- `spent_minor ≤ budget_minor + £1,000` (soft overspend grace; hard rejection beyond).
- Metric snapshot CHECKs: `clicks ≤ impressions`, `conversions ≤ clicks`,
  unique on `(campaign_id, ad_group_id, creative_id, date)`.
- `amb_metric_snapshots` is **append-only** — Postgres trigger rejects `UPDATE/DELETE`.
- Routing rules priority `0..10000`; ad-group creative weight `0..10000`.

## Edit invariants

- Campaign edits allowed only in `draft | rejected | paused`.
- Creative edits allowed only in `draft | rejected`.
- Attaching a creative to an ad group requires the creative to be `approved` AND
  owned by the same identity (`403` cross-tenant).

## ML / Analytics

- `apps/ml-python/app/ads_manager_builder.py`:
  - `POST /quality-score` — deterministic 0..1 score (objective, budget band,
    geos/audiences, frequency cap). Returned as `quality_score` when a campaign
    enters `in_review`.
  - `POST /moderate-creative` — banned + suspicious keyword scan, returns
    `score`, `flags`, `soft_flags`, `needs_human_review`.
- `apps/analytics-python/app/ads_manager_builder.py`:
  - `POST /insights` — operational insights (`review`, `rejected`, `no_active`,
    `paused_heavy`, `healthy`).
- All ML/analytics calls have a 2s timeout and a deterministic in-process
  fallback (e.g. moderation falls back to a built-in keyword scan; quality
  score falls back to `0.5`).

## Search index

`amb_search_index` keeps a denormalised row per campaign and creative with
`search_text` (Postgres `to_tsvector` GIN index) and `facets` JSONB. Updated
on every create/update/transition. The Nest `search()` endpoint is the
adapter seam for an OpenSearch swap-in later.

## Webhooks

`POST /api/v1/ads-manager-builder/webhook/:provider`:
1. Verify signature header (production must verify with provider secret).
2. Persist every delivery to `amb_webhook_deliveries` with
   `(provider, event_id)` unique → replay protection.
3. Map known events: `metrics.snapshot` → append a row to `amb_metric_snapshots`
   AND increment `amb_campaigns.spent_minor`. Outcome stored as
   `processed | skipped | failed`.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/ads_manager_builder/`:
- Sticky KPI header (Active, In review, Spent, Budget).
- Tabs: Campaigns | Creatives.
- Campaign tap → bottom sheet with `Send for review`, `Pause`, `Resume / activate`.

## UK / GDPR / FCA posture

- Audit `ip` + `user_agent` per write; cross-tenant queries are impossible by
  construction (every controller filters by `req.user.orgId ?? req.user.sub`).
- Moderation decisions persist `reviewer_identity_id`, `decision`, `rationale`,
  `flags`, and `model_score` for audit defensibility.
- Spend is bound to existing payments/escrow ledgers via `amb_campaigns.spent_minor`
  + provider webhook deltas; FCA-safe ledgers are owned by Domain 59.
- Rejection rationales are user-facing and stored on the campaign/creative.

## Tests

- Playwright smoke: `tests/playwright/ads-manager-builder.spec.ts`.
- Recommended Jest coverage to add next:
  - Campaign + creative + ad-group state-machine valid/invalid transitions.
  - Cross-tenant `403` on every controller method.
  - `daily_budget > budget` rejected; `endAt < startAt` rejected.
  - Attaching a non-approved creative rejected; attaching another tenant's
    creative `403`.
  - Append-only metric trigger rejects `UPDATE/DELETE`.
  - Webhook duplicate event no-double-action; bad signature `403`.
  - ML quality-score + moderation fallback when Python service offline.

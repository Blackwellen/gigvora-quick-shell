# Domain 72 — Ads Ops Dashboard, Policy Review, Geo+Keyword Moderation, Campaign Controls

## Surfaces
Internal: `/internal/ads-ops-dashboard`, `/internal/ads-ops/reviews`,
`/internal/ads-ops/geo-rules`, `/internal/ads-ops/keyword-rules`,
`/internal/ads-ops/campaign-controls`.

## Persistence
Migration `packages/db/migrations/0080_ads_ops.sql`:
- `ads_ops_policy_reviews` — creative + landing URL + geos + keywords with
  ML policy score & band; queue + status + SLA.
- `ads_ops_decisions` — full decision menu: approve / approve_with_edits /
  reject / request_changes / hold / escalate / dismiss / pause_campaign /
  resume_campaign / disable_creative / geo_restrict / keyword_restrict.
- `ads_ops_geo_rules` — global / advertiser / campaign scoped block / allow /
  restrict_age / restrict_category, unique on (scope, scopeId, geoCode, rule, category).
- `ads_ops_keyword_rules` — global / advertiser / campaign scoped block / review /
  allow with exact / phrase / regex / substring matching.
- `ads_ops_campaign_controls` — operator overlay on campaigns
  (active / paused / disabled / restricted) feeding back into Domain 60.
- `ads_ops_events` — append-only audit ledger (immutable trigger).
5 demo reviews + 4 demo geo rules + 6 demo keyword rules + 1 demo campaign control seeded.

## Review state machine
`pending → reviewing → holding/escalated → approved/rejected → archived`.
Queue derived via `QUEUE_BY_STATUS`.

## Backend
NestJS `apps/api-nest/src/modules/ads-ops/` — JWT-guarded.
Role ladder: `viewer < ads_reviewer < ads_lead < ads_admin`.

Endpoints:
- `GET /overview` — KPIs + queues + campaign controls + insights
- `GET/POST /reviews`, `GET /reviews/:id` — list / file / detail
  (file runs ML policy scorer to seed score, band, flags, reasons, SLA)
- `PATCH /reviews/transition` — state-machine guard (escalated = lead+)
- `PATCH /reviews/assign`, `POST /reviews/claim-next` — queue jump
  (`FOR UPDATE SKIP LOCKED`, auto-flips `pending → reviewing`)
- `POST /reviews/decide` — full decision menu with role gates:
  - reviewer: approve, approve_with_edits, reject, request_changes, hold, dismiss
  - lead+: escalate, geo_restrict, keyword_restrict, pause_campaign,
    resume_campaign, disable_creative
  Side-effect: pause/disable/restrict decisions upsert `ads_ops_campaign_controls`.
- `GET/POST /campaign-controls` — operator overlay (lead+ to mutate).
- `GET/POST/DELETE /geo-rules` — campaign-scope rules = lead+;
  global-scope rules = ads_admin only.
- `GET/POST/DELETE /keyword-rules` — same role gates as geo rules.

Every write writes an `ads_ops_events` row (immutable).

## ML + Analytics
- ML `apps/ml-python/app/ads_ops.py`:
  - `POST /ads-ops/score-creative` — deterministic policy scoring
    (crypto_scam, misleading_health, gambling, controlled_substance,
    adult_content, weapons, unverified_url, invalid_url) → score, band,
    flags[{code, severity, source}], reasons[].
- Analytics `apps/analytics-python/app/ads_ops.py`:
  - `POST /ads-ops/insights` (sla_breached, critical_reviews, escalations,
    triage_backlog, high_reviews, ads_ops_healthy).
Service falls back to deterministic in-process implementations on timeout.

## SDK + Hooks
- `packages/sdk/src/ads-ops.ts` — typed envelopes (reviews, decisions,
  events, geo rules, keyword rules, campaign controls, KPIs, overview).
- `src/hooks/useAdsOps.ts` — `useAdsOpsOverview` (30s refetch),
  `useAdsOpsReviews`, `useAdsOpsReview`, `useAdsOpsCreateReview`,
  `useAdsOpsTransition`, `useAdsOpsAssign`, `useAdsOpsClaimNext`,
  `useAdsOpsDecide`, `useAdsOpsCampaignControls`,
  `useAdsOpsSetCampaignControl`, `useAdsOpsGeoRules`, `useAdsOpsAddGeoRule`,
  `useAdsOpsRemoveGeoRule`, `useAdsOpsKeywordRules`,
  `useAdsOpsAddKeywordRule`, `useAdsOpsRemoveKeywordRule`.

## Mobile
`apps/mobile-flutter/lib/features/ads_ops/*` — KPI strip
(SLA breached, critical, triage, geo rules, keyword rules), insight cards,
review-queue list, "Claim next" FAB, pull-to-refresh.

## Tests
Playwright `tests/playwright/ads-ops.spec.ts` — 5 surface mounts.

## UK / GDPR posture
Immutable event ledger, role-gated decisions
(reviewer-only approve/reject; lead-only campaign pause/disable/restrict
and geo/keyword rule mutation; ads_admin-only global rules), ML model
output preserved alongside human override (auditability), SLA timer seeded
by ML band, geo rules cover sanctioned regions (IR, KP) and category
gating (UKGC gambling, US crypto), keyword rules cover crypto scams,
misleading health, gambling guarantees, weight-loss patterns and gambling
category geo-gating.

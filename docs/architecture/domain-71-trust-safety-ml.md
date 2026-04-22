# Domain 71 — Trust & Safety Dashboard, ML Review, Fraud Signals, Risk Decisions

## Surfaces
Internal: `/internal/trust-safety-ml-dashboard`, `/internal/trust-safety`,
`/internal/trust-safety/cases`, `/internal/trust-safety/signals`,
`/internal/trust-safety/watchlist`.

## Persistence
Migration `packages/db/migrations/0079_trust_safety_ml.sql`:
- `tsml_signals` — fraud/abuse/identity/payment/login/etc. signals with ML score & band.
- `tsml_cases` — operator-facing risk cases linking signals; queue + status + risk band + SLA.
- `tsml_decisions` — full decision menu (allow → friction → step-up KYC → hold/release funds
  → restrict / suspend / refund / chargeback dispute → ban / blacklist / escalate legal).
- `tsml_ml_reviews` — model output + operator agreement (override audit).
- `tsml_events` — append-only audit ledger (immutable trigger).
- `tsml_watchlist` — blocklist / allowlist / watchlist by subject.
6 demo signals + 5 demo cases + ML reviews + 2 watchlist entries seeded.

## Case state machine
`open → reviewing → holding/escalated → decided → closed`
Queue auto-derived (`QUEUE_BY_STATUS`).

## Backend
NestJS `apps/api-nest/src/modules/trust-safety-ml/` — JWT-guarded.
Role ladder: `viewer < ts_analyst < ts_lead < ts_admin`.

Endpoints:
- `GET /overview` — KPIs + queues + signals + watchlist + insights + desk-risk
- `GET/POST /signals` — list + file (manual = analyst+; webhooks = any auth)
- `GET/POST /cases`, `GET /cases/:id` — list / create / detail
- `PATCH /cases/transition` — state machine guard (escalated/closed = lead+)
- `PATCH /cases/assign`, `POST /cases/claim-next` — queue jump
  (`FOR UPDATE SKIP LOCKED`, auto-flips `open → reviewing`)
- `POST /cases/decide` — full decision menu with role gates:
  - lead+: restrict, suspend, refund, chargeback, escalate_compliance, watchlist add
  - ts_admin: ban, blacklist, escalate_legal
- `POST /cases/ml-review` — operator agree/override the model (audit trail)
- `GET/POST/DELETE /watchlist` — block/allow/watch lists (lead+ to mutate)

Every write writes a `tsml_events` row (immutable).

## ML + Analytics
- ML `apps/ml-python/app/trust_safety_ml.py`:
  - `POST /trust-safety-ml/signal-score` (per-signal scoring)
  - `POST /trust-safety-ml/case-score` (case score with signal aggregation)
  - `POST /trust-safety-ml/desk-risk` (overall desk pressure)
- Analytics `apps/analytics-python/app/trust_safety_ml.py`:
  - `POST /trust-safety-ml/insights` (sla_breached, escalations,
    triage_backlog, critical_signals, high_signals, tsml_healthy)
Service falls back to deterministic in-process implementations on timeout.

## SDK + Hooks
- `packages/sdk/src/trust-safety-ml.ts` — typed envelopes (cases, signals,
  decisions, ML reviews, watchlist, KPIs, overview).
- `src/hooks/useTrustSafetyMl.ts` — `useTsmlOverview` (30s refetch),
  `useTsmlSignals`, `useTsmlCreateSignal`, `useTsmlCases`, `useTsmlCase`,
  `useTsmlCreateCase`, `useTsmlTransition`, `useTsmlAssign`, `useTsmlClaimNext`,
  `useTsmlDecide`, `useTsmlMlReview`, `useTsmlWatchlist`,
  `useTsmlAddWatchlist`, `useTsmlRemoveWatchlist`.

## Mobile
`apps/mobile-flutter/lib/features/trust_safety_ml/*` — KPI strip
(desk risk, SLA breached, open signals, critical signals), insight
cards, review-queue list, "Claim next" FAB, pull-to-refresh.

## Tests
Playwright `tests/playwright/trust-safety-ml.spec.ts` — 5 surface mounts.

## UK / GDPR posture
Immutable event ledger, role-gated decisions (lead-only restrict/refund,
ts_admin-only ban/legal escalation), ML model output preserved alongside
human override (auditability), SLA timer seeded by ML band, watchlists
require lead+ to add/remove and are scoped per subject (user/device/ip/etc.).

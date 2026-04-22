# Domain 69 — Dispute Operations Dashboard, Case Routing, Arbitration Desk

## Surfaces
Internal: `/internal/dispute-operations-dashboard`, `/internal/disputes`.
User-side: `/disputes`, `/disputes/history`, `/disputes/counter-response`.

## Persistence
Migration `packages/db/migrations/0077_dispute_ops.sql`:
- `dop_cases` — full case lifecycle, queue, priority score, SLA timer.
- `dop_messages` — claimant/respondent/operator/arbitrator threads with
  visibility (`parties` | `internal` | `arbitration`).
- `dop_evidence` — uploaded artefacts with party + kind classification.
- `dop_events` — append-only audit (immutable trigger).
- `dop_arbitration` — arbitration panels + decisions + rationale.
6 demo cases seeded across triage / mediation / arbitration / escalation.

## Case state machine
`pending → triaged → mediation → awaiting_response → resolved → closed`
plus `arbitration` and `escalated` branches; `dismissed` is a terminal early-exit.
Queue is auto-derived from status (`QUEUE_BY_STATUS`).

## Backend
NestJS module `apps/api-nest/src/modules/dispute-ops/` exposes
`/api/v1/dispute-ops/*` (JWT-guarded). Role ladder
`viewer < operator < mediator < arbitrator < dispute_admin`. Endpoints:
- `GET /overview` — KPIs + queues + insights + risk score
- `GET/POST/PATCH /cases*` (list, detail, create, transition, assign)
- `POST /cases/claim-next` — deterministic queue jump using
  `FOR UPDATE SKIP LOCKED`
- `POST /messages`, `POST /evidence`
- `POST /arbitration/open`, `POST /arbitration/decide`

Permission rules:
- `arbitration` transition + open/decide arbitration → arbitrator+
- `escalated` / `closed` transition → dispute_admin only
- `arbitration` visibility on messages → arbitrator+
- Every write produces a `dop_events` row (immutable).

## ML + Analytics
- ML `apps/ml-python/app/dispute_ops.py` — `POST /dispute-ops/score`
  (deterministic risk score + band).
- Analytics `apps/analytics-python/app/dispute_ops.py` —
  `POST /dispute-ops/insights` (sla_breached, escalations, triage_backlog,
  arbitration_open, dop_healthy).
Service falls back to in-process implementations on timeout.

## SDK + Hooks
- `packages/sdk/src/dispute-ops.ts` — typed envelopes.
- `src/hooks/useDisputeOps.ts` — `useDopOverview`, `useDopCases`,
  `useDopCase`, `useDopCreateCase`, `useDopTransition`, `useDopAssign`,
  `useDopClaimNext`, `useDopPostMessage`, `useDopAddEvidence`,
  `useDopOpenArbitration`, `useDopDecideArbitration` — all with fixture fallback.

## Mobile
`apps/mobile-flutter/lib/features/dispute_ops/*` — KPI strip
(risk score band, SLA breached, in triage, in arbitration), insight cards,
triage queue list, "Claim next" FAB (calls queue jump), pull-to-refresh.

## Tests
Playwright `tests/playwright/dispute-ops.spec.ts` — 4 surface mounts.

## UK / GDPR posture
Immutable event ledger, role-gated transitions, arbitrator-only
arbitration visibility, dispute_admin-only escalate/close, SLA timer
seeded by severity.

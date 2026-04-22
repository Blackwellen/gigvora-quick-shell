# FD-13 — Analytics Intelligence, KPI Engine, Forecasting & Reporting Enrichment — Run 1 Audit

Date: 2026-04-18 · Group: G4 · Maps to **Master Sign-Off Matrix → G03 (backend), G04 (data/schema), G09 (Playwright), G12 (analytics/ML), G13 (runbooks)**.

> Scope: prove there is a real KPI engine (admin-defined custom KPIs with title/target/percentage|number/unset-state), forecasting helpers, summary services across role-aware dashboards, reporting enrichment (definitions + schedules + runs + subscriptions actually executing), and analytics workers that roll up metrics rather than no-op.

## 1. Inventory snapshot

### NestJS analytics services
- **24 `*.analytics.service.ts`** ✅ paralleling 25 ML services (agency, booking, calls, candidate-availability-matching, contracts-sow-acceptance, enterprise-hiring-workspace, events, gigs-browse, groups, inbox, interview-planning, job-application-flow, job-posting-studio, jobs-browse, media-viewer, podcasts, project-posting-smart-match, project-workspaces-handover, projects-browse-discovery, proposal-builder-bid-credits, proposal-review-award, recruiter-job-management, trust, webinars).
- Exemplar `recruiter-job-management.analytics.service.ts` shows the canonical pattern: `@Optional() @Inject('ANALYTICS_CLIENT')` + deterministic fallback + `mode: 'analytics'|'fallback'` + anomaly note ("Approval backlog growing — check approver workload.") + `generatedAt` timestamp ✅. Same divergence concern as FD-12 — uses raw `'ANALYTICS_CLIENT'` token, no Zod envelope, no requestId, no per-endpoint timeout.
- **5 dedicated dashboard services** ✅ (`agency-management-dashboard`, `client-dashboard`, `enterprise-dashboard`, `recruiter-dashboard` via `recruiter-job-management`, `user-dashboard`) + Python counterparts in `apps/analytics-python/app/` (`ads_analytics_performance.py`, `agency_management_dashboard.py`, `client_dashboard.py`, `enterprise_dashboard.py`, `moderator_dashboard.py`, `recruiter_dashboard.py`, `user_dashboard.py`).

### Reporting domain
- `packages/db/src/schema/reporting.ts` ✅ — `report_definitions` (kind/query/visualization/visibility), `report_schedules` (cron/timezone/recipients/format pdf|csv|xlsx|json/lastRunAt/nextRunAt), `report_runs` (status/rowCount/artifactUrl/errorMessage), `report_subscriptions` (channel email|in_app|slack).
- **No `apps/api-nest/src/modules/reporting/` module** — schema exists but zero controller/service/repository/scheduler. Definitions cannot be created; schedules never tick; runs never execute; artifacts never produced.

### KPI engine
- **`KPICard` + `KPIBand` exist in `src/components/shell/EnterprisePrimitives.tsx`** ✅ — used across `JobAnalyticsPage.tsx`, `GroupAnalyticsPage.tsx`, recruiter/enterprise dashboards.
- **No backend KPI definition table.** `grep custom_kpi|kpi_definition|KpiDefinition` returns **zero hits** in `apps/`, `packages/db`. Super-admin **cannot define a KPI** with title/target type/percentage|number mode/unset-state — entire business goal sub-bullet is unimplemented.
- No `kpi_values` projection table; no `kpi_targets` table; no `kpi_subscriptions`; no per-tenant override.

### Analytics-v2 schema
- `analytics_metrics_daily` ✅ exists with `(tenant_id, metric_key, day, dimensions)` UNIQUE — the right shape for KPI rollups, but **no producer** writes to it. Grep confirms only the schema file references it.

### Workers
- `apps/workers/src/index.ts` registers `analytics: 'analytics-rollup'` queue ✅ but handler is `async (d) => { log.info({d},'analytics-rollup'); return {ok:true}; }` — **placeholder**, never rolls up `analytics_events` → `analytics_metrics_daily`, never computes KPI values, never runs forecasts, never triggers `report_schedules`.

### Forecasting
- `recruiter-job-management.ml.service.ts` provides `fallbackForecast` (per FD-12 audit) ✅ for recruiter pipeline forecast.
- **No general-purpose forecasting helper** (`forecast.service.ts` / `KpiForecaster` / EWMA / linear-regression module). Each domain that wants a forecast must reimplement.

### Frontend integration
- `KPICard` accepts `value`, `change`, `trend` but has **no `mode==='fallback'` indicator**, **no target progress bar**, **no `unset` state** ("—" + tooltip "KPI not yet defined for this tenant").
- Sample pages (`JobAnalyticsPage.tsx`, `GroupAnalyticsPage.tsx`) use **hardcoded literal values** (`"3,200"`, `"+12% vs avg"`, `WEEKLY` array, `SOURCE_PERF` array) — not wired to backend. **Demo data in production UI surfaces.**

### Tests
- Only **2 analytics-related test artefacts**: `tests/load/analytics-python.js` (load) and `tests/playwright/ads-analytics-performance.spec.ts`. Zero coverage for KPI definition/value/forecast/report scheduling/report run/report download.

## 2. Findings

### 🚨 P0 (release blockers)

1. **No KPI definition table or admin surface.** Business goal explicitly requires "super admin to define custom KPIs with title, target type, percentage/number mode, and unset-state behavior" — not implemented anywhere.
2. **`reporting` Nest module missing entirely** despite schema being present. `report_schedules` never tick; `report_runs` never created; PDF/CSV/XLSX/JSON artefacts never produced; recipients (email/webhook/slack) never delivered.
3. **`analytics-rollup` worker is a stub.** `analytics_events` never aggregate into `analytics_metrics_daily`; KPI values never compute; report schedules never enqueue runs; forecast inputs never refresh.
4. **Hardcoded demo data in production analytics pages.** `JobAnalyticsPage.tsx` (FUNNEL/WEEKLY/SOURCE_PERF arrays) and `GroupAnalyticsPage.tsx` (Growth/Content/Engagement Breakdown literals) ship literals, not server data. Cross-cuts the "Supabase/demo data eliminated" checklist row.
5. **No `analytics_metrics_daily` writer.** Schema is dead. Any KPI built on top will read `0` until producers exist.
6. **`'ANALYTICS_CLIENT'` injection token is unvalidated** (same divergence as FD-12 ML) — no Zod envelope on responses, no requestId, no per-endpoint timeout, no fallback-rate metric.
7. **No general forecasting helper.** Each `*.ml.service.ts` reinvents `fallbackForecast`. No shared `ForecastService` (EWMA / Holt-Winters / linear / seasonal-naïve) → inconsistent methods, no backtesting, no MAPE published.
8. **No `unset` state in `KPICard`.** When a tenant has no KPI definition, the card silently shows `0` or `—` with no tooltip explaining "KPI not yet defined".
9. **No KPI target rendering.** Even when `target` is conceptually present, no progress-against-target band on `KPICard` and no breach indicator.
10. **Zero Playwright coverage** for KPI define→render flow, report definition→schedule→run→download flow, forecast surfacing, role-aware summary cards, anomaly notes.
11. **No GDPR/legal posture for report distribution.** `report_schedules.recipients` ship to email/webhook/slack with no DSAR-aware redaction, no per-recipient consent log, no retention policy on `report_runs.artifactUrl`.
12. **No realtime push** for KPI values / dashboards (per `realtime` checklist row); operators see stale numbers until manual refresh.

### P1
13. Only `recruiter-job-management.analytics.service.ts` returns an `anomalyNote`; the other 23 services don't — no consistent anomaly contract.
14. No mobile parity — Flutter has no `KpiCard`/`KpiEnvelope<T>` consumption for the 5 role dashboards.
15. No per-endpoint cache headers / SWR strategy for analytics responses → unnecessary recompute.
16. No `/internal/analytics` operator surface to inspect rollup lag, last-run timestamps, fallback-rate per service.
17. No alerting on report-run failure / schedule miss / rollup lag.
18. `domain-bus.ts` shows analytics events fan-out, but no contract test asserts every write module emits the expected `*.analytics.*` event.
19. No documented SLO (KPI freshness ≤ 15min p95; report run p99 ≤ 60s; rollup lag ≤ 5min).

### P2
20. No experiment / A/B framework for changing KPI definitions safely.
21. No "saved view" of a KPI dashboard with shareable URL + permissions.
22. No CSV export button on every analytics surface (only one `Export` shown in `JobAnalyticsPage.tsx`).

## 3. Run 2 build priorities (FD-13 only)

### A. KPI engine (admin-defined)
1. **DB**: `kpi_definitions(id, tenant_id, scope, key, title, description, target_type{none|absolute|delta|ratio}, value_mode{number|percentage|currency|duration}, target_value numeric, target_window text, unset_state{hidden|dash|zero|tooltip}, formula jsonb, created_by, created_at, updated_at)` + `kpi_values(definition_id, period_start, period_end, value numeric, baseline numeric, target numeric, status{on_track|at_risk|breach|unset}, computed_at)` + `kpi_targets(definition_id, period_start, period_end, target numeric, source{admin|inherited|formula})` + `kpi_subscriptions(definition_id, identity_id, channel)`.
2. **Nest module** `kpi/` — controller (CRUD on definitions, list values, compute-now), service (formula evaluator over `analytics_metrics_daily`), repository, DTO/Zod, guards (super-admin only for create/update; tenant-admin for tenant-scoped overrides), policies, queue producers.
3. **Admin UI** `/internal/admin/kpi` — define/edit KPI, choose target type + value mode + unset-state, preview, attach to dashboards.
4. **`KPICard` upgrade** — render `unsetState` per definition (`hidden|dash|zero|tooltip`), target progress band, breach colour, `mode='fallback'` badge from FD-12, hover for definition + last-computed-at.

### B. Reporting module (make schema live)
5. **Nest module** `reporting/` — controller (CRUD definitions, attach schedules, list runs, download artefact), service, repository, scheduler that wakes `report_schedules` per cron+tz, queue producer for `reports-render`.
6. **Worker** `reports-render` — executes `report_definitions.query`, materialises pdf|csv|xlsx|json, uploads to storage, writes `report_runs.artifactUrl`, dispatches recipients via email/webhook/slack with delivery log.
7. **DSAR/GDPR** — recipient redaction layer; retention on `report_runs.artifactUrl`; per-recipient consent table.

### C. Analytics rollup worker
8. Replace `analytics-rollup` placeholder with real jobs:
   - `events-rollup-daily` → `analytics_metrics_daily` (per metric_key+dimensions).
   - `kpi-recompute-on-rollup` → `kpi_values` for affected definitions.
   - `forecast-refresh` → next-N-period forecast per KPI using shared `ForecastService`.
   - `anomaly-detect` → emit `anomalyNote` event when z-score > threshold.
   - `report-schedule-tick` → enqueue due `reports-render` jobs.

### D. Forecasting helper (shared)
9. `apps/api-nest/src/infra/forecast/forecast.service.ts` exposing `forecast(series, horizon, method?)` with EWMA + linear + seasonal-naïve + Holt-Winters; deterministic fallback; backtest harness in `tests/unit/forecast.spec.ts` reporting MAPE.

### E. Standardise the analytics bridge layer
10. Migrate 24 `*.analytics.service.ts` files from `'ANALYTICS_CLIENT'` token to a shared `AnalyticsClient.withFallback({endpoint,url,body,schema,requestId},fallbackFn)` mirroring FD-12 `MlClient`. Per-endpoint Zod envelope `{data, meta:{model?, latency_ms, fallback?, generatedAt, anomalyNote?}}`.

### F. Eliminate hardcoded demo data
11. `JobAnalyticsPage.tsx` + `GroupAnalyticsPage.tsx` (and any other analytics surface using literal arrays) wire to `useQuery` → server analytics endpoint; remove `FUNNEL`/`WEEKLY`/`SOURCE_PERF`/`Growth`/`Content` literals.

### G. Realtime KPI push
12. `kpi.values.updated` event over Supabase Realtime → invalidate React Query keys on relevant dashboards.

### H. Operator surfaces
13. `/internal/analytics` — rollup lag, last-run per service, fallback-rate, anomaly feed, schedule misses.
14. `/status` adds **Analytics Freshness** + **Reporting Pipeline** rows with SLO tracking.

### I. Tests (≥12 Playwright)
15. `kpi-define-and-render.spec.ts`, `kpi-target-progress.spec.ts`, `kpi-unset-state.spec.ts`, `kpi-percentage-vs-number.spec.ts`, `analytics-rollup-event-to-daily.spec.ts`, `forecast-render-with-mode.spec.ts`, `report-define-schedule-run-download.spec.ts`, `report-recipient-delivery.spec.ts`, `report-failure-recovery.spec.ts`, `dashboard-role-aware-summary.spec.ts` (user/professional/enterprise), `realtime-kpi-push.spec.ts`, `anomaly-note-surfacing.spec.ts`.

### J. Mobile parity
16. Flutter `KpiCard` + `KpiEnvelope<T>` consumed by user/professional/enterprise dashboards with same `unsetState`/`mode` semantics.

### K. Governance
17. `docs/runbooks/analytics-incident.md` — rollup lag breach, KPI compute failure, report-run failure, recipient delivery failure.

## 4. Mapping to Master Sign-Off Matrix
- **Primary**: G03 (Nest backend completeness), G04 (KPI/reporting schema), G12 (analytics/ML).
- **Secondary**: G05 (DSAR on reports), G07 (mobile parity), G09 (Playwright), G13 (runbooks).

## 5. Domain checklist (Run 1 state)

| Validation Item | Tick | Evidence |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages/widgets mapped | ☐ | `KPICard` exists; no unset-state, no target band, demo arrays in pages |
| Backend files & APIs complete | ☐ | 24 `*.analytics.service.ts` ✅; **no `kpi/` module, no `reporting/` module** |
| Supabase/demo data eliminated | ☐ | Literal `FUNNEL`/`WEEKLY`/`SOURCE_PERF`/Growth/Content arrays in production pages |
| DB schema, seeders, fixtures | ☐ | `reporting.ts` + `analytics_metrics_daily` ✅; **no kpi_definitions/values/targets/subscriptions** |
| ML/analytics/workers integrated | ☐ | `analytics-rollup` worker is a stub; no forecast helper |
| Indexing/search/filter logic | n/a | — |
| Realtime / live data | ☐ | No KPI realtime push |
| Security & middleware | ☐ | `'ANALYTICS_CLIENT'` token unvalidated; no DSAR on reports |
| Playwright coverage | ☐ | 1 spec (ads-analytics-performance) for entire domain |
| Mobile parity | ☐ | No Flutter KpiCard / dashboard parity |
| Acceptance criteria | ☐ | Pending Run 2 + Run 4 |

## 6. Acceptance criteria (binding)
- A1. `kpi_definitions/values/targets/subscriptions` tables shipped with RLS + admin-only mutation.
- A2. `kpi/` Nest module live with CRUD + compute-now + Zod envelope + tests.
- A3. `/internal/admin/kpi` admin surface lets super-admin define KPI with title + target_type + value_mode + unset_state and preview live.
- A4. `KPICard` renders unset-state + target progress + breach colour + fallback badge + last-computed-at hover.
- A5. `reporting/` Nest module + `reports-render` worker execute `report_schedules` end-to-end (define→schedule→run→artefact→deliver) with 4 formats (pdf/csv/xlsx/json).
- A6. `analytics-rollup` worker runs ≥5 concrete jobs (events-rollup-daily, kpi-recompute-on-rollup, forecast-refresh, anomaly-detect, report-schedule-tick).
- A7. Shared `ForecastService` with ≥3 methods + backtest MAPE published.
- A8. 24 `*.analytics.service.ts` migrated to `AnalyticsClient.withFallback` + Zod envelope + requestId.
- A9. Hardcoded demo arrays removed from `JobAnalyticsPage.tsx` + `GroupAnalyticsPage.tsx` + any other analytics surface; data sourced from Nest.
- A10. Realtime KPI push proven on user/professional/enterprise dashboards.
- A11. `/internal/analytics` operator surface live; `/status` Analytics Freshness + Reporting Pipeline rows live.
- A12. ≥12 Playwright specs in `tests/playwright/analytics/` covering define/render/forecast/report/realtime/anomaly.
- A13. Flutter `KpiCard` + `KpiEnvelope<T>` parity on dashboards.
- A14. `docs/runbooks/analytics-incident.md` published.
- A15. DSAR-aware report distribution + retention policy documented.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._

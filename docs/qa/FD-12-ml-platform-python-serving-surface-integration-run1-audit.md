# FD-12 — ML Platform, Python Model Serving & ML Surface Integration — Run 1 Audit

Date: 2026-04-18 · Group: G4 · Maps to **Master Sign-Off Matrix → G03 (backend), G04 (data), G05 (security/abuse), G09 (Playwright), G12 (analytics/ML), G13 (runbooks)**.

> Scope: prove there is a real ML platform (Python service that actually runs in prod), 25+ Nest `*.ml.service.ts` bridges all wired to it with timeouts + deterministic fallbacks + envelope validation + observability, every ML output mapped to a concrete UI surface, ML-batch worker queue doing real work, and Playwright proving consumed outputs.

## 1. Inventory snapshot

### Python service — `apps/analytics-python/`
- FastAPI app (`apps/analytics-python/app/main.py`) wires **60+ routers** (shell, marketing, identity, entitlements, search, overlays, notifications, settings, feed, network, profiles, companies, agency, groups, events, trust, inbox, calls, booking, media, podcasts, jobs_browse, webinars, jobs_studio, job_applications, recruiter_jobs, interview_planning, proposal_review_award, contracts_sow_acceptance, project_workspaces_handover, calendar, seller_performance_availability, services_catalogues, user_dashboard, client_dashboard, recruiter_dashboard, agency_management_dashboard, enterprise_dashboard, org_members_seats, shared_workspaces_collaboration, resource_planning_utilization, wallet_credits_packages, billing_invoices_tax, payouts_escrow_finops, ads_manager_builder, ads_analytics_performance, map_views_geo_intel, donations_purchases_commerce, pricing_promotions_monetization, internal_admin_login_terminal, internal_admin_shell, customer_service, finance_admin, dispute_ops, moderator_dashboard, trust_safety_ml, ads_ops, verification_compliance, super_admin_command_center, enterprise_connect, networking_events_groups, sales_navigator, launchpad_studio_tasks_team) ✅.
- Deps: `fastapi`, `uvicorn[standard]`, `pydantic>=2.8`, `pandas`, `numpy`, `duckdb`, `asyncpg`, `structlog`, `prometheus-client` ✅ — solid analytics stack.
- `_obs.py` provides `install_observability(app)` + `payload_guard` + `track` decorators ✅ (Prometheus + structlog).
- Inspected handlers (`search.py`, `trust_safety_ml.py`, `recruiter_dashboard.py`) are **rule-based deterministic functions** — no scikit-learn / xgboost / sentence-transformers / torch / onnxruntime imports anywhere → there is **no actual model serving**, only typed business rules dressed as ML. The "ML platform" is a Python rules engine.

### NestJS bridges — `apps/api-nest/src/modules/**/*.ml.service.ts`
- **25 `*.ml.service.ts` files** ✅: booking, calls, candidate-availability-matching, companies, enterprise-hiring-workspace, feed, gigs-browse, groups, interview-planning, job-application-flow, job-posting-studio, jobs-browse, media-viewer, network, notifications, podcasts, profiles, project-posting-smart-match, projects-browse-discovery, proposal-builder-bid-credits, proposal-review-award, recruiter-job-management, search, trust, webinars.
- **22 `*.analytics.service.ts` files** ✅ paralleling the ML services (BI/dashboard insights side).
- Inspected exemplars:
  - `recruiter-job-management.ml.service.ts` ✅ — strong pattern: `@Optional() @Inject('ML_CLIENT')`, **600ms** `Promise.race` timeout, **deterministic fallback** (`fallbackPriority`/`fallbackForecast`), `mode: 'ml' | 'fallback'` flag in response. **Best-in-class template.**
  - `feed.ml.service.ts` ✅ — uses **shared `MlClient` from `infra/ml-client`** with `withFallback({endpoint,url,body,schema,requestId},fallbackFn)`, **Zod envelope validation** (`{data, meta:{model,version,latency_ms,fallback?}}`), `requestId` correlation. Reads base URL from `process.env.ML_PY_URL ?? 'http://localhost:8001'`.

### Workers — `apps/workers/src/index.ts`
- `ml-batch` queue **registered ✅** but handler is `async (d) => { log.info({d},'ml-batch'); return {ok:true}; }` — **placeholder, does no real work** (cross-cuts FD-09 audit on stub workers).

### Frontend
- Grep for `recommend|MatchScore|matchScore|riskScore|fraudScore|aiSuggest` only finds 2 hits (`LaunchpadShell.tsx`, `AdvancedFilterPanel.tsx`). Either ML scores are not surfaced under those naming conventions, or they live inside hooks/page-level renderers and are not visually labelled.
- No grep hits for `meta.fallback`/`mode==='fallback'` UI handling → users likely see fallback values without any "best-effort" indicator.

### Tests
- `tests/load/ml-python.js` ✅ (load test).
- `tests/playwright/project-posting-smart-match.spec.ts` + `tests/playwright/trust-safety-ml.spec.ts` ✅ — **only 2 ML Playwright specs** for 25 bridges.

### Configuration / process model
- **No `Dockerfile`** in `apps/analytics-python/` → no proven container build, no health-check directive, no readiness/liveness probe defined, no documented prod process model. The service is uvicorn-from-source only.
- No env variable catalogue (`ML_PY_URL`, timeout budgets, prometheus scrape path, etc.) in any consolidated `.env.example` for the Python service.

## 2. Findings

### 🚨 P0 (release blockers)

1. **Two-tier ML client wiring is inconsistent.** `feed.ml.service.ts` uses the canonical `infra/ml-client.ts` `MlClient.withFallback({schema,…})` with **Zod envelope validation + requestId correlation**, while `recruiter-job-management.ml.service.ts` injects an unvalidated `'ML_CLIENT'` token with `Promise.race` and no envelope schema. Across 25 `*.ml.service.ts` files there are at least two — likely three — competing patterns. Standardise on `MlClient.withFallback` so every consumer enforces Zod validation + observability.
2. **`ml-batch` worker is a placeholder.** Long-running batch jobs (nightly re-rank, embedding generation, fraud-model precompute, recommendation precompute, dead-letter ML retries) silently no-op. Either delete the queue or implement.
3. **No actual model serving.** Despite being called "ML", every Python handler I sampled is a deterministic rules function. There is no scikit-learn/xgboost/onnxruntime/torch/sentence-transformers anywhere; no model registry, no `/models` listing, no model versioning, no A/B framework. The platform claim cannot be made until at least one real model (e.g. embeddings for search/feed/match) is deployed and exercised.
4. **No Dockerfile / process model for `apps/analytics-python/`.** Cannot deploy reproducibly. No documented uvicorn worker count, no `/health` and `/ready` endpoints proven, no Prometheus scrape contract.
5. **Cross-service mismatch on default port.** `feed.ml.service.ts` defaults to `http://localhost:8001`; some Python deployments default uvicorn to `:8000`. With no central config there will be silent fallback in dev and prod outages on first deploy.
6. **`ML_PY_URL` not enforced via Zod-validated env config** (cross-cuts FD-07 secret/env hygiene). Missing var → `localhost:8001` in production = always-fallback mode with no alert.
7. **Only 2 Playwright specs cover 25 ML bridges.** Smart-match + trust-safety only. No coverage for feed-rank, jobs-browse-rank, gigs-browse-rank, recruiter-priority/forecast, candidate-availability-matching, profiles-similar, network-suggestions, notifications-prioritisation, media-viewer-recommend, podcasts-rank, webinars-rank, interview-planning, project-posting-smart-match end-to-end, proposal-review-scoring, search-rerank, companies-similar, groups-suggest, enterprise-hiring-workspace-funnel, calls-summarisation, booking-availability-rank, job-application-flow-screening, job-posting-studio-suggest.
8. **No `mode==='fallback'` surfacing in UI.** When ML times out (600ms) or returns invalid envelope, users see fallback values without a label. For high-stakes surfaces (recruiter priority, fraud risk, match score, abuse moderation), this is misleading; for moderation/abuse/risk it is potentially safety-critical.
9. **No moderation/abuse/risk model loop.** Business goal explicitly lists "moderation, abuse/risk". `trust_safety_ml.py` is a rules-based insight builder over operator metrics, not a content classifier. There is no toxicity/NSFW/spam/PII model in the request path for messages, posts, media, or proposals.
10. **No model registry / version pinning / shadow-mode.** Cannot roll out v2 of any scorer safely; cannot run shadow evaluations against live traffic; cannot answer "which model produced this score?" for compliance/audit.
11. **No GDPR/legal posture for ML inputs.** No documented exclusion of special-category fields from request bodies; no PII redaction at the bridge layer; no retention policy on `analytics-python` request logs.

### P1
12. 600ms timeout is hard-coded per-service. Centralise per-endpoint budgets via `MlClient` config (e.g. `feed.rank: 250ms`, `recruiter.forecast: 800ms`, `trust.classify: 200ms`).
13. No per-endpoint concurrency / circuit breaker on `MlClient` → a slow Python deploy will starve Nest event loop.
14. No SLO published (e.g. ML p99 latency budget, fallback-rate budget < 0.5%).
15. `_obs.py` is duplicated between `apps/analytics-python/app/_obs.py` and `apps/ml-python/app/_obs.py` (per docstring) — drift risk; consolidate to a shared package.
16. Front-end has no global "AI inference status" indicator on `/status` page (cross-cuts `system-status-page` memory).
17. No mobile parity for ML-driven surfaces (Flutter feed/jobs/gigs/match) — per `mobile-screens-mandate`.
18. No cost telemetry per ML endpoint (token count when LLM is used; CPU-seconds when rules engine).
19. No request-id propagation from edge → Nest → Python → response → log line for end-to-end tracing of a single ML decision.
20. No "explainability" hook: scores returned without `reasons[]` for surfaces where users/recruiters need justification (e.g. why this candidate ranked high).

### P2
21. No batch job for cold-start embedding generation (so the moment vectors land, every entity is searchable).
22. No drift detection (input feature distribution vs training distribution) — relevant once real models exist.
23. No experiment framework (split traffic, ramped rollout) for ML changes.

## 3. Run 2 build priorities (FD-12 only)

### A. Standardise the bridge layer
1. Promote `apps/api-nest/src/infra/ml-client.ts` to **the only** way to call Python; deprecate `'ML_CLIENT'` injection token. Migrate the 24 non-feed `*.ml.service.ts` files to `MlClient.withFallback({endpoint,url,body,schema,requestId},fallbackFn)` with per-endpoint Zod schemas and per-endpoint timeout budgets.
2. Codify the response envelope `{data, meta:{model, version, latency_ms, fallback?, requestId}}` in `packages/shared/src/ml-envelope.ts` consumed by Nest + Flutter.

### B. Real model serving
3. Add `apps/ml-python/` (or extend `analytics-python`) with at least one real model surface backed by a vector library:
   - Embedding model (sentence-transformers MiniLM or ONNX equivalent) exposed at `POST /embed`.
   - Job↔candidate matcher backed by cosine similarity over embeddings + structured features.
   - Toxicity/NSFW classifier exposed at `POST /moderation/classify` consumed by inbox + posts + proposals + media moderation paths.
4. Ship a tiny **model registry**: `model_registry(name, version, sha256, deployed_at, shadow_of_version)` table + `/models` listing endpoint. Every ML response carries `meta.model` + `meta.version` from this registry.
5. Shadow-mode runner that calls v_next in parallel to v_live, logs deltas, never returns shadow output to clients.

### C. Moderation/abuse/risk integration
6. New Nest module `moderation` with `*.ml.service.ts` calling the Python classifier; per-write hook on inbox messages, posts, proposals, profiles, media uploads. Outputs `{verdict, scores:{toxic,sexual,violence,spam,pii}, mode}` stored on the entity row + emitted to Trust & Safety queue when over threshold.
7. New Nest module `risk` consolidating `identity/risk.service.ts` with payment/abuse signals; outputs `{riskScore 0-100, reasons[], mode}` consumed by checkout, payouts, signup velocity guard.

### D. Workers do real work
8. Replace `ml-batch` placeholder with concrete jobs: `embed-backfill`, `recommend-precompute-daily`, `feed-cold-start-rank`, `moderation-rescan`, `risk-rescore-on-signal`, `model-shadow-eval`, `dead-letter-ml-retry`.

### E. Process / deployment
9. `apps/analytics-python/Dockerfile` (multi-stage, slim base, non-root user) + `/health` (liveness) + `/ready` (warm-up complete) endpoints + Prometheus `/metrics` scrape contract documented.
10. Zod-validated env config (`ML_PY_URL`, `ML_PY_TIMEOUT_MS`, `ML_FALLBACK_ALERT_THRESHOLD`) per FD-07.

### F. Observability + UI surfacing
11. Every ML response includes `meta.requestId`; Nest middleware propagates it; Python `_obs.py` logs it; one trace ID survives from edge to model and back.
12. New shared component `<MlBadge mode={'ml'|'fallback'} model={…} version={…} />` rendered next to every score on recruiter, fraud, match, moderation surfaces. Fallback shows a discreet "best-effort" indicator with a tooltip.
13. `/status` adds **AI Inference** row showing live fallback rate, p99 latency, last successful inference per endpoint.
14. `/internal/ml` admin page listing each `*.ml.service.ts`, last 1k call summary, fallback rate, p50/p95/p99, registered model+version, shadow comparisons.

### G. Tests
15. Playwright suite `tests/playwright/ml/`:
    - `feed-rank.spec.ts` (real ranking + forced timeout fallback)
    - `recruiter-priority-forecast.spec.ts`
    - `candidate-availability-matching.spec.ts`
    - `job-applications-screening.spec.ts`
    - `proposal-review-scoring.spec.ts`
    - `moderation-classify.spec.ts` (toxic + clean + threshold escalation)
    - `risk-checkout-block.spec.ts`
    - `media-viewer-recommend.spec.ts`
    - `search-rerank.spec.ts` (cross-cuts FD-11)
    - `model-registry-version.spec.ts`
    - `shadow-mode-no-leak.spec.ts`
    - `mlbadge-fallback-indicator.spec.ts`
16. Contract tests in `apps/api-nest/test/ml/*.spec.ts` for every Zod envelope + fallback path.

### H. Mobile parity
17. Flutter screens consume `MlEnvelope<T>` with the same `mode` indicator (feed, jobs, gigs, candidate-match) and render an equivalent `MlBadge`.

### I. Governance
18. Documented PII redaction layer in `MlClient` strips email/phone/address/IBAN before egress to Python.
19. Retention policy for `analytics-python` request logs (≤30 days raw, ≥1 year aggregates).
20. Runbook `docs/runbooks/ml-incident.md` — when fallback rate breaches budget, when latency breaches SLO, when shadow eval flags drift, when moderation backlog spikes.

## 4. Mapping to Master Sign-Off Matrix
- **Primary**: G03 (backend bridges), G05 (moderation/abuse/risk), G09 (Playwright), G12 (analytics/ML).
- **Secondary**: G04 (model registry data), G07 (mobile parity), G13 (runbooks).

## 5. Domain checklist (Run 1 state)

| Validation Item | Tick | Evidence |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend surfaces mapped | ☐ | ML scores not labelled in UI; no `MlBadge` |
| Backend files & APIs complete | ☐ | 25 `*.ml.service.ts` ✅; 2 inconsistent client patterns; no model registry |
| Supabase/demo data eliminated | ☑ | None in this domain |
| DB schema, seeders, fixtures | ☐ | No `model_registry`/`ml_call_log`/`moderation_verdicts`/`risk_scores` tables |
| ML/analytics/workers integrated | ☐ | `ml-batch` is placeholder; no real model in Python |
| Indexing/search/filter logic | n/a | Cross-cuts FD-11 |
| Realtime / live data | ☐ | No live ML status on `/status` |
| Security & middleware | ☐ | No PII redaction at bridge; no envelope validation in 24/25 services |
| Playwright coverage | ☐ | 2/25 bridges covered |
| Mobile parity | ☐ | No Flutter ML surfacing of mode/badge |
| Acceptance criteria | ☐ | Pending Run 2 + Run 4 |

## 6. Acceptance criteria (binding)
- A1. All 25 `*.ml.service.ts` files migrated to `MlClient.withFallback` with Zod schemas + per-endpoint timeout budgets + requestId propagation.
- A2. `apps/analytics-python/Dockerfile` + `/health` + `/ready` + `/metrics` shipped; ECS/Worker manifest documented.
- A3. At least one real model deployed (embeddings + cosine matcher OR moderation classifier) and consumed in prod path.
- A4. `model_registry` table + `/models` endpoint live; every ML response carries `meta.model`+`meta.version` from the registry.
- A5. New `moderation` Nest module wired into messages/posts/proposals/profiles/media write paths; verdicts persisted; over-threshold cases land in T&S queue.
- A6. New `risk` Nest module returns scored decisions for checkout + payouts + signup; visible in admin terminal.
- A7. `ml-batch` worker performs ≥4 concrete jobs (embed-backfill, recommend-precompute, moderation-rescan, model-shadow-eval).
- A8. `<MlBadge>` rendered on every score-bearing surface; fallback mode visually distinct.
- A9. `/status` AI Inference row live; `/internal/ml` operator page live with per-endpoint fallback rate + latency.
- A10. ≥12 Playwright specs in `tests/playwright/ml/` covering ranking + matching + moderation + risk + shadow-mode + fallback indicator.
- A11. Flutter parity: `MlEnvelope<T>` consumed with badge on feed/jobs/gigs/candidate-match.
- A12. PII redaction proven in `MlClient` integration tests; retention policy documented.
- A13. `docs/runbooks/ml-incident.md` published.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._

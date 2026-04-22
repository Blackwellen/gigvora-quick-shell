# D09 — Jobs Marketplace, Posting Studio, Applications & Candidate Intake — Run 1 Audit

Date: 2026-04-18 · Group: G3 · Status: Run 1 (Audit) complete.

## Scope coverage
- **Frontend** (`src/pages/jobs/`, 13 files): `JobsPages` (888 LOC marketplace hub), `JobDetailPage` (543), `JobCreatePage` (211 — Posting Studio entry), `JobApplicantsCenterPage`, `JobScreeningPage`, `JobAnalyticsPage`, `JobArchivePage`, `JobDistributionPage`, `JobTemplatesPage`, `JobWorkspacePage`, `HiringTeamPage`, `CandidateAvailabilityPage`, `ApplicationTrackerPage` (979 LOC).
- **Backend** (4 NestJS modules, all complete with controller + service + repository + ml + analytics + dto):
  - `jobs-browse` — discovery
  - `job-posting-studio` — full CRUD + submit/decision/publish/pause/resume/archive + quality + moderate + approvals + **credits packs/balance/purchases/confirm** + insights
  - `job-application-flow` — application lifecycle
  - `candidate-availability-matching` — slot matching (ships an `.emit.ts` for the domain bus)
- **SDK** ✅ all four: `jobs-browse.ts`, `job-posting-studio.ts`, `job-application-flow.ts`, `candidate-availability-matching.ts`.
- **ML** ✅ all four Python services: `jobs_browse.py`, `jobs_studio.py`, `job_applications.py`, `recruiter_jobs.py`.
- **Seeders** ✅ `0020_seed_job_application_flow.sql`, `0021_seed_job_posting_studio.sql`, `0022_seed_jobs_browse.sql`, `0017_seed_candidate_availability_matching.sql`.
- **Migrations** ❌ — `database/migrations/` contains **only 15 foundational files (0001–0015)**; **no jobs/applications/credits DDL is checked in**, even though seeders reference these tables.

## Endpoint inventory (highlights, ≥39 endpoints across the 3 main controllers)
- **job-posting-studio** `/api/v1/job-posting-studio`: jobs CRUD, `:id/{quality,moderate,submit,decision,publish,pause,resume,archive}`, `approvals` queue, **credits**: `packs`, `balance`, `purchases` (POST/list), `purchases/:id/confirm`, `insights`.
- **jobs-browse**, **job-application-flow**, **candidate-availability-matching** controllers all present (counted as part of the 39).

## Gaps (18 total — 6 P0 / 6 P1 / 5 P2 / 1 P3)

### P0 — blockers
1. **No DDL for jobs domain.** `database/migrations/` stops at `0015_foundation.sql`. Seeders 0017–0022 reference `jobs`, `job_applications`, `job_credits_*`, `candidate_availability_*` tables that have no checked-in `CREATE TABLE` migration. Production deploy will fail; tests cannot run cleanly.
2. **`JobsPages.tsx` (888 LOC) mock-driven.** Imports `MOCK_JOBS` + an in-file `MOCK_ALERTS`; uses `react-router-dom`. No `sdk.jobsBrowse.*` consumption despite full backend.
3. **`JobDetailPage.tsx` (543 LOC) mock-driven.** Imports `MOCK_JOBS` + `MOCK_FIT`; on `react-router-dom`; no SDK calls.
4. **`ApplicationTrackerPage.tsx` (979 LOC) mock-driven.** Defines `MOCK_SCREENING` + `MOCK_APPS` in-file; on `react-router-dom`; no `sdk.jobApplicationFlow.*` calls.
5. **`JobCreatePage.tsx`** — Posting Studio entry point uses `react-router-dom`; needs verification it implements the 10-step `commercial-builders` wizard with draft-save against `POST /job-posting-studio/jobs` + submit/publish flow.
6. **No payment/credits wiring.** Posting Studio exposes `credits/packs`, `purchases`, `purchases/:id/confirm` but no Stripe/Paddle checkout integration is wired from `JobCreatePage` → `apps/integrations/src/payments/stripe.ts`. Job posting cannot be monetised end-to-end.

### P1
7. **No WebSocket gateway** for jobs-browse (live job alerts), job-posting-studio (approval queue updates), job-application-flow (status transitions). `grep WebSocketGateway` returns zero hits across all four modules.
8. **OpenSearch indexer**: confirm `apps/search-indexer/src/index.ts` indexes jobs + supports saved searches & alerts (A5).
9. **Workers**: no visible job-posting expiry/auto-archive/credit-refund/alert-fanout consumers in `apps/workers/src/index.ts`.
10. **`JobApplicantsCenterPage` (72 LOC), `JobScreeningPage` (87 LOC)** — small enough to be skeletons; verify they actually render data tabs vs. placeholders.
11. **`HiringTeamPage`, `JobAnalyticsPage`, `JobArchivePage`, `JobDistributionPage`, `JobTemplatesPage`, `JobWorkspacePage`** — confirm none import `react-router-dom` or `MOCK_*` (full sweep needed).
12. **Resume/CV upload + parsing** for applications: no visible storage upload + parsing pipeline (parser worker, `apps/media-pipeline/src/index.ts` may help) wired to application submission.

### P2
13. **Mobile parity**: `apps/mobile-flutter/lib/features/recruiter_job_management/` exists; missing `jobs_browse`, `job_application_flow`, `candidate_availability_matching` Flutter features.
14. **Domain-bus events**: `candidate-availability-matching.emit.ts` exists; verify `job-application-flow` and `job-posting-studio` also emit (and that `feed`/`notifications` consume).
15. **No-index posture** for private hiring surfaces (`JobApplicantsCenterPage`, `JobAnalyticsPage`, `HiringTeamPage`, `JobScreeningPage`, `ApplicationTrackerPage`).
16. **A8 player coverage**: video/voice screening response playback not validated for `JobScreeningPage`.
17. **Eligibility/blocker rules**: confirm `application-flow` handles location/visa/skill-gap blockers + screener gating.

### P3
18. `JobsPages` (888), `JobDetailPage` (543), `ApplicationTrackerPage` (979) monoliths — extract per-tab files matching profile/agency pattern.

## Domain completion matrix (Run 1 status)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- File evidence: `src/pages/jobs/{JobsPages,JobDetailPage,JobCreatePage,ApplicationTrackerPage,...}.tsx`, `apps/api-nest/src/modules/{jobs-browse,job-posting-studio,job-application-flow,candidate-availability-matching}/*`, `apps/ml-python/app/{jobs_browse,jobs_studio,job_applications,recruiter_jobs}.py`, `packages/sdk/src/{jobs-browse,job-posting-studio,job-application-flow,candidate-availability-matching}.ts`, `database/seeders/00{17,20,21,22}_*.sql`, `apps/integrations/src/payments/stripe.ts`.
- No browser/test evidence captured this run.

## Recommended Run 2 (build) priorities
1. Add `database/migrations/0089_jobs_applications_credits.sql` consolidating jobs, job_versions, job_screener_questions, job_applications, application_events, candidate_availability, job_credit_packs, job_credit_balances, job_credit_purchases, job_alerts, saved_jobs.
2. Rewrite `JobsPages.tsx` against `sdk.jobsBrowse.*` (filters, saved jobs, alerts) — drop `MOCK_JOBS` + `react-router-dom`.
3. Rewrite `JobDetailPage.tsx` against `sdk.jobsBrowse.detail` + fit scoring via ML — drop `MOCK_JOBS` / `MOCK_FIT`.
4. Rewrite `ApplicationTrackerPage.tsx` against `sdk.jobApplicationFlow.*` — drop `MOCK_*`.
5. Wire `JobCreatePage.tsx` Posting Studio wizard end-to-end: draft-save → submit → credits-purchase via Stripe → publish.
6. Add gateways: `jobs-browse.gateway.ts` (alerts), `job-application-flow.gateway.ts` (status), `job-posting-studio.gateway.ts` (approvals).
7. Add OpenSearch jobs indexer + saved-search consumer; add worker for job-expiry, alert-fanout, credit reconciliation.

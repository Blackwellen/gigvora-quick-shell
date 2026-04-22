# D10 — Recruiter Pro, Talent Search, Pipelines, Interviews & Hiring Workspaces — Run 1 Audit

Date: 2026-04-18 · Group: G3 · Status: Run 1 (Audit) complete.

## Scope coverage
- **Frontend** — `src/pages/recruiter/` (21 pages) + `src/pages/hire/` (6 pages):
  - Recruiter: ProHome, Pro, Management, JobWorkspace, Jobs (938 LOC), TalentSearch (794), TalentPools, Pipeline (617), Interviews (698), Scorecards, MatchCenter, Offers, Outreach, OutreachTemplates, CandidateNotes, CandidateSearch, HiringTeam, Analytics, Billing, Seats, Settings.
  - Hire (`/hire` unified namespace per `mem://features/recruitment-unification`): CommandCenter, JobCreate, Scorecards, Settings, TalentPools, Team.
- **Backend (5 NestJS modules)** — all complete (controller + service + repository + ml/analytics + dto):
  - `recruiter-job-management`, `recruiter-dashboard`, `sales-navigator` (Talent Navigator), `interview-planning`, `enterprise-hiring-workspace`.
- **ML** ✅ `recruiter_jobs.py`, `recruiter_dashboard.py`, `interview_planning.py`. ❌ no `sales_navigator.py` or `enterprise_hiring_workspace.py`.
- **SDK** ✅ `recruiter-job-management.ts`, `sales-navigator.ts`, `interview-planning.ts`. ❌ **missing `recruiter-dashboard.ts`, `enterprise-hiring-workspace.ts`**.
- **Seeders** ✅ `0018_seed_enterprise_hiring_workspace.sql`, `0019_seed_interview_planning.sql`, `0049_seed_recruiter_job_management.sql`. ❌ no seeders for `sales-navigator` or `recruiter-dashboard`.
- **Migrations** ❌ — `database/migrations/` still stops at 0015. **Zero recruiter/talent/pipeline/interview/hiring-workspace DDL is checked in**, although seeders reference these tables.

## Endpoint inventory (≥90 endpoints across the 5 controllers)
- **enterprise-hiring-workspace**: workspaces CRUD + transition + bulk + members (incl. bulk + remove), **chain-templates** (versioned approval flows + publish/archive), **approval-requests** (CRUD + decision + cancel). Deep enterprise governance surface.
- **interview-planning**: panels CRUD + status, interviews CRUD + transition/reschedule/rsvp, scorecards (get/submit/withdraw).
- **recruiter-job-management** / **recruiter-dashboard** / **sales-navigator**: full controllers present.

## Gaps (22 total — 7 P0 / 8 P1 / 6 P2 / 1 P3)

### P0 — blockers
1. **No DDL for the entire D10 domain.** `database/migrations/` ends at `0015_foundation.sql`; seeders 0018/0019/0049 reference recruiter/interview/workspace tables with no `CREATE TABLE` migrations checked in. Production deploy and integration tests cannot run cleanly.
2. **Missing SDK modules**: `packages/sdk/src/{recruiter-dashboard,enterprise-hiring-workspace}.ts` — UI cannot type-safely consume the dashboard or the largest enterprise governance surface (workspaces, chain-templates, approval-requests).
3. **`RecruiterJobsPage.tsx` (938 LOC) mock-driven** (21 mock/router hits) — no `sdk.recruiterJobManagement.*` wiring despite full backend.
4. **`RecruiterTalentSearchPage.tsx` (794 LOC) mock-driven** (33 hits) — no `sdk.salesNavigator.*` (Talent Navigator) wiring.
5. **`RecruiterInterviewsPage.tsx` (698 LOC)** still on `react-router-dom`; needs full wiring to `sdk.interviewPlanning.*` (panels/interviews/scorecards) — confirm not silently mocked.
6. **`RecruiterPipelinePage.tsx` (617 LOC)** still on `react-router-dom`; pipeline columns/cards/stage transitions need to come from `recruiter-job-management` endpoints, not mocks.
7. **No WebSocket gateways** for any of the 5 modules — pipeline drag/drop, interview lobby joins, RSVP changes, approval-request decisions, and hiring-team collaboration cannot be realtime. `grep WebSocketGateway` returns zero hits.

### P1
8. `RecruiterOutreachPage` (114), `RecruiterOutreachTemplatesPage`, `RecruiterScorecardsPage` (97) — small files; verify they actually render data tabs and consume SDK rather than acting as placeholders.
9. **No connector for outreach delivery** — recruiter outreach (email + InMail) lacks a wired SendGrid + LinkedIn/Apollo/CRM connector path through `apps/integrations/src/`.
10. **No interview video infra** — `interview-planning` should issue Jitsi (`apps/integrations/src/voice/jitsi.ts`) meeting handles via the `CalendarService` (D07-flagged) on transition; not wired.
11. **No CRM/ATS sync** — enterprise hiring workspaces typically sync to Greenhouse/Lever/Workday; no connector visible in `apps/integrations/src/`.
12. **No OpenSearch indexer** for talent/candidate search in `apps/search-indexer/src/index.ts` — `RecruiterTalentSearchPage` and `RecruiterCandidateSearchPage` cannot scale to enterprise corpus (A5).
13. **No ML services** for `sales_navigator` or `enterprise_hiring_workspace` (ranking, lookalike search, approval-chain risk scoring). Endpoints exist but ML is absent.
14. **No workers** for: outreach-send queue, interview-reminder, scorecard-due-nudge, approval-request-escalation, pipeline-stage-aging in `apps/workers/src/index.ts`.
15. **Privacy & no-index posture** — D10 surfaces are recruiter-private (per `mem://features/privacy-and-trust`); confirm `usePageMeta` sets `noindex` and that interview/scorecard data is never exposed on candidate-facing routes.

### P2
16. **Mobile parity** — only `apps/mobile-flutter/lib/features/recruiter_job_management/` exists; missing `sales_navigator`, `interview_planning`, `enterprise_hiring_workspace`, `recruiter_dashboard`, and the unified `/hire` namespace.
17. **A8 player** — interview recording + replay timeline not validated for `RecruiterInterviewsPage`.
18. **/hire vs /recruiter** — both namespaces exist; per `mem://features/recruitment-unification` they should be unified under `/hire`. Confirm route table strategy and avoid duplicate UI implementations of the same feature.
19. **Domain-bus emit** — confirm interview-planning, recruiter-job-management, enterprise-hiring-workspace emit events consumed by `notifications` and `feed`.
20. **Entitlements** — Recruiter Pro / Team / Enterprise tiers (per `mem://features/access-gating`) — confirm `EntitlementGate` wraps RecruiterPro home, TalentSearch, Seats, Billing, EnterpriseHiringWorkspace.
21. **Audit trail** — enterprise approval-requests should write to `super-admin` audit log; verify writer hooks.

### P3
22. `RecruiterJobsPage` (938), `RecruiterTalentSearchPage` (794), `RecruiterInterviewsPage` (698), `RecruiterPipelinePage` (617) monoliths — extract per-tab files matching the established pattern.

## Domain completion matrix (Run 1 status)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- File evidence: `src/pages/recruiter/*` (21 files), `src/pages/hire/*` (6), `apps/api-nest/src/modules/{recruiter-job-management,recruiter-dashboard,sales-navigator,interview-planning,enterprise-hiring-workspace}/*`, `apps/ml-python/app/{recruiter_jobs,recruiter_dashboard,interview_planning}.py`, `packages/sdk/src/{recruiter-job-management,sales-navigator,interview-planning}.ts`, `database/seeders/00{18,19,49}_*.sql`.
- No browser/test evidence captured this run.

## Recommended Run 2 (build) priorities
1. Add `database/migrations/0090_recruiter_pipeline_interviews_hiring_workspaces.sql` covering: talent_pools, talent_pool_members, candidate_notes, recruiter_outreach_*, recruiter_seats, pipelines, pipeline_stages, candidates_in_pipeline, panels, interviews, scorecards, hiring_workspaces, workspace_members, approval_chain_templates, approval_requests, approval_decisions.
2. Create `packages/sdk/src/{recruiter-dashboard,enterprise-hiring-workspace}.ts`, export from `index.ts`.
3. Rewrite `RecruiterJobsPage`, `RecruiterTalentSearchPage`, `RecruiterPipelinePage`, `RecruiterInterviewsPage` against their respective SDK modules; drop `MOCK_*` + `react-router-dom`.
4. Add gateways: `interview-planning.gateway.ts` (RSVP/lobby/transitions), `recruiter-job-management.gateway.ts` (pipeline drag/drop), `enterprise-hiring-workspace.gateway.ts` (approval decisions).
5. Wire interview-planning → `CalendarService` for Jitsi meeting handles on `interviews/:id/transition`.
6. Add `apps/ml-python/app/{sales_navigator,enterprise_hiring_workspace}.py` for ranking/risk scoring.
7. Add OpenSearch talent indexer + worker queue consumers for outreach, reminders, approval-escalation.
8. Decide and document `/hire` vs `/recruiter` unification; redirect duplicates.

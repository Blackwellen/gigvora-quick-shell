# D11 — Projects, Proposals, Contracts, Workspaces, Tasks & Approvals — Run 1 Audit

Date: 2026-04-18 · Group: G3 · Status: Run 1 (Audit) complete.

## Scope coverage
- **Frontend** — `src/pages/projects/` (20 pages, ~6,400 LOC) + `src/pages/contracts/`. Highlights:
  - Discovery: `ProjectsBrowsePage` (688 LOC), `MyProjectsPage`, `ProjectArchivePage`, `ProjectTemplatesPage`.
  - Posting/Smart-match: `ProjectCreatePage` (431 LOC).
  - Proposals: `ProposalSubmissionPage` (791), `ProposalReviewAwardPage` (622).
  - Execution: `ProjectWorkspacePage` (1277 LOC — monolith), `ProjectDetailPage` (430), `ProjectDashboardPage`, `WorkHubPage`.
  - Tasks: `TaskBoardPage` (867), `ProjectTaskTablePage`, `ProjectTimelinePage`.
  - Milestones/Approvals/Deliverables: `ProjectMilestonesPage`, `ProjectApprovalsPage`, `ProjectDeliverablesPage`, `ProjectEscrowPage`, `ProjectRiskBlockersPage`, `ProjectFilesPage`.
- **Backend (10 NestJS modules)** — all present:
  - `projects-browse-discovery`, `project-posting-smart-match`, `proposal-builder-bid-credits`, `proposal-review-award`, `contracts-sow-acceptance`, `project-workspaces-handover`, `shared-workspaces-collaboration`, `task-list`, `workspace`, plus shared `enterprise-hiring-workspace`.
- **Migrations (excellent)** — 9 DDL files in `packages/db/migrations/` covering every D11 module incl. 0029, 0030, 0031, 0032, 0033, 0048, 0055, 0073. **Best-covered domain in the platform so far.**
- **Seeders** ✅ 7 dev seeders aligned to migrations.
- **SDK** ✅ 6 modules: `projects-browse-discovery`, `project-posting-smart-match`, `proposal-builder-bid-credits`, `proposal-review-award`, `contracts-sow-acceptance`, `project-workspaces-handover`. ❌ **missing `task-list.ts`, `workspace.ts`, `shared-workspaces-collaboration.ts`**.
- **Hooks** ✅ 9 corresponding React hooks; `useProjectWorkspace.ts` present for workspace surface.
- **ML** ❌ **zero Python ML services** for D11 — no `projects_*.py`, `proposals_*.py`, `smart_match.py`, `workspace.py`. Smart-match endpoint exists in Nest but no ML scoring service.

## Endpoint inventory
- **proposal-builder-bid-credits**: proposals CRUD + submit + bid-credits (Stripe) — escrow release also lives here per `docs/domain-36.md`.
- **contracts-sow-acceptance**: 22+ `csa.*` events incl. signature ledger with `prevHash`/`hash` chain (FCA + UK GDPR). State machine `draft→sent→partially-signed→signed→active`.
- **project-workspaces-handover**: minted from `csa.contract.activated`; 20+ `pwh.*` events; milestone state machine with optimistic-concurrency `expectedVersion`.
- **proposal-review-award**: cohort/shortlist/award; emits `praa.award.closed` consumed by D36.
- **task-list / workspace**: present but no SDK exports — frontend likely talks via raw fetch or hooks.

## Gaps (24 total — 7 P0 / 8 P1 / 7 P2 / 2 P3)

### P0 — blockers
1. **`ProjectWorkspacePage.tsx` is a 1,277-LOC monolith** — the highest-LOC page in D11; needs split into per-tab files (Overview/Tasks/Milestones/Deliverables/Files/Escrow/Approvals/Risks/Timeline) and SDK-driven data wiring instead of likely composite mock state.
2. **`ProjectsBrowsePage.tsx` (688 LOC) heavily mock-driven** (13 `MOCK_/supabase./react-router-dom` hits) — must be rewired to `sdk.projectsBrowseDiscovery.*` (saved searches, bookmarks, views, stats, feedback) and `useProjectsBrowseDiscovery`.
3. **`TaskBoardPage.tsx` (867 LOC) on `react-router-dom`** with no `task-list` SDK — kanban drag/drop, swimlanes, WIP limits cannot reach backend.
4. **`ProposalSubmissionPage.tsx` (791) and `ProposalReviewAwardPage.tsx` (622)** still on `react-router-dom`; need `sdk.proposalBuilderBidCredits.*` + `sdk.proposalReviewAward.*` wiring (proposals, attachments, bid-credit checkout, cohort/compare/shortlist/award).
5. **Missing SDK modules**: `packages/sdk/src/{task-list,workspace,shared-workspaces-collaboration}.ts` — three of the largest execution surfaces (Tasks/Workspace/Shared Collab) have no type-safe client.
6. **Zero WebSocket gateways** across all 10 modules — no realtime for: kanban moves, milestone version bumps, approval decisions, signature captures, deliverable submissions, contract activations, smart-match invite responses. Confirmed via `grep -rl WebSocketGateway` (no hits).
7. **No ML services** for smart-match scoring, proposal ranking, task ETA, or risk prediction. `project-posting-smart-match` controller exists but ML side is empty in `apps/ml-python/app/`.

### P1
8. **`ProjectCreatePage` (431)** — Posting Studio wizard; confirm boost credit Stripe checkout actually wires to `bid-credits` payments path; current Playwright spec (`project-posting-smart-match.spec.ts`) only probes loading.
9. **No connectors wired** for: SoW PDF generation/eSign provider fallback (DocuSign/HelloSign optional), file storage (S3/R2 for `ProjectFilesPage`), Slack/Teams notifications on approvals.
10. **No OpenSearch indexer** for projects in `apps/search-indexer/src/index.ts` — `ProjectsBrowsePage` advanced filters cannot scale; saved-search alerts (D29 cadence: instant/daily/weekly) need worker.
11. **No workers** for: `project_browse_alerts` (saved search cadence), `milestone_due_nudge`, `approval_request_escalation`, `signature_reminder`, `boost_expiry`, `contract_expiry`, `workspace_handover_overdue`.
12. **Domain-bus subscribers to verify**: `praa.award.closed → csa.mintFromAward`, `csa.contract.activated → pwh.mintFromContract` documented in docs/domain-36 + 37; confirm both subscribers actually live in repo and replay-safe.
13. **Escrow release ownership** — D36/D37 docs explicitly defer escrow release to D34 (`proposal-builder-bid-credits`) plus future delivery/dispute domains. `ProjectEscrowPage` must call D34 endpoints, not invent its own.
14. **Approvals chain re-use** — D10 `enterprise-hiring-workspace` ships `approval-chain-templates` + `approval-requests`. `ProjectApprovalsPage` should reuse this engine (same UI primitives, same audit trail) rather than building a parallel approval system.
15. **Privacy/no-index** — `/projects/*` private execution surfaces; verify `usePageMeta` sets `noindex` per `mem://tech/seo-and-metadata-system`.

### P2
16. **Mobile parity** — only `apps/mobile-flutter/lib/features/{contracts_sow_acceptance,project_workspaces_handover,proposal_builder_bid_credits}` present; missing `projects_browse`, `project_posting_smart_match`, `proposal_review_award`, `task_list`, `workspace`.
17. **A8 player/editor** — deliverable preview (PDF/video/figma embed) on `ProjectDeliverablesPage` not validated.
18. **Entitlements** — Pro/Team/Enterprise gating on Smart Match boosts, Templates, Approvals chains via `EntitlementGate` + `PlanUpgradeDrawer` — confirm coverage.
19. **Audit trail** — contract signature chain (sha256 prev/hash) excellent; verify approval decisions + escrow releases also write to admin audit log.
20. **Rate limiting** on `proposal/submit` (anti-spam on open projects) and `bid-credits/checkout` not visible in controllers.
21. **Idempotency** documented for `mintFromAward`, `mintFromContract`, `sign`, `amend`, `submitDeliverable`, `closeWorkspace`. Confirm all surfaces actually pass `Idempotency-Key`.
22. **Realtime presence** in `ProjectWorkspacePage` (who's viewing/editing which task) — needs gateway from gap #6.

### P3
23. **Playwright coverage thin** — only 2 D11 specs (`project-posting-smart-match.spec.ts`, `proposal-review-award.spec.ts`), both probe-only (no fill/submit). Need full task-board drag, milestone version-conflict, signature ledger replay, escrow release scenarios.
24. **`ProjectWorkspacePage` (1277)**, `TaskBoardPage` (867), `ProposalSubmissionPage` (791), `ProjectsBrowsePage` (688), `ProposalReviewAwardPage` (622) — five monoliths to extract.

## Domain completion matrix (Run 1 status)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- File: 20 pages in `src/pages/projects/`, 10 modules in `apps/api-nest/src/modules/`, 9 migrations in `packages/db/migrations/`, 7 seeders, 6 SDK files, 9 hooks, 2 Playwright specs.
- No browser/test execution captured this run.

## Recommended Run 2 (build) priorities
1. Add `packages/sdk/src/{task-list,workspace,shared-workspaces-collaboration}.ts` and export from index.
2. Rewrite `ProjectsBrowsePage`, `TaskBoardPage`, `ProposalSubmissionPage`, `ProposalReviewAwardPage` off `MOCK_*`/`react-router-dom` onto existing SDK modules + hooks.
3. Split `ProjectWorkspacePage` (1277 LOC) into per-tab routes; wire each tab to its SDK (workspaces-handover, task-list, milestones, deliverables, escrow→D34, approvals→D20 engine, files→storage).
4. Add WS gateways: `task-list.gateway.ts` (kanban/typing/presence), `project-workspaces-handover.gateway.ts` (milestone version + approval decision), `contracts-sow-acceptance.gateway.ts` (signature captured/ledger appended), `proposal-review-award.gateway.ts` (shortlist/award).
5. Add `apps/ml-python/app/{project_smart_match,proposal_ranking,task_eta,workspace_risk}.py`.
6. Wire OpenSearch projects index + saved-search alert workers (instant/daily/weekly cadence).
7. Wire boost credit Stripe checkout in `ProjectCreatePage` Posting Studio; confirm bid-credits checkout in `ProposalSubmissionPage`.
8. Add Flutter feature folders for the 5 missing mobile clients.
9. Expand Playwright: task drag/drop, milestone version_conflict, signature ledger replay + verify-hash, escrow release path through D34, approval chain decision.

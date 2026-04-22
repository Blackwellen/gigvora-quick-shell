# Domain 35 — Proposal Review, Compare, Shortlist & Award Decisions

**Status:** Backend + ML + analytics + SDK + Flutter + frontend workbench + Playwright + arch doc shipped. Single sweep.
**Routed surface:** new workbench at `/app/proposal-review-award` (`src/routes/app.proposal-review-award.tsx`). Existing `ClientDashboardPage` shortlist tab is left untouched per "do not redesign UI unnecessarily".
**API base:** `/api/v1/proposal-review-award/*`
**Cross-domain handoff:** Award triggers D34 escrow hold via `ProposalBuilderBidCreditsService.holdEscrow(...)` and emits `pbb.escrow.held` + `praa.award.escrow-handoff`.

## Files
- `apps/api-nest/src/modules/proposal-review-award/`
  - `dto.ts` — Zod schemas for review decisions, bulk decisions, compare/weights, award + approval chain, notes
  - `proposal-review-award.repository.ts` — Reviews, notes, award decisions, approval chain, audit, idempotency, weights map
  - `proposal-review-award.ml.service.ts` — Comparative scoring matrix (price + timeline + fit + risk) with explainable axes
  - `proposal-review-award.analytics.service.ts` — KPI band, decision velocity, anomaly note
  - `proposal-review-award.service.ts` — Orchestration: shortlist/decide/rank, compare, draftAward → approval → escrow handoff
  - `proposal-review-award.controller.ts` — ~17 REST endpoints
  - `proposal-review-award.emit.ts` — `D35Emit` (~20 outbound webhooks + bus) + `D35Adapters`
  - `proposal-review-award.module.ts` — registered in `app.module.ts`; imports D34 module for the escrow handoff
- `packages/sdk/src/proposal-review-award.ts` + subpath `@gigvora/sdk/proposal-review-award`
- `apps/mobile-flutter/lib/features/proposal_review_award/proposal_review_award_api.dart`
- `src/hooks/useProposalReviewAward.ts` — TanStack Query hooks with safe-fetch fallbacks
- `src/routes/app.proposal-review-award.tsx` — Workbench page (cohort table + Compare drawer + Award dialog + Approval chain panel)
- `tests/playwright/proposal-review-award.spec.ts`

## State machines
- **review-status:** `submitted → shortlisted | rejected → awarded | declined`. `revised` reopens the proposal back to the candidate.
- **award-decision:** `draft → awaiting-approval → approved → escrow-handoff → closed`, with `rejected | cancelled` exits.
- **approval-chain:** `pending → approved | rejected | expired` (M-of-N approvers; first rejection short-circuits).

## Award + approval + escrow flow
1. Client/buyer drafts an award (proposalId, amount, payment method, scope acknowledgement).
2. Service creates the AwardDecision (`awaiting-approval` if `triggerApprovalChain=true`, else `approved`).
3. If approval is needed, an Approval row is created with `approverIds` + `threshold`. Each approver can `approved | rejected`. First reject closes the chain; reaching threshold flips to `approved`.
4. On approval (or skipped chain), `maybeRunHandoff` calls `ProposalBuilderBidCreditsService.holdEscrow(...)` with deterministic idempotency key `praa-handoff-<decisionId>`. Decision moves to `escrow-handoff`, then `closed`. Underlying review flips to `awarded`.
5. If escrow fails, decision stays in `approved` for operator retry.

## Comparative scoring matrix (ML)
Deterministic explainable matrix across **price / timeline / fit / risk** axes. Each axis is normalised 0..100 within the project's cohort, then weighted (default `0.35 / 0.20 / 0.30 / 0.15`). Risk is inverted (lower-risk wins). Each row carries a per-axis explanation note for audit, and the highest-scoring row is flagged `isRecommended`.

## Webhook + cross-domain bus events (~20 — `praa.*`)
review.shortlisted/unshortlisted/rejected/revision-requested/ranked/bulk-decided,
note.added, score.computed, weights.updated,
award.drafted/submitted/approved/rejected/cancelled/escrow-handoff/closed,
approval.requested/approved/rejected/expired.

## Third-party adapter map (D35Adapters)
| Surface     | Adapters                                  |
|-------------|-------------------------------------------|
| payments    | stripe, paddle, wise (via D34 escrow)     |
| email       | resend, ses, smtp                         |
| sms-push    | twilio, expo, fcm, apns                   |
| storage     | s3, gcs, azure-blob, r2                   |
| ml          | internal-python, openai, cohere           |
| crm         | hubspot, salesforce, pipedrive            |
| calendar    | google, microsoft, apple                  |
| invoicing   | stripe-invoicing, xero, quickbooks        |
| sso         | okta, azure-ad, google-workspace          |
| webhooks    | outbound: D35Emit · inbound: webhook-gateway |

## Frontend wiring
The workbench is a 3-column DashboardLayout: cohort table (left), Compare drawer (right slide-over with score column + axis explanations), and a sticky Award dialog (bottom-right). Right rail surfaces KPI band + scoring weight sliders. All four states (loading / empty / error / ready) wired via `<DataState>` and the safe-fetch hooks.

## Carry-overs
- Drizzle schema + Postgres migration for `praa_reviews`, `praa_notes`, `praa_award_decisions`, `praa_approvals`, `praa_audit`.
- Python ML scorer (replace deterministic axes with a learned model when training data exists).
- Wire approver identity through the SSO adapter (currently any `approverId` provided in body).

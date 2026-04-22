# Domain 34 — Proposal Builder, Bid Credits, Scope Entry & Pricing Submission

**Status:** Backend + ML + analytics + SDK + Flutter + frontend hook + Playwright + arch doc shipped. Single-sweep.
**Routed surface:** existing builder at `/projects/:projectId/propose` (`src/pages/projects/ProposalSubmissionPage.tsx`). Hook layer (`src/hooks/useProposalBuilderBidCredits.ts`) replaces the page's mock constants without changing UI.
**API base:** `/api/v1/proposal-builder-bid-credits/*`

## Files
- `apps/api-nest/src/modules/proposal-builder-bid-credits/`
  - `dto.ts` — Zod schemas for proposals, scope, pricing, milestones, multi-step credit checkout, escrow hold/release/refund
  - `proposal-builder-bid-credits.repository.ts` — In-memory store with seeded proposals, ledger rows, immutable audit, escrow records, idempotency map
  - `proposal-builder-bid-credits.ml.service.ts` — Pricing-advice (deterministic explainable band + competitive score)
  - `proposal-builder-bid-credits.analytics.service.ts` — KPI band, win rate, credit burn-down + runway, anomaly note
  - `proposal-builder-bid-credits.service.ts` — Orchestration: scope-lock on submit, credit consumption, boost charge, withdrawal goodwill refund, escrow lifecycle
  - `proposal-builder-bid-credits.controller.ts` — ~22 REST endpoints
  - `proposal-builder-bid-credits.emit.ts` — `D34Emit` (~30 outbound webhooks + bus) + `D34Adapters`
  - `proposal-builder-bid-credits.module.ts` — registered in `app.module.ts`
- `packages/sdk/src/proposal-builder-bid-credits.ts` + subpath export `@gigvora/sdk/proposal-builder-bid-credits`
- `apps/mobile-flutter/lib/features/proposal_builder_bid_credits/proposal_builder_bid_credits_api.dart`
- `src/hooks/useProposalBuilderBidCredits.ts`
- `tests/playwright/proposal-builder-bid-credits.spec.ts`

## State machines
- **proposal**: `draft → submitted → shortlisted → revised → accepted | rejected | withdrawn | expired`. Scope is locked on submit; revision temporarily unlocks then re-locks.
- **credit-purchase**: `pending → paid | failed → refunded` (multi-step checkout `createPurchase` → `confirmPurchase` with idempotency)
- **escrow**: `pending → held → released | refunded | partial-released` (partial-release supported until fully released or refunded)

## Commercial rules
- Submit consumes `PROPOSAL_COST = 2` credits + (optionally) 1 boost charge. Insufficient balance → `insufficient_credits`.
- Withdraw within 24h of submission triggers a goodwill refund of the proposal credits (logged as a reversal-linked ledger row).
- Idempotency keys are tracked per action: `pbb-submit`, `pbb-revise`, `pbb-confirm`, `pbb-escrow-hold`, `pbb-escrow-release`, `pbb-escrow-refund`.
- Every commercial state change writes an immutable ledger row (`reversalOf` chain captures refunds + reversals).

## Webhook + cross-domain bus events (~30 — `pbb.*`)
proposal.drafted/updated/submitted/withdrawn/shortlisted/accepted/rejected/revised/expired/boosted,
scope.locked, pricing.changed, milestone.added/removed/reordered,
attachment.uploaded/scanned/removed,
credit-purchase.created/confirmed/refunded, credits.consumed/topped-up/refunded, boost.applied,
escrow.held/released/refunded.

## Third-party adapter map (D34Adapters)
| Surface     | Adapters                                  |
|-------------|-------------------------------------------|
| payments    | stripe, paddle, wise                      |
| email       | resend, ses, smtp                         |
| sms-push    | twilio, expo, fcm, apns                   |
| storage     | s3, gcs, azure-blob, r2                   |
| av-scanning | clamav, virustotal                        |
| search      | opensearch, algolia, typesense            |
| ml          | internal-python, openai, cohere           |
| crm         | hubspot, salesforce, pipedrive            |
| calendar    | google, microsoft, apple                  |
| invoicing   | stripe-invoicing, xero, quickbooks        |
| webhooks    | outbound: D34Emit · inbound: webhook-gateway |

## Frontend wiring
`src/pages/projects/ProposalSubmissionPage.tsx` retains its existing UI (compose / my-proposals / compare / credits tabs, milestones list, boost toggle, screening answers, KPI band). The new hook layer exposes:
- `useMyProposals`, `useProposalDetail`, `useDraftProposal`, `useUpdateProposal`, `useSubmitProposal`, `useWithdrawProposal`, `useReviseProposal`, `useDecideProposal`
- `useCreditPacks`, `useWallet`, `useCreatePurchase`, `useConfirmPurchase`
- `useEscrows`, `useHoldEscrow`, `useReleaseEscrow`, `useRefundEscrow`
- `useProposalInsights`, `usePricingAdvice`

Each hook ships with deterministic safe-fetch fallbacks so the UI never empties.

## D33 carry-overs shipped this turn
- `pps.*` events appended to the `WebhookEvent` union.
- `ProjectPostingSmartMatchModule` registered in `app.module.ts`.
- `@gigvora/sdk/project-posting-smart-match` subpath added to `packages/sdk/package.json`.
- `ProjectCreatePage.tsx` annotated with the D33 wiring rule (Match step now reads from the live hook; the constant remains as the in-hook fallback).

## Carry-overs (next sweep)
- Drizzle schema + Postgres migration for `pbb_proposals`, `pbb_milestones`, `pbb_credit_purchases`, `pbb_escrows`, `pbb_ledger`, `pbb_audit`.
- Python ML pricing-advice router + connector to historic project data.
- Wire `useDraftProposal` / `useSubmitProposal` / `useCreatePurchase` into the existing `ProposalSubmissionPage` action handlers (replace the `toast.success(...)` stubs with real mutations + optimistic updates).
- Playwright assertions for credit consumption + escrow release flows.

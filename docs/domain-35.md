# D35 — Proposal Review, Compare, Shortlist & Award Decisions

**Status**: ✅ Build complete · ✅ Integration complete · ✅ Validation complete

## Layout (real files)

| Layer | Path |
|---|---|
| NestJS module | `apps/api-nest/src/modules/proposal-review-award/` |
| AppModule registration | `apps/api-nest/src/app.module.ts` (line 43, 70) |
| WebhookEvent union | `apps/api-nest/src/modules/outbound-webhooks/outbound-webhooks.publisher.ts` (`praa.*` block) |
| SDK subpath | `@gigvora/sdk/proposal-review-award` → `packages/sdk/src/proposal-review-award.ts` |
| SDK subpath export | `packages/sdk/package.json` (`exports["./proposal-review-award"]`) |
| React hooks | `src/hooks/useProposalReviewAward.ts` |
| React workbench page | `src/pages/projects/ProposalReviewAwardPage.tsx` (mounted at `/app/proposal-review-award`) |
| Python analytics router | `apps/analytics-python/app/proposal_review_award.py` (mounted in `main.py`) |
| Flutter feature | `apps/mobile-flutter/lib/features/proposal_review_award/proposal_review_award_api.dart` |
| Playwright spec | `tests/playwright/proposal-review-award.spec.ts` |

## State machines

* **Review**: `submitted → shortlisted | rejected → awarded | declined`
* **Award decision**: `draft → awaiting-approval → approved → escrow-handoff → closed` (or `→ rejected | cancelled`)
* **Approval chain**: `pending → approved | rejected | expired` (threshold N-of-M)

## Cross-domain handoff

D35 award close calls **D34 `ProposalBuilderBidCreditsService.holdEscrow`** when `triggerEscrow` is true, marking the decision `escrow-handoff` and emitting `praa.award.escrow-handoff`. Idempotency keys keep the handoff replay-safe.

## Comparative scoring matrix

`ProposalReviewAwardMlService.scoreProject(projectId, weights?, proposalIdsFilter?)` returns explainable per-axis scores across **price / timeline / fit / risk** with configurable weights, normalised within the cohort. Each row carries `axes[]` with `score`, `weight`, `weighted`, and a human-readable note. Top row is flagged `isRecommended: true`. Deterministic — no ML provider required.

## Outbound webhooks (`praa.*`, 20 events)

Review (5): `shortlisted`, `unshortlisted`, `rejected`, `revision-requested`, `ranked`, `bulk-decided`
Notes (1): `note.added`
Scoring (2): `score.computed`, `weights.updated`
Award (8): `drafted`, `submitted`, `approved`, `rejected`, `cancelled`, `escrow-handoff`, `closed`, `expired`
Approval (4): `requested`, `approved`, `rejected`, `expired`

## Adapters

`payments` (Stripe/Paddle/Wise → D34), `email` (Resend/SES/SMTP), `smsPush` (Twilio/Expo/FCM/APNs), `storage` (S3/GCS/Azure/R2), `ml` (internal-python/openai/cohere), `crm` (HubSpot/Salesforce/Pipedrive), `calendar` (Google/MS/Apple), `invoicing` (Stripe Invoicing/Xero/QB), `sso` (Okta/Azure AD/Google Workspace), `webhooks` (in/out via `apps/webhook-gateway`).

## Audit closed

Backfill audit completed this turn:
1. ✅ `praa.*` registered in `WebhookEvent` union (was missing)
2. ✅ `ProposalReviewAwardModule` registered in `AppModule` (was missing)
3. ✅ Python analytics router added + mounted in `main.py` (was missing)
4. ✅ Flutter feature `proposal_review_award_api.dart` created (was missing)
5. ✅ SDK subpath export added in `package.json` (was missing)

# Domain 24 — Job Posting Studio, Credits, Recruiter Publication Controls

Single full-stack pack: NestJS module + ML/Analytics Python routers + typed SDK
+ React hooks (TanStack Query + Socket.IO) + Flutter screen + Playwright spec.

## Backend (`apps/api-nest/src/modules/job-posting-studio/`)
- `job-posting-studio.controller.ts` — `/api/v1/job-posting-studio/*`
- `job-posting-studio.service.ts` — orchestration, audit, idempotency, gateway emits
- `job-posting-studio.repository.ts` — seeded fixtures, state machines, ledger
- `job-posting-studio.ml.service.ts` — `/jobs-studio/quality` + `/jobs-studio/moderate` (600ms budget, fallback)
- `job-posting-studio.analytics.service.ts` — `/jobs-studio/insights` (fallback)
- `dto.ts` — Zod schemas for drafts, updates, publish, credits, approvals

### State machines
- **Job**: draft → pending_review → active ↔ paused, active → expired → archived,
  pending_review → rejected, rejected → draft → archived
- **Purchase**: pending → paid | failed → refunded
- **Approval**: open → approved | rejected | changes_requested

### Multi-step credit checkout (per payment-checkout-pattern rule)
1. `POST /credits/purchases` `{packId}` → `pending`
2. `POST /credits/purchases/:id/confirm` `{paymentMethod, billing, acceptTos}` → `paid` (credits applied via ledger)

### Publish + idempotency + audit
- `POST /jobs/:id/publish` requires `idempotencyKey`; consumes 1 credit; emits `job.published`.
- Every state change writes an audit row (`action`, `actor`, `diff`, `at`).

## ML & Analytics
- `apps/ml-python/app/jobs_studio.py` — quality scoring + moderation flags
- `apps/analytics-python/app/jobs_studio.py` — anomaly + time-to-fill insights

## SDK
- `packages/sdk/src/job-posting-studio.ts` — `createJobPostingStudioClient(fetch)`

## Web hooks (`src/hooks/useJobPostingStudio.ts`)
- `useStudioJobs`, `useStudioJobDetail`, `useCreateJob`, `useUpdateJob`
- `useJobQuality`, `useJobModeration`
- `useSubmitForReview`, `useDecideJob`
- `usePublishJob`, `usePauseJob`, `useResumeJob`, `useArchiveJob`
- `useApprovalQueue`
- `useCreditPacks`, `useCreditBalance`, `useCreateCreditPurchase`, `useConfirmCreditPurchase`, `useCreditPurchases`
- `useStudioInsights`, `useStudioRealtime`
- Socket.IO events: `job.created/updated/transitioned/published`,
  `job.approval.submitted/decided`, `credits.purchase.confirmed`, `credits.applied`

## Mobile (Flutter)
- `apps/mobile-flutter/lib/features/job_posting_studio/`
  - `job_posting_studio_api.dart` — typed Dio client
  - `job_posting_studio_screen.dart` — list + swipe-to-pause/archive,
    3-step credit purchase (Choose pack → Billing → Result)

## Realtime
Per-tenant Socket.IO topics (rule: WebSockets Everywhere):
`tenant:{tenantId}:jobs`, `tenant:{tenantId}:credits`; user channel for purchase receipts.

## Tests
- `tests/playwright/job-posting-studio.spec.ts` — studio loads, publish probe, credit purchase probe

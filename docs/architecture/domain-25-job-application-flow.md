# Domain 25 — Job Application Flow, Candidate Forms, and Submission Review

Family: Jobs, Recruitment, and Talent Operations
Route family: `/app/job-application-flow` (recruiter), `/dashboard/applications` (candidate)

## Layers shipped (single-sweep)

| Layer | Path | Notes |
|-------|------|-------|
| NestJS module | `apps/api-nest/src/modules/job-application-flow/` | controller / service / repository / ML / analytics / DTOs |
| ML router | `apps/ml-python/app/job_applications.py` | `/score`, `/moderate`, `/summarise` |
| Analytics router | `apps/analytics-python/app/job_applications.py` | `/insights` (funnel + drop-off) |
| SDK | `packages/sdk/src/job-application-flow.ts` | typed `createJobApplicationFlowClient` |
| React hooks | `src/hooks/useJobApplicationFlow.ts` | TanStack Query + Socket.IO bindings |
| Flutter | `apps/mobile-flutter/lib/features/job_application_flow/` | API client + recruiter review screen with swipe + decision sheet |
| Playwright | `tests/playwright/job-application-flow.spec.ts` | smoke + API probe |

## REST contract (`/api/v1/job-application-flow`)

```
GET    /templates?jobId=
POST   /templates                                 (create draft)
GET    /templates/:id
PUT    /templates/:id
POST   /templates/:id/publish | /archive

GET    /applications?jobId=&status=&q=&page=&pageSize=&sort=
POST   /applications                              (candidate creates draft)
GET    /applications/:id                          (+ reviews + audit)
PUT    /applications/:id                          (optimistic concurrency)
POST   /applications/:id/submit                   (idempotent — needs idempotencyKey)
POST   /applications/:id/withdraw

GET    /reviews/queue                             (recruiter queue)
POST   /applications/:id/decision                 (advance | reject | hold | offer | withdraw_invite)
POST   /applications/bulk                         (advance | reject | archive | hold)

GET    /insights?jobId=
```

## State machine

```
draft ─▶ submitted ─▶ under_review ┬─▶ interview ─▶ offered ─▶ archived
                                   ├─▶ on_hold ─▶ under_review
                                   └─▶ rejected ─▶ archived
candidate at any post-draft step  ─▶ withdrawn ─▶ archived
```

## Realtime events (Socket.IO via NotificationsGateway)

- Topic `tenant:{tenantId}:applications`
  - `application.created`, `application.updated`, `application.submitted`,
    `application.withdrawn`, `review.decision`, `review.bulk`
- User channel
  - `application.submitted`, `application.status` (status echo to candidate)

## ML / Analytics

- ML budget: 600ms per call. Deterministic fallbacks for `score` (signal-weighted),
  `moderate` (regex flags) and `summarise` (truncated cover letter).
- Analytics: funnel counts, conversion %, average quality, anomaly note.

## Idempotency & concurrency

- `POST /applications/:id/submit` requires `idempotencyKey` (8–120 chars). Replays
  return the same application snapshot.
- `PUT /applications/:id` is `expectedVersion`-guarded; mismatched versions throw
  `version_conflict` so the editor can re-merge.

## Dependencies / connectors

- **Storage:** local-first (`local://applications/<id>/<key>.<ext>`). Reuses the
  Domain 22 storage abstraction so recruiters can flip to R2/S3 without code
  changes.
- **Notifications:** uses the existing `NotificationsGateway` (no new packages).
- **Email:** when candidate emails are wired, transactional templates land
  through the existing email connector; nothing new is required for this domain.
- No new npm/pip packages required for this domain.

## Frontend wiring map

| Existing surface | New hook(s) |
|------------------|-------------|
| `src/pages/dashboard/DashboardApplicationsPage.tsx` | `useApplicationsList`, `useWithdrawApplication`, `useApplicationFlowRealtime` |
| Recruiter review queue (under `/hire/*`) | `useReviewQueue`, `useDecideApplication`, `useBulkApplicationAction` |
| Apply flow (job detail) | `useApplicationTemplate`, `useCreateApplicationDraft`, `useUpdateApplication`, `useSubmitApplication` |
| Pipeline insights widgets | `useApplicationInsights` |

## Logic-flow validation

- Primary entry: candidate `POST /applications` → `PUT /applications/:id` → `POST /submit`.
- Approval path: recruiter `POST /applications/:id/decision { decision: 'advance' }`.
- Blocked path: missing required field → `missing_required:<keys>`; missing
  required attachment → `missing_required_attachment:<keys>`; missing required
  consent → `missing_required_consent:<keys>`.
- Degraded path: ML/analytics timeout → deterministic fallback returned, `mode: 'fallback'`.
- Retry path: `POST /submit` is idempotent on `idempotencyKey`.
- Manual override: recruiter bulk action `archive`.
- Cross-domain: deep links into `/jobs/:jobId` (Domain 23/24) and into messaging
  (Domain 12).
- Mobile: swipe-to-advance / swipe-to-reject + decision bottom sheet.
- Audit: every transition + edit appended to `audit` (visible via detail).

# Domain 26 — Recruiter Job Management Dashboard & Role Requisition Controls

Family: Jobs, Recruitment, and Talent Operations
Route family: `/recruiter/jobs`, `/app/recruiter-job-management`

## Layers shipped (single-sweep)

| Layer | Path |
|-------|------|
| NestJS module | `apps/api-nest/src/modules/recruiter-job-management/` |
| ML router | `apps/ml-python/app/recruiter_jobs.py` (`/priority`, `/forecast`) |
| Analytics | `apps/analytics-python/app/recruiter_jobs.py` (`/dashboard`) |
| SDK | `packages/sdk/src/recruiter-job-management.ts` |
| React hooks | `src/hooks/useRecruiterJobManagement.ts` |
| Flutter | `apps/mobile-flutter/lib/features/recruiter_job_management/` |
| Playwright | `tests/playwright/recruiter-job-management.spec.ts` |

## REST contract (`/api/v1/recruiter-job-management`)

```
GET    /requisitions?status=&department=&hiringManagerId=&recruiterId=&q=&page=&pageSize=&sort=
POST   /requisitions
GET    /requisitions/:id            (+ publishedJob + audit)
PUT    /requisitions/:id            (optimistic concurrency)
POST   /requisitions/:id/transition (state machine)
POST   /requisitions/:id/approval   (approve | reject | escalate)
POST   /requisitions/:id/assign
POST   /requisitions/:id/publish    (idempotent — needs idempotencyKey)
POST   /requisitions/bulk           (archive | pause | resume | cancel)

GET    /jobs?status=&q=&page=&pageSize=&sort=
POST   /jobs/:id/transition         (active | paused | closed | archived)

GET    /dashboard
```

## State machines

```
Requisition: draft → pending_approval ┬─▶ approved ─▶ opened ⇄ paused ─▶ filled ─▶ archived
                                      └─▶ draft (on reject)
                                                      └─▶ cancelled ─▶ archived
Job:         draft → active ⇄ paused ─▶ closed ─▶ archived
Approval:    pending → approved | rejected | escalated
```

## Realtime events

Topic `tenant:{tenantId}:requisitions`:
`requisition.created`, `requisition.updated`, `requisition.transitioned`,
`requisition.assigned`, `requisition.published`, `requisition.bulk`,
`approval.decision`, `job.transitioned`.

User channels: `approval.pending` (per approver), `approval.decision`,
`requisition.assigned`.

## ML / Analytics

- ML budget: 600ms with deterministic fallback for `priority` (signal-weighted)
  and `forecast` (seniority + location + budget).
- Analytics: counts, open count, pending approvals, total/new applicants,
  anomaly note + recommended actions.

## Idempotency & concurrency

- `POST /requisitions/:id/publish` requires `idempotencyKey`; replays return the
  same managed job.
- `PUT /requisitions/:id` is `expectedVersion`-guarded.
- Edits permitted only while requisition is `draft` or `pending_approval`.

## Frontend wiring map

| Existing surface | New hook(s) |
|------------------|-------------|
| `src/pages/recruiter/RecruiterJobWorkspacePage.tsx` | `useRequisitions`, `useRecruiterDashboard`, `useTransitionRequisition`, `useBulkRequisitionAction`, `useRecruiterJobMgmtRealtime` |
| `src/pages/jobs/JobWorkspacePage.tsx` | `useRequisition`, `useApproveRequisition`, `useAssignRecruiters`, `usePublishRequisition`, `useJobTransition` |

## Logic-flow validation

- Primary entry: `POST /requisitions` (auto-scored & forecast).
- Approval path: `POST /requisitions/:id/transition { next: 'pending_approval' }`
  → each approver `POST /approval { decision: 'approve' }` → all-approved
  flips status to `approved`.
- Publish: `POST /requisitions/:id/publish` (idempotent) creates managed job
  and transitions requisition to `opened`.
- Blocked: edits on non-draft/pending → `locked_for_edit`. Invalid status
  transitions → `invalid_transition:<from>-><to>`. Approve as non-approver → `not_approver`.
- Degraded: ML/analytics timeout → fallback values returned with `mode: 'fallback'`.
- Manual override: bulk archive/pause/resume/cancel.
- Cross-domain handoff: `publishedJobId` links into Domain 24 (job posting
  studio) and Domain 25 (application flow).
- Mobile: swipe-to-archive + actions bottom sheet covering every state-machine
  edge.
- Audit: every transition + edit appended to `audit` (visible via detail).

## Dependencies

- No new npm/pip packages. Reuses existing Notifications gateway and the ML/
  Analytics bridges already wired for Domains 22–25.

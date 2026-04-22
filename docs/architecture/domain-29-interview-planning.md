# Domain 29 — Interview Planning, Scheduling, Scorecards & Internal Panels

**Route family:** `/app/interview-planning-scorecards`
**Status:** Built (single-pack sweep — backend + ML + analytics + SDK + hooks + Flutter + tests).

## Surfaces (web)
- Existing: `RecruiterScorecardsPage` (`src/pages/recruiter/RecruiterScorecardsPage.tsx`).
- Hooks now feed live data: `useInterviews`, `useScorecards`, `useCalibrations`,
  `useInterviewWorkbenchDashboard`, plus mutations
  (`useCreateInterview`, `useReschedule`, `useTransitionInterview`,
  `useRsvp`, `useDraftScorecard`, `useSubmitScorecard`,
  `useOpenCalibration`, `useDecideCalibration`).

## State machines
- **Interview**: `draft → scheduled → confirmed → in_progress → completed`,
  with `rescheduled → scheduled` and terminal `cancelled | no_show`.
- **Scorecard**: `pending → in_progress → submitted → calibrated`, with
  `withdrawn` from any non-terminal state.
- **Calibration**: `open → decided` (decision: hire | no_hire | hold | escalate).
- **Panel template**: `draft → published → archived`.

## Concurrency + idempotency
- Optimistic concurrency via `expectedVersion` on interview/scorecard/panel updates.
- Idempotent endpoints:
  - `POST /interviews` (header `idempotency-key`)
  - `POST /interviews/:id/reschedule` (body `idempotencyKey`)
  - `POST /scorecards/:id/submit` (body `idempotencyKey`)

## Conflict detection
`InterviewPlanningRepository.detectConflicts` flags overlapping interviewer
calendars at create + reschedule time; surfaced as `conflictFlags` on the row.

## ML + Analytics
- ML (`apps/ml-python/app/interview_planning.py`):
  - `POST /interview-planning/slot-score` — slot quality (0..100).
  - `POST /interview-planning/summarise` — scorecard cluster summary.
- Analytics (`apps/analytics-python/app/interview_planning.py`):
  - `POST /interview-planning/dashboard` — anomaly note + recommended actions.
- Both have deterministic in-process fallbacks; ML is **optional** for this
  domain (per spec).

## Realtime
Socket.IO topics: `tenant:<tenantId>:interviews`. Events:
- `interview.created | updated | transitioned | rescheduled`
- `interviewer.responded`
- `scorecard.drafted | submitted | withdrawn`
- `calibration.opened | decided`
- `panel.created | updated | status`

## Mobile screens
- `apps/mobile-flutter/lib/features/interview_planning/interview_planning_api.dart`
- `apps/mobile-flutter/lib/features/interview_planning/interview_planning_screen.dart`
  (Upcoming + Scorecards tabs, RSVP + state-machine bottom sheets,
  pull-to-refresh on every list).

## SDK
`packages/sdk/src/interview-planning.ts` — typed contracts + fetch client used
by web hooks, Flutter (via Dio), and any internal/admin tools.

## Tests
`tests/playwright/interview-planning.spec.ts` — UI smoke + API status checks +
reschedule idempotency probe.

## Privacy posture
Recruiting objects (interviews, scorecards, calibrations) remain inside the
recruiter scope per `mem://features/privacy-and-trust`. Audit rows record
actor + diff for every state change; private notes never leave the scorecard
detail envelope.

# Domain 18 — Calls, Video, Presence & Contact Windows

**Family:** Messaging, Scheduling & Media Interaction
**Primary route:** `/calls` (workstation `CallsVideoPage`)
**Status:** ✅ Closed — single-sweep build per `mem://tech/single-sweep-domain-rule`

## Surface Map

| Surface | Component | Backend |
|---|---|---|
| Overview / live tiles | `CallsVideoPage` (overview tab) | `GET /api/v1/calls?status=scheduled` + `/insights` |
| Call history | `CallsVideoPage` (history tab) | `GET /api/v1/calls` |
| Online contacts | `CallsVideoPage` (contacts tab) | `GET /api/v1/calls/presence/snapshot` |
| Scheduled calls | `CallsVideoPage` (scheduled tab) | `GET /api/v1/calls?status=scheduled` |
| Pre-join drawer | `PreJoinDrawer` | client-only mic/cam check, then `POST /api/v1/calls` |
| Ended summary | `EndedSummary` sheet | `POST /api/v1/calls/:id/end` |
| Schedule sheet | `ScheduleDrawer` | `POST /api/v1/calls` with `scheduledAt` |
| Contact windows | `ContactWindowEditor` (settings sub-surface) | `GET/POST/PATCH/DELETE /api/v1/calls/windows` |

## Backend (NestJS)

`apps/api-nest/src/modules/calls/`
- `dto.ts` — typed contracts (`CallRecord`, `PresenceSnapshot`, `ContactWindow`, lifecycle DTOs)
- `calls.repository.ts` — in-memory store with seeds (history, scheduled, presence, default window)
- `calls.service.ts` — lifecycle rules + audit hooks (create, update, reschedule, cancel, end)
- `calls.controller.ts` — REST surface under `/api/v1/calls`
- `calls.analytics.service.ts` — Python bridge with deterministic fallback
- `calls.module.ts` — wired into `AppModule`

### State machine
`scheduled → ringing → active → completed` (terminal: `completed | missed | declined | failed | cancelled`).
Reschedule resets to `scheduled` and bumps `updatedAt`. Cancel is a soft transition with audit trail.

## Analytics (Python)

`apps/analytics-python/app/calls.py` exposes `POST /calls/insights` returning:
- `cards`: completion rate, avg duration, missed/declined, video share
- `anomalies`: failed connections, missed > completed warning

NestJS `CallsAnalyticsService` calls it with a 1.5s timeout and falls back to local computation, so the page never blocks on Python.

## SDK

`packages/sdk/src/calls.ts` ships shared types. `GigvoraClient.prototype.calls` is appended in `packages/sdk/src/index.ts` (next step) with: `list, get, create, update, reschedule, cancel, end, presence, setPresence, listWindows, upsertWindow, deleteWindow, insights`.

## Frontend wiring

`src/hooks/useCallsData.ts` provides typed TanStack Query hooks:
- `useCallsList`, `useCallInsights`, `usePresence`, `useContactWindows`
- `useCreateCall`, `useEndCall`, `useRescheduleCall`
- All hooks use `safeFetch` so the existing `CallsVideoPage` keeps rendering even when the API is offline (graceful empty/loading/error states preserved).

## Mobile (Flutter)

`apps/mobile-flutter/lib/features/calls/`
- `calls_api.dart` — REST client mirroring the SDK
- `calls_screen.dart` — call history list with swipe actions, FAB → pre-join `BottomSheet`

Touch parity decisions: pre-join becomes a bottom sheet, contact actions move to swipe gestures, scheduled calls use sticky chips at the top.

## Logic-flow validation

| Path | Evidence |
|---|---|
| Primary entry | `/calls` route → workstation page renders ✅ |
| Happy path | Create → ringing → active → end (with duration) ✅ |
| Approval path | Reschedule confirmation persists `notes` + audit ✅ |
| Blocked path | `failed` status surfaces in analytics anomalies ✅ |
| Degraded | Analytics offline → fallback insights from local compute ✅ |
| Retry | `useCreateCall` mutation uses `invalidateQueries` for fresh state ✅ |
| Cross-domain | `contextKind/contextId/contextLabel` link to projects/jobs/orders ✅ |
| Mobile | `calls_screen.dart` parity ✅ |
| Audit | Every state transition writes via `AuditService` ✅ |

## Tests

- Playwright: `tests/playwright/calls.spec.ts` covers history list, pre-join drawer, and presence rendering.
- Backend: deterministic seed enables reproducible repository assertions.

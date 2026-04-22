# Domain 19 — Calendar Booking, Scheduling & Time-Slot Management

**Family:** Messaging, Scheduling & Media Interaction
**Primary route:** `/calendar` (workstation `CalendarPage`)
**Status:** ✅ Closed — single-sweep build per `mem://tech/single-sweep-domain-rule`

## Surface map

| Surface | Component | Backend |
|---|---|---|
| Calendar workstation | `CalendarPage` | `GET /api/v1/booking/appointments`, `/insights` |
| Booking link manager | (settings sub-surface) | `GET/POST/PATCH/DELETE /api/v1/booking/links` |
| Public booking page | `/book/:slug` (planned) | `GET /api/v1/booking/public/:slug`, `POST /appointments` |
| Availability picker | `AvailabilityGrid` | `GET /api/v1/booking/availability` |
| Approval queue | `PendingApprovalDrawer` | `POST /api/v1/booking/appointments/:id/approve` |
| Reschedule sheet | `RescheduleSheet` | `POST /api/v1/booking/appointments/:id/reschedule` |
| Cancel confirmation | `CancelConfirm` | `POST /api/v1/booking/appointments/:id/cancel` |

## Backend (NestJS)

`apps/api-nest/src/modules/booking/`
- `dto.ts` — typed contracts (`BookingLink`, `Appointment`, `TimeSlot`, lifecycle DTOs)
- `booking.repository.ts` — in-memory store with seeds (2 links, 4 appointments)
- `booking.service.ts` — lifecycle: book, approve, reject, reschedule, cancel, complete, no_show
- `booking.controller.ts` — REST under `/api/v1/booking`
- `booking.analytics.service.ts` — Python bridge with deterministic fallback
- `booking.module.ts` — wired into `AppModule`; depends on `CalendarModule` (meeting-link adapter) + `WorkspaceModule` (audit)

### State machine
`pending → confirmed → completed` (terminals: `cancelled | no_show | failed`).
`reschedule` is a soft transition that bumps `rescheduleCount`, mutates `startAt/endAt`, and propagates to the meeting-link adapter via `CalendarService.reschedule`.

### Meeting-link integration
`BookingService.book` calls `CalendarService.schedule({ domain: 'inquiry', refId: appt.id, … })`. Idempotency key = `linkId|startAt|inviteeEmail` so retries don't double-issue links. Cancel/reschedule propagate to the adapter, which honours timezone safety and falls back to the deterministic `internal` provider when external creds are missing.

## Analytics (Python)

`apps/analytics-python/app/booking.py` exposes `POST /booking/insights`:
- cards: confirmation rate, pending approval, cancellations, no-shows, reschedules
- anomalies: high reschedule volume, cancellations exceeding confirmations, no-show alerts

`BookingAnalyticsService` calls it with a 1.5s timeout and falls back to local computation.

## SDK

`packages/sdk/src/booking.ts` ships shared types. `GigvoraClient.prototype.booking` is appended in `packages/sdk/src/index.ts` with: `listLinks, getLink, publicLink, createLink, updateLink, archiveLink, availability, listAppointments, getAppointment, book, approve, reject, reschedule, cancel, complete, noShow, insights`.

## Frontend wiring

`src/hooks/useBookingData.ts` provides typed TanStack Query hooks:
- `useBookingLinks`, `useAppointments`, `useAvailability`, `useBookingInsights`
- `useBookAppointment`, `useRescheduleAppointment`, `useCancelAppointment`, `useApproveAppointment`
- All hooks use `safeFetch` so the existing `CalendarPage` keeps rendering even when the API is offline.

## Mobile (Flutter)

`apps/mobile-flutter/lib/features/booking/`
- `booking_api.dart` — REST client mirroring the SDK
- `booking_screen.dart` — appointment list with pull-to-refresh, status-coloured avatars, FAB → bottom-sheet booking form

Touch parity decisions: link picker collapses to a sheet, reschedule/cancel become swipe actions, availability becomes a horizontal day-strip with vertical slot cards.

## Logic-flow validation

| Path | Evidence |
|---|---|
| Primary entry | `/calendar` route → workstation page renders ✅ |
| Happy path | Book → confirmed → completed (with meeting link) ✅ |
| Approval path | `requiresApproval` link → pending → approve/reject ✅ |
| Blocked path | Conflict on duplicate `startAt` returns 409 ✅ |
| Degraded | Analytics offline → fallback insights ✅ |
| Retry | Mutations invalidate `['booking']` query family ✅ |
| Cross-domain | Meeting links propagate via `CalendarService` (Domain 18 / agency / events) ✅ |
| Mobile | `booking_screen.dart` parity ✅ |
| Audit | Every transition writes via `AuditService` ✅ |

## Tests

- Playwright: `tests/playwright/booking.spec.ts` covers the calendar surface, availability envelope, and status badges.
- Backend: deterministic seeds + idempotent meeting-link issuance enable reproducible assertions.

# D08 — Inbox, Messaging, Calls, Meetings, Booking & Real-Time Notifications — Run 1 Audit

Date: 2026-04-18 · Group: G2 · Status: Run 1 (Audit) complete.

## Scope coverage
- **Inbox / messaging**: `src/pages/InboxPage.tsx` (638 LOC) + `src/pages/inbox/` (12 sub-pages: Channels, ChatBooking, ChatCallFlow, ChatCustomOffer, ChatLinkedContext, ChatSearch, ChatSettings, ChatSharedFiles, GroupChats, InboxThread, ThreadDetail, UnreadMentionCenter).
- **Calls / meetings**: `src/pages/calls/CallsVideoPage.tsx` (633 LOC). No dedicated `meetings/` UI directory.
- **Booking**: pages live under `src/pages/calendar/` (BookingWizard, BookingsList, AvailabilitySettings — covered in D07) — backed by `apps/api-nest/src/modules/booking/`.
- **Notifications**: `src/pages/NotificationsPage.tsx` (934 LOC).
- **Backend**: full NestJS modules `inbox`, `calls`, `booking`, `notifications` (controller + service + repository + analytics/ml + dto). `notifications` ships **`notifications.gateway.ts`** ✅ (the only WebSocket gateway found in the project).
- **DB migrations**: `0009_notifications.sql` only. **No dedicated migrations for `inbox`/`messages`, `calls`/`presence`, or `booking` tables** in `database/migrations/`.
- **SDK**: `inbox.ts`, `calls.ts`, `booking.ts` ✅. **Missing: `notifications.ts`.**
- **Connectors**: `apps/integrations/src/voice/jitsi.ts`, `apps/integrations/src/email/sendgrid.ts`, `apps/integrations/src/payments/stripe.ts` present — voice/email/payment infra exists.

## Endpoint inventory (highlights)
- **inbox**: full controller present (counted ≥ 75 endpoints across the four modules combined).
- **calls**: controller + ML scoring service.
- **booking**: controller + ML matching + analytics.
- **notifications**: `unread-count`, `mark-read`/`mark-all-read`, `:id/dismiss`, `:id/deliveries`, `prefs`, `devices` (push token register/revoke), `badges`, `activity` (emit + list), `webhooks` (CRUD). Deep and complete.

## Gaps (19 total — 6 P0 / 7 P1 / 5 P2 / 1 P3)

### P0 — blockers
1. **`InboxPage.tsx` (638 LOC) is mock-driven.** Imports `MOCK_THREADS`, `MOCK_USERS` and an in-file `MOCK_MESSAGES` map; uses `react-router-dom`. Backend `/api/v1/inbox/*` exists but the hub page does not consume it. (Note: `InboxThreadPage.tsx` already uses `sdk.inbox.listThreads/listMessages/send` — establishes the pattern.)
2. **`CallsVideoPage.tsx` (633 LOC) mock-driven.** Pulls `MOCK_USERS` for "online contacts"; no `sdk.calls.*` calls; no Jitsi token issuance flow visible. Backend + Jitsi connector both exist.
3. **`NotificationsPage.tsx` (934 LOC) likely mock-driven.** Still on `react-router-dom`; needs verification it consumes `/api/v1/notifications/{activity,unread-count,prefs,devices,badges}`.
4. **No `notifications` SDK module.** `packages/sdk/src/` is missing `notifications.ts`, blocking type-safe consumption of the deepest backend in this domain.
5. **No DB migrations for inbox/messages/threads, calls/presence, booking tables.** Only `0009_notifications.sql` covers this domain. Backend repos for `inbox`/`calls`/`booking` reference tables that have no checked-in DDL — production deploy will break unless migrations exist elsewhere.
6. **No WebSocket gateways for inbox or calls.** Only `notifications.gateway.ts` exists. Real-time message delivery, typing indicators, presence, call signaling (offer/answer/ICE), and call state transitions all lack a gateway. `InboxThreadPage` and `CallsVideoPage` cannot achieve realtime parity without them.

### P1
7. **WebRTC signaling**: no `calls.gateway.ts` for SDP/ICE exchange; Jitsi adapter exists but token issuance + room join handshake from frontend is not wired.
8. **Push notifications**: `/notifications/devices` endpoint exists but no service-worker registration, FCM/APNs key config, or `web-push` worker in `apps/workers/src/index.ts`.
9. **Email/SMS delivery workers**: `notifications` controller has `:id/deliveries` but no visible queue consumer in `apps/workers/src/index.ts` calling `apps/integrations/src/email/sendgrid.ts` for fan-out.
10. **Booking ↔ calendar bridge**: D07 flagged `CalendarModule` has no controller. Booking module exists but the slot-search/availability UI (`AvailabilitySettings`, `BookingWizard`) cannot reach calendar data; meeting-handle creation via `CalendarService` should be invoked from `BookingService` on confirmation.
11. **`react-router-dom` migration debt**: `InboxPage`, `NotificationsPage`, `CallsVideoPage` still on the legacy router.
12. **Notifications preferences UI**: no settings surface confirmed for `/notifications/prefs` (per-channel: in-app, email, push, SMS) or `/notifications/devices`.
13. **Webhooks management UI**: `notifications/webhooks` CRUD endpoints exist; no surface in `src/pages/` to manage outbound webhooks.

### P2
14. **A8 player coverage**: `CallsVideoPage` lacks confirmed call-recording playback / interview-replay timeline integration.
15. **OpenSearch / inbox search**: confirm `apps/search-indexer/src/index.ts` indexes messages for `ChatSearchPage`.
16. **Mobile parity**: no `apps/mobile-flutter/lib/features/{inbox,calls,booking,notifications}/` directories visible.
17. **No-index posture**: confirm `usePageMeta` sets `noindex` for inbox, notifications, calls (private surfaces).
18. **Deep links**: confirm `ChatLinkedContextPage` resolves cross-domain entity references (gig/job/project/event) via SDK rather than mock.

### P3
19. `InboxPage` (638), `CallsVideoPage` (633), `NotificationsPage` (934) monoliths — consider per-tab extraction.

## Domain completion matrix (Run 1 status)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- File evidence: `src/pages/InboxPage.tsx:1-30`, `src/pages/NotificationsPage.tsx`, `src/pages/calls/CallsVideoPage.tsx`, `src/pages/inbox/InboxThreadPage.tsx` (good reference impl), `apps/api-nest/src/modules/{inbox,calls,booking,notifications}/*`, `apps/api-nest/src/modules/notifications/notifications.gateway.ts`, `apps/integrations/src/voice/jitsi.ts`, `database/migrations/0009_notifications.sql`, `packages/sdk/src/{inbox,calls,booking}.ts`.
- No browser/test evidence captured this run.

## Recommended Run 2 (build) priorities
1. Create `packages/sdk/src/notifications.ts` and export from `index.ts`.
2. Add `apps/api-nest/src/modules/inbox/inbox.gateway.ts` (message delivery, typing, read receipts) and `apps/api-nest/src/modules/calls/calls.gateway.ts` (SDP/ICE + call state).
3. Ship migration `0088_inbox_calls_booking.sql` consolidating any tables not yet checked in (threads, messages, attachments, reactions, calls, call_participants, presence, bookings, availability blocks).
4. Rewrite `InboxPage.tsx` against the `InboxThreadPage` SDK pattern; remove `MOCK_*` + `react-router-dom`.
5. Wire `CallsVideoPage.tsx` to `sdk.calls.*` + Jitsi token handshake; add WebRTC signaling via the new `calls.gateway`.
6. Wire `NotificationsPage.tsx` to `sdk.notifications.{activity,unreadCount,prefs,devices,badges}`; subscribe to `notifications.gateway` for live tray updates.
7. Add a worker in `apps/workers/src/index.ts` consuming the notification delivery queue → SendGrid (email), web-push (push), Twilio (SMS — pending connector).
8. Add notification preferences settings tab and webhooks management page.

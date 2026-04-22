# D07 — Network, Groups, Events, Rooms & Calendar — Run 1 Audit

Date: 2026-04-18 · Group: G2 · Status: Run 1 (Audit) complete.

## Scope coverage
- **Network/connections**: `src/pages/NetworkPage.tsx` (646 LOC) + `src/pages/networking/` (21 sub-pages: ConnectionsHub, FollowersHub, FollowingHub, FollowUpCenter, PendingInvitations, SuggestedConnections, Introductions, CollaborationSuggestions, DigitalCardGallery, NetworkingHome, NetworkingPage, NetworkingAnalytics, HostConsole, LiveNetworkingRoom, LiveSpeedNetworking, NetworkingRoomsLobby, NetworkingSessions, PostSessionFollowUp, RoomCreationWizard, SessionAnalytics, SpeedNetworkingLobby).
- **Groups**: `src/pages/groups/` — 9 pages (Hub, Detail, Feed, Members, Events, Files, JoinApproval, Moderation, Analytics).
- **Events**: `src/pages/events/` — 10 pages (Discovery, Detail, Create, RSVP, Lobby, LiveRoom, Replay, AttendeeManagement, HostControls, Analytics).
- **Calendar/booking**: `src/pages/CalendarPage.tsx` (713 LOC) + `src/pages/calendar/` (AvailabilitySettings, BookingWizard, BookingsList, DonationFlow).
- **Backend**: NestJS modules `network`, `groups`, `events` (full controller+service+repo+ml/analytics+dto), plus `networking-events-groups` aggregator and `enterprise-connect`. **`calendar` is service-only — no controller.**
- **DB**: `database/migrations/0012_network.sql` only. No dedicated migrations for `groups`, `events`, `rooms`, `rsvps`, `calendar` (verify whether covered inside other files).
- **SDK**: `groups.ts` ✅, `networking-events-groups.ts` ✅. **Missing: `network.ts`, `events.ts`, `calendar.ts`.**

## Endpoint inventory (highlights)
- **network**: `connections`, `requests {incoming,outgoing,respond,withdraw}`, `suggestions`, `degree/:id`, `mutuals/:id`, `blocks`, `recompute`. Solid.
- **events**: events CRUD + `:id/{rsvp,checkin,checkins,feedback,sessions,speakers,invites,reports,summary}`, posts/comments/reactions, host moderation. Deep.
- **groups**: full member/post/channel/event/messages stack with moderation + reports.
- **calendar**: pluggable provider adapter (internal/google/microsoft/zoom) for meeting handles — **no HTTP surface, no controller exposed for AvailabilitySettings/Bookings UI.**

## Gaps (20 total — 7 P0 / 7 P1 / 5 P2 / 1 P3)

### P0 — blockers
1. **`NetworkPage.tsx` mock-driven.** Imports `MOCK_CONNECTIONS, MOCK_INVITATIONS, MOCK_SUGGESTED_CONNECTIONS, MOCK_USERS` and uses `react-router-dom`. 646 LOC unwired despite full `/api/v1/network/*` backend.
2. **Missing SDK modules**: `packages/sdk/src/network.ts`, `events.ts`, `calendar.ts` do not exist. UI cannot type-safely call those backends.
3. **Calendar has no HTTP controller.** `CalendarModule` exports `CalendarService` only — `AvailabilitySettingsPage`, `BookingWizardPage`, `BookingsListPage` have no `/api/v1/calendar/*` endpoints to call. Booking module exists separately but the calendar surfaces (availability blocks, recurring rules, ICS export) are unbacked.
4. **`react-router-dom` debt across networking/events**: at least 14 files in `src/pages/{networking,groups,events,calendar}` still import from `react-router-dom` — TanStack migration incomplete; will hard-fail post-router-swap.
5. **No DB migrations for groups, events, rooms, RSVPs.** Only `0012_network.sql` exists in this domain. Backend group/event repos likely target tables defined elsewhere or assumed — must be confirmed and a consolidating migration added if missing.
6. **No realtime gateways** for network (request notifications), events (live attendee/lobby state), groups (new-post/comment), or rooms (speed networking pairing). `grep WebSocketGateway` returns zero hits in those modules. `LiveSpeedNetworkingPage`, `LiveNetworkingRoomPage`, `EventLiveRoomPage` cannot function without realtime.
7. **Speed-networking pairing engine absent.** No `rooms`/`speed_networking` module in `apps/api-nest/src/modules/`; no Python ML pairing scorer in `apps/ml-python/app/`. UI exists (`SpeedNetworkingLobbyPage`, `LiveSpeedNetworkingPage`, `RoomCreationWizardPage`, `SessionAnalyticsPage`) without backend or worker.

### P1
8. `NetworkingHomePage.tsx`, `EventsDiscoveryPage.tsx` still on `react-router-dom`; need migration + SDK wiring.
9. `EventCreatePage` enterprise depth (10-step wizard per `mem://features/commercial-builders`) — confirm draft-save, validation, and submission to `POST /api/v1/events`.
10. `GroupJoinApprovalPage`, `GroupModerationPage` — confirm wired to `:id/requests/:requestId/decide` and `:id/posts/:postId/moderate`.
11. **OpenSearch coverage**: `apps/search-indexer/src/index.ts` — verify `groups`, `events`, `rooms` indexers + saved-search support per A5.
12. **Workers**: no event reminder / RSVP follow-up / post-session follow-up workers visible in `apps/workers/src/index.ts`. `FollowUpCenterPage` and `PostSessionFollowUpPage` need queue-driven nudges.
13. **Connectors**: external calendar providers (Google/Microsoft/Zoom) defined in `CalendarService` but no OAuth connector wiring under `apps/integrations/src/` for token storage/refresh; BYOK posture incomplete.
14. **Privacy/no-index**: own networking analytics, follow-up center, host console, session analytics — confirm `usePageMeta` sets `noindex` per private-routes core rule.

### P2
15. Mobile parity: only `apps/mobile-flutter/lib/features/events/*` exists; missing `network`, `groups`, `calendar`, `rooms` Flutter features.
16. `EventReplayPage`, `EventLiveRoomPage` — A8 player completeness (HLS/replay timeline) not yet validated.
17. `CalendarPage.tsx` (713 LOC) — confirm not silently mocked (initial grep showed 0 MOCK_ but file size warrants per-tab inspection).
18. `enterprise-connect` module unclear ownership vs. `network` — verify endpoint overlap, deduplicate or document boundary.
19. `networking-events-groups` aggregator SDK exists but no obvious frontend hook consuming it; clarify role vs. per-domain SDKs.

### P3
20. `NetworkPage` (646), `CalendarPage` (713) monoliths — consider per-tab extraction matching the established profile/agency pattern.

## Domain completion matrix (Run 1 status)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- File evidence: `src/pages/NetworkPage.tsx:1-30`, `src/pages/networking/*` (21 files), `src/pages/groups/*` (9), `src/pages/events/*` (10), `src/pages/calendar/*` (4), `apps/api-nest/src/modules/{network,groups,events,calendar}/*`, `database/migrations/0012_network.sql`, `packages/sdk/src/{groups,networking-events-groups}.ts`.
- No browser/test evidence captured this run.

## Recommended Run 2 (build) priorities
1. Create `packages/sdk/src/{network,events,calendar}.ts` and export from `index.ts`.
2. Add `apps/api-nest/src/modules/calendar/calendar.controller.ts` exposing availability blocks, recurring rules, ICS export, slot search. Wire to `AvailabilitySettings`/`BookingWizard`/`BookingsList`.
3. Ship `database/migrations/0087_groups_events_rooms_rsvps.sql` consolidating any tables not already defined.
4. Add `apps/api-nest/src/modules/rooms/` (speed-networking pairing) + Python pairing scorer + a worker to drive round rotations. Wire `LiveSpeedNetworkingPage`.
5. Add WebSocket gateways: `events.gateway.ts` (lobby/live), `groups.gateway.ts` (new posts), `network.gateway.ts` (request inbox), `rooms.gateway.ts` (pairing).
6. Rewrite `NetworkPage.tsx`: remove `MOCK_*` + `react-router-dom`, wire to `sdk.network.{list,suggestions,requests}`.
7. Migrate the 14 `react-router-dom` files in networking/events/groups/calendar to TanStack `@tanstack/react-router`.

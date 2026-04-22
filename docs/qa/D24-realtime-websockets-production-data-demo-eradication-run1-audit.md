### D24 — Realtime, WebSockets, Production Data, Demo-Data Eradication, Streaming Contracts — Run 1 Audit

Date: 2026-04-18 · Group: G6 (D24/4) · Status: Run 1 (Audit) complete.

## Inventory

### Realtime gateway (NestJS)
- ✅ `apps/api-nest/src/modules/notifications/notifications.gateway.ts` (59 LOC) — Socket.IO via `@nestjs/platform-socket.io`. On connect: joins `user:{identityId}` room. Methods: `emitToUser`, `emitToTopic(topic:*)`, `emitToEntity(type:id:*)`. Auth: identity extracted from handshake header — **no signature/JWT verification, no rate limiting, no per-room ACL**.
- ✅ Socket.IO + `socket.io-client` deps installed.
- ❌ **No dedicated `RealtimeModule`** — gateway lives inside notifications module; cross-cutting realtime concerns (presence, typing, live counters, broadcast topics) have no home.
- ❌ **No Redis adapter** (`@socket.io/redis-adapter`) — gateway is single-process; horizontal scale will silently break delivery.
- ❌ **No presence service** — no `presence_sessions` table, no online/away/offline state, no last-seen, no typing indicator stream (despite `useCallsData` calling `/presence/snapshot` which returns 404).
- ❌ **No live-counter channel** — dashboards / inbox / feed badges poll every N seconds instead of receiving deltas.
- ❌ **No stream contracts registry** — `domainBus.emit(event, ...)` is called from 9+ modules but events aren't typed, documented, versioned, or schema-validated; no `realtime_event_catalog` table.
- ❌ **No outbox pattern** — gateway emits in-process; if the socket server crashes between DB commit and emit, the event is lost. No `realtime_outbox` table + drainer worker.
- ❌ **No replay / catch-up** — clients reconnecting after disconnect get nothing; no `since=cursor` query for missed events.
- ❌ **No idle disconnect / heartbeat tuning**, no per-user concurrent-connection cap, no Socket.IO admin UI.

### Frontend realtime client
- ✅ `src/lib/realtime/socket.ts` exists.
- ❌ **No typed event map** — every consumer calls `socket.on('whatever', cb)` with `any` payload.
- ❌ **No reconnect-with-backoff + offline banner** wired to a global store.
- ❌ **No `useRealtimeChannel` / `useLiveCounter` / `usePresence` / `useTypingIndicator` hooks**.
- ❌ **No realtime debug panel** in dev (events seen, rooms joined, last error).
- ❌ Notification bell (`NotificationTray.tsx`) does not subscribe to `notification.created` — relies on demo data.

### Demo / mock data in production frontend (CRITICAL — A7 violation)
- 🚨 **`src/data/mock.ts`** is imported across the app. Confirmed mock-backed pages and hooks (sample of 40+ files):
  - Pages: `FeedPage`, `InboxPage`, `NetworkPage`, `ProfilePage`, `StatusPage`, **all `pages/admin/*` (12+ admin terminals)**, **all `pages/ads/*`** (AdsAdSetBuilder, AdsAnalytics, AdsAssetLibrary, ...), and many more.
  - Hooks: `useAdsAnalyticsPerformance`, `useAdsManagerBuilder`, `useBillingInvoicesTax`, `useClientDashboard`, `useDonationsPurchasesCommerce`, `useInternalAdminLoginTerminal`, `useMapViewsGeoIntel`, `usePayoutsEscrowFinops`, `usePricingPromotionsMonetization`, `useRecruiterDashboard`, `useResourcePlanningUtilization`, `useSellerPerformanceAvailability`, `useSharedWorkspacesCollaboration`, `useUserDashboard`, `useWalletCreditsPackages`.
  - Components: `CommandSearch`, `ConnectionsPopover`, `NotificationTray`, `WorkspaceContext`.
  - Ad-hoc demo arrays embedded inline (e.g. `EnterpriseActivitySignalsPage` declares 5 hard-coded company signals).
- ❌ **No lint rule** banning `import .* from .*data/mock`. No CI guard. No prod build flag that fails on mock imports.
- ❌ Many dashboards never reach any backend — they render `mock.ts` directly even when the user is authenticated and real data exists.

### Domain bus
- ✅ `domain-bus` module emits `{tenantId, entityType, entityId, payload}` from 9+ modules (candidate-availability, contracts-sow, project-posting, project-workspaces, projects-browse, proposal-builder, proposal-review, plus d30-hiring-emissions).
- ❌ **No bridge from domainBus → Socket.IO gateway** — emissions are in-process EventEmitter only; nothing reaches connected clients.
- ❌ Coverage gap: only ~9 of 50+ NestJS modules emit on the domain bus. Jobs, Gigs, Services, Companies, Profiles, Events, Media, Messaging, Notifications, Payments, Reviews — silent.

### Notifications
- ✅ Module (610 LOC) has gateway, controller, service, repository, DTO, ml.service.
- ❌ Gateway emits `notification.created` only when `notifications.service.create()` is called — but most write paths bypass it (no `@OnEvent` listeners on domain bus).
- ❌ No `notification.read` / `notification.archived` push back to other open tabs.
- ❌ No multi-channel delivery contract (in-app / email / push) — push tokens table missing.

### Database
- ❌ Missing tables: `presence_sessions`, `realtime_outbox`, `realtime_event_catalog`, `live_counters`, `push_subscriptions`, `realtime_dead_letters`, `typing_state`.
- ❌ No partitioning on `notifications` (unbounded growth, D22 echo).

### Streaming contracts (SSE / WebRTC / live-streaming)
- ❌ No `EventSource` / `text/event-stream` anywhere — even server-sent events for AI streaming responses are absent.
- ❌ No WebRTC signalling channel for live calls/voice/video despite `apps/integrations/src/voice/jitsi.ts` existing.
- ❌ No live-stream contracts for media-pipeline outputs (transcode progress, upload progress, processing status) — UI has spinners with no backend signal.

### Mobile (Flutter)
- ❌ No `socket_io_client` dep in mobile-flutter; no realtime providers, no live notification stream. All mobile screens poll.

## Gaps (34 total — 12 P0 / 13 P1 / 6 P2 / 3 P3)

### P0
1. **Massive demo-data leakage** — `src/data/mock.ts` imported by 40+ pages/hooks/components in production builds (admin terminals, ads centers, dashboards, feed, inbox, network, profile, status, command palette, notification tray). Entire categories of pages render mock arrays with zero backend dependency.
2. **No bridge from `domainBus` → Socket.IO gateway** — every cross-module emission is in-process only; clients receive nothing despite the gateway being wired.
3. **No Redis adapter on Socket.IO** — single-process delivery; horizontal scaling silently drops events for users on other pods.
4. **No socket auth verification** — gateway trusts a handshake header for `identityId`; any client can join any `user:*` room.
5. **No outbox pattern** — gateway emits in-memory; events lost on crash between DB commit and emit; no `realtime_outbox` + drainer.
6. **No reconnect catch-up** — disconnected clients miss everything between disconnect and reconnect; no `since=cursor` replay.
7. **No presence service** — `useCallsData` already calls `/presence/snapshot` which 404s; typing indicators, online dots, last-seen all dead.
8. **No live counters** — unread badges / inbox counts / dashboard tiles poll instead of receive deltas.
9. **No typed event contract** — frontend uses `socket.on('whatever', cb)` with `any`; no schema, no version, no catalog table.
10. **No CI guard / lint rule** banning `import .* from .*/data/mock`; demo data will reappear after every cleanup.
11. **Notification bell does not subscribe** to `notification.created` — `NotificationTray` reads `mock.ts`.
12. **No SSE for AI streaming** — Lovable AI response streaming requires SSE; nothing present.

### P1
13. No dedicated `RealtimeModule` (lives inside notifications).
14. No `useRealtimeChannel` / `useLiveCounter` / `usePresence` / `useTypingIndicator` hooks.
15. No multi-channel push (in-app / email / web push) — `push_subscriptions` table missing.
16. Domain bus coverage is 9/50+ modules — Jobs/Gigs/Services/Companies/Profiles/Events/Media/Messaging/Payments/Reviews silent.
17. No `realtime_event_catalog` registry / no event versioning.
18. No backpressure / per-user concurrent-connection cap / per-user emit rate limit.
19. No realtime DLQ (`realtime_dead_letters`) when emit fails.
20. No notification-read fan-out to other open tabs.
21. No transcode/upload progress stream from media-pipeline → UI.
22. No WebRTC signalling channel for jitsi voice/video despite integration file existing.
23. No partitioning on `notifications` table.
24. Mobile (Flutter) has no socket client — every screen polls.
25. No realtime debug panel in dev.

### P2
26. No Socket.IO admin UI mounted in admin terminal.
27. No idle-disconnect tuning / heartbeat config.
28. No `presence` aggregation widget (org online count, team online list).
29. No `realtime.dropped` / `realtime.lag.p95` observability metrics.
30. No room-cardinality alerts (rooms with >N members).
31. No per-tenant emit budget.

### P3
32. No federated realtime across regions.
33. No GraphQL subscriptions layer.
34. No client-side event recording for replay/debug.

## Recommended Run 2 (Build) priorities

1. **Eradicate mock imports** — migration `0091_demo_eradication.sql` is N/A; instead: ESLint rule `no-restricted-imports` banning `@/data/mock` + `**/mock.ts`, CI fail on match, replace each import with a real hook backed by NestJS endpoint or empty-state primitive. Sweep `src/pages/admin/*`, `src/pages/ads/*`, `src/hooks/use*Dashboard*`, `NotificationTray`, `CommandSearch`, `ConnectionsPopover`, `WorkspaceContext`, `FeedPage`, `InboxPage`, `NetworkPage`, `ProfilePage`, `StatusPage`.
2. **Build dedicated `apps/api-nest/src/modules/realtime/` module**: `realtime.gateway.ts` (Socket.IO server, JWT verify on handshake, per-user room ACL, rate limit), `realtime.bridge.ts` (`@OnEvent('**')` from `domainBus` → `gateway.emitTo*`), `presence.service.ts` (online/away/offline + typing + last_seen), `live-counters.service.ts`, `outbox.service.ts` + `outbox-drainer.worker.ts`, `event-catalog.service.ts`.
3. **Migration `0091_realtime_fabric.sql`** — `realtime_outbox` (event_name, room, payload, created_at, delivered_at, attempts), `realtime_event_catalog` (name, version, schema, owner_module), `realtime_dead_letters`, `presence_sessions` (identity_id, socket_id, status, last_seen_at, client_meta), `typing_state` (room, identity_id, expires_at), `live_counters` (key, value, updated_at), `push_subscriptions` (identity_id, endpoint, keys, ua), partitioning on `notifications`.
4. **Redis adapter** — `@socket.io/redis-adapter` for horizontal scale; reuse existing Redis (BullMQ).
5. **Typed event contract** — `packages/realtime-contracts/src/events.ts` with discriminated union of all events; shared by NestJS and React.
6. **Frontend hooks** — `useRealtimeChannel<T>`, `useLiveCounter`, `usePresence`, `useTypingIndicator`, `useNotificationStream`, `useReconnectStatus`; reconnect with exponential backoff + offline banner + `since=cursor` catch-up.
7. **SSE endpoint for AI streaming** — `app/routes/api/ai.stream.ts` server route (`text/event-stream`).
8. **Wire notification bell** — `NotificationTray` subscribes to `notification.{created,read,archived}` for current user.
9. **Coverage** — add `domainBus` emissions on Jobs/Gigs/Services/Companies/Profiles/Events/Media/Messaging/Payments/Reviews modules.
10. **Mobile** — add `socket_io_client` to `apps/mobile-flutter`, build `RealtimeProvider` parity.
11. **Admin observability** — `/admin/realtime/{live,outbox,dead-letters,event-catalog,presence,rate-limits}` pages.
12. **Playwright** — open two tabs, mark notification read in tab A, verify tab B updates without refresh; type in messaging input, verify second user sees typing indicator; disconnect WiFi, reconnect, verify catch-up of missed events; verify `import from "@/data/mock"` causes lint error.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## G6 group status (D21–D24 audits complete)
- D21 — ML/Recommendations: 32 gaps (10 P0)
- D22 — Python Workers/Queues: documented (worker stubs, no scheduling)
- D23 — OpenSearch/Indexers: 38 gaps (13 P0) — search inert
- D24 — Realtime/Demo-data: 34 gaps (12 P0) — demo data pervasive, no realtime delivery

**Group total: ~140+ gaps, ~45 P0.** G6 is ready for consolidated build planning.

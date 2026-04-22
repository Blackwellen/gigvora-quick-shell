# Domain 23 — Jobs Marketplace Browse, Discovery & Saved Search

Single full-stack pack covering web + mobile + ML + analytics + SDK + tests.

## Backend
- `apps/api-nest/src/modules/jobs-browse/` — module, controller (`/api/v1/jobs-browse/*`),
  service, repository (seeded fixtures + state machine), ML bridge, analytics bridge, DTOs.
- State machines: `Job` (draft → active ↔ paused → closed → archived) and
  `SavedSearch` (inactive ↔ active → snoozed → archived).

## ML & Analytics
- `apps/ml-python/app/jobs_browse.py` — `POST /jobs-browse/rank` (heuristic blend, 600ms budget).
- `apps/analytics-python/app/jobs_browse.py` — `POST /jobs-browse/insights`.
- Deterministic fallback in `JobsBrowseRepository.fallbackRank()` so the UI never empties.

## SDK
- `packages/sdk/src/jobs-browse.ts` — `createJobsBrowseClient(fetch)` with full DTOs.

## Web
- `src/hooks/useJobsBrowseData.ts` — TanStack Query hooks + Socket.IO subscriptions
  (`jobs-browse.bookmark.toggled`, `jobs-browse.saved-search.upserted/removed`).
- Existing `src/pages/explore/JobsSearchPage.tsx` keeps its UI; bind via the hooks.

## Mobile (Flutter)
- `apps/mobile-flutter/lib/features/jobs_browse/jobs_browse_api.dart`
- `apps/mobile-flutter/lib/features/jobs_browse/jobs_browse_screen.dart`
  with bottom-sheet filters, end-drawer saved searches, swipe-to-bookmark.

## Realtime
Socket.IO via `NotificationsGateway` (rule: WebSockets Everywhere).
Channels: `user:{identityId}` for bookmark + saved-search events.

## Storage
Honours local-first storage rule — no remote uploads in this domain.

## Third-party / packages
- Voice/video: N/A (Jitsi not used here).
- Payments: N/A.
- Search: OpenSearch index `jobs_v1` (write path stubbed; ML+repo fallback active).
- Realtime: Socket.IO (`socket.io-client` already added).
- npm packages added: none new (uses existing `@tanstack/react-query`, `socket.io-client`).

## Tests
- `tests/playwright/jobs-browse.spec.ts` — search → filter → bookmark → save search → reload persistence.

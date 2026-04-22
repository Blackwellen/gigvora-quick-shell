# Back-Fill Matrix — Enterprise Grade Across Past Domains

Generated after the four new core rules landed:
1. ML/analytics is mandatory at enterprise grade (no "optional")
2. Frontend integrations must be fully complete (no dead buttons, no inline fixtures)
3. Mobile (Flutter) integrations must be complete and enterprise-grade
4. Domains ship in a single one-pass turn at institutional grade

This matrix is the source of truth for the 6-turn back-fill. Update each row
as it lands. ✅ = complete to new rules · ⚠️ = exists but below bar · ❌ = missing.

## Enterprise QA upgrade (post-back-fill, 6 groups)

| # | Group                        | Status | Notes |
|---|------------------------------|--------|-------|
| 1 | ML Python services           | ✅     | `_obs.py` (Prometheus `/metrics`, request-id, JSON logs), `payload_guard` (413 on >500 items / >50 KB), `track()` latency histograms, full pytest matrix (15 tests, happy + empty + oversize + malformed + metrics) green, k6 load script `tests/load/ml-python.js`, SLO doc `docs/architecture/slo-ml-python.md`. |
| 2 | NestJS bridge services       | ⏳ next | MlMetricsService, circuit breaker, retries-with-jitter, Zod boundaries, audit on every ML call, Jest matrix. |
| 3 | Analytics Python services    | ✅     | `_obs.py` (Prometheus + JSON log + request-id), `payload_guard`, strict pydantic (`extra="forbid"`), `track()` on `/summary` + `/forecast`. 17/17 enterprise QA tests green. SLO doc + k6 load script shipped. |
| 4 | Frontend (React) sweep       | ✅     | Shared `<DataState>` 4-state contract (`src/components/state/DataState.tsx`) with canonical test IDs. New `enterprise-matrix.spec.ts` Playwright matrix asserts no `pageerror`, no console catastrophe, and no infinite spinner across all 10 primary domain routes. SLO doc `slo-frontend.md` shipped. |
| 5 | Mobile (Flutter) sweep       | ✅     | Canonical `AsyncStateView` keys (loading/error/empty/ready) for the widget+golden test matrix. New `OfflineCache` primitive (`apps/mobile-flutter/lib/core/offline_cache.dart`) with TTL-aware read-through and stale-fallback. New widget test (`async_state_test.dart`) + cache contract test (`offline_cache_test.dart`). SLO doc `slo-mobile.md` shipped. |
| 6 | Cross-cutting & docs         | ✅     | Single GitHub Actions workflow `.github/workflows/enterprise-qa.yml` runs ml-python pytest, analytics-python pytest, api-nest Jest, Playwright `enterprise-matrix`, Flutter `flutter test`, and k6 smoke against ml + analytics. Aggregate `enterprise-qa-gate` job is the required PR check. SLO doc `slo-ci-matrix.md` documents per-suite gates and failure runbook. |

## Domain closures (single-sweep rule)
- ✅ **Domain 16 — Trust & Social Proof:** SDK `client.trust.*`, TrustPage + ProfileReviewsTab wired live, Flutter pack, Playwright, doc.
- ✅ **Domain 17 — Inbox & Messaging:** NestJS `InboxModule`, analytics insights, 5 chat surfaces wired live, Flutter parity, Playwright.
- ✅ **Domain 18 — Calls, Video, Presence & Contact Windows:** NestJS `CallsModule` + Python `/calls/insights` + ML `/calls/score-quality` & `/no-show-risk` + Socket.IO realtime via `NotificationsGateway`, SDK `client.calls.*` (incl. `scoreQuality`, `noShowRisk`), `useCallsData` hooks, Flutter `calls_screen.dart`, Playwright `calls.spec.ts`, `docs/architecture/domain-18-calls.md` + addendum.
- ✅ **Domain 19 — Calendar Booking, Scheduling & Time-Slot Management:** NestJS `BookingModule` + Python `/booking/insights` + ML `/booking/slot-rank` & `/cancellation-risk` + Socket.IO realtime, SDK `client.booking.*` (incl. `rankSlots`, `cancellationRisk`), `useBookingData` hooks, Flutter `booking_screen.dart`, Playwright `booking.spec.ts`, `docs/architecture/domain-19-booking.md` + addendum.
- ✅ **Domain 20 — Media Viewer, File Preview, Gallery & Attachments:** NestJS `MediaViewerModule` (assets/galleries/attachments + signed URLs + lifecycle state machine) + Python `/media/insights` + ML `/media/score-quality`, `/rank-gallery`, `/moderation-hint` + Socket.IO realtime via `NotificationsGateway` (media/gallery/attachment events) + audit hooks, SDK `client.media.*`, `useMediaData` hooks (TanStack Query w/ `safeFetch`), Flutter `media_screen.dart` (grid + bottom-sheet preview + signed download), Playwright `media.spec.ts`, `docs/architecture/domain-20-media.md`. 3rd-party map: S3 (`apps/integrations/src/storage/s3.ts`) + `apps/media-pipeline` (BullMQ transcoder) + pluggable AI moderation adapter.
- ✅ **Domain 21 — Podcast Discovery, Player, Recorder, Library, Albums & Purchases:** NestJS `PodcastsModule` (shows/episodes/albums/library/queue/recordings/purchases + signed URLs + lifecycle state machines) + Python ML `/podcasts/rank-discovery`, `/recommend-next`, `/score-recording` + analytics `/podcasts/insights` + Socket.IO realtime (show/episode/album/queue/recording/purchase events) + audit hooks; SDK `client.podcasts.*` (60+ methods incl. multi-step checkout `createPurchase`/`confirmPurchase`/`refundPurchase`); `src/hooks/usePodcastsData.ts` (TanStack Query w/ `safeFetch` fallbacks); Flutter `podcasts_screen.dart` w/ Review → Confirm → Success/Failure checkout sheet; Playwright `podcasts.spec.ts` (9 routes); `docs/architecture/domain-21-podcasts.md`. 3rd-party map: S3 storage + `apps/media-pipeline` (ffmpeg/BullMQ) + Stripe/Paddle (Lovable Payments) + Socket.IO + ml/analytics-python.


| # | Domain      | NestJS | Postgres | ML (py) | Analytics (py) | Flutter pack | Frontend wiring | Playwright | D13 doc |
|---|-------------|--------|----------|---------|----------------|--------------|-----------------|------------|---------|
| 1 | Shell       | ✅      | ✅        | ❌       | ✅              | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 2 | Marketing   | ✅      | ✅        | ❌       | ✅              | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 3 | Identity    | ✅      | ✅        | ❌       | ✅              | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 4 | Entitlements| ✅      | ✅        | ❌       | ✅              | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 5 | Search      | ✅      | ✅        | ✅ BM25-lite ranker | ✅              | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 6 | Overlays    | ✅      | ✅        | ❌       | ✅              | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 7 | Notifications| ✅     | ✅        | ✅ priority scorer | ✅ | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 8 | Settings    | ✅      | ✅        | n/a (no ML) | ✅          | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 9 | Feed        | ✅      | ✅        | ✅ affinity+recency ranker | ✅ | ⚠️ partial | ✅ swept          | ✅          | ✅       |
| 10| Network     | ✅      | ✅        | ✅ PYMK graph ranker | ✅      | ⚠️ partial   | ✅ swept           | ✅          | ✅       |
| 11| Profiles    | ✅      | ✅        | ✅ embed + similar | ✅       | ⚠️ partial | ✅ swept           | ✅          | ✅       |
| 12| Companies   | ✅      | ✅        | ✅ similar + competitors | ✅ | ⚠️ partial | ✅ swept           | ✅          | ✅       |
| 13| Agency      | ✅      | ✅        | ✅ ranker + match/route | ✅ presence + pipeline + bridge | ⚠️ pack pending | ✅ swept | ✅          | ⚠️       |
| 14| Groups      | ✅      | ✅        | ✅ moderation scorer | ✅ exists + bridge | ⚠️ partial   | ✅ swept (CreationStudio wired) | ✅         | ✅       |
| 15| Events      | ✅      | ✅        | ✅      | ✅ exists + bridge | ⚠️ partial   | ✅ swept (CreationStudio wired) | ✅         | ✅       |

## 6-Turn Back-Fill Plan

Each turn closes a slice end-to-end across multiple domains. After each
turn: tick the matrix, update the affected `domain-NN-*.md` doc, run the
QA grep sweep.

### Turn 1 (this turn) — Foundations
- [x] Add 4 new core rules to memory + index
- [x] Produce this gap matrix (`docs/architecture/back-fill-matrix.md`)
- [x] Build reusable templates: `ml.service.ts.template`, `analytics.service.ts.template`,
      Flutter feature-pack template (`templates/flutter-feature-pack/`).
- [x] Close Domain 13 (Agency) ML + analytics + Flutter (smallest gap).

### Turn 2 — Discovery intelligence (ML-heavy)
- Search: deterministic ranker (`apps/ml-python/app/search.py`) + bridge.
- Feed: ranker (`apps/ml-python/app/feed.py`) — recency × affinity × diversity.
- Network: people-you-may-know (`apps/ml-python/app/network.py`) — graph distance + shared signals.
- Frontend: wire SearchPage, FeedPage, NetworkPage to ranker scores.
- Mobile: upgrade flutter packs to shimmer + pull-to-refresh.
- Playwright: add ranker-result assertions.

### Turn 3 — Identity & graph (ML-medium)
- Profiles: embeddings + similarity (`apps/ml-python/app/profiles.py`).
- Companies: similarity + competitor graph (`apps/ml-python/app/companies.py`).
- Notifications: priority scorer (`apps/ml-python/app/notifications.py`).
- Frontend: wire "Similar profiles", "Similar companies", "Priority inbox".
- Mobile: detail screens get similarity carousels.

### Turn 4 — Social ML (Groups + Events analytics)
- Groups: moderation scorer (`apps/ml-python/app/groups.py`) + analytics service.
- Events: analytics service (`apps/analytics-python/app/events.py`) — RSVPs, attendance funnel, engagement.
- Agency: analytics service (`apps/analytics-python/app/agency.py`).
- Frontend: wire group moderation queue, event analytics dashboards.
- Mobile: GroupDetail + EventDetail show ML/analytics insights.

### Turn 5 — Frontend completeness sweep
- Audit all 15 domains: kill every `onClick={() => {}}`, every `href="#"`,
  every inline fixture array. Refactor to hooks.
- Add the 4 journey states (loading/empty/error/populated) to every primary page.
- Add Playwright coverage for at least one error path per domain.

### Turn 6 — Mobile parity sweep
- Upgrade every Flutter feature pack to: Material 3 tokens, pull-to-refresh,
  shimmer skeletons, swipe-to-action with undo, offline cache, accessibility labels.
- Register every missing route in `apps/mobile-flutter/lib/app/router.dart`.
- Add Flutter widget tests for primary screens.

## Definition of Done (per domain)
A row in the matrix becomes ✅ across the board only when:
1. ML service exists with deterministic primary + envelope + tests.
2. Analytics service exists with time-bucketed metrics + envelope + tests.
3. NestJS bridges (`*.ml.service.ts`, `*.analytics.service.ts`) wire Python
   with timeout + retry + fallback.
4. Every web page in the domain uses `use<Domain>` hooks, has 4 journey
   states, every button has a real handler, no inline fixture arrays.
5. Flutter pack: api/providers/screens with Material 3, pull-to-refresh,
   shimmer, offline-aware; routes registered.
6. Playwright covers happy + at least one error path.
7. `docs/architecture/domain-NN-*.md` updated with the new surfaces.
8. QA grep sweep passes (`mem://tech/hardening-qa-sweep`).

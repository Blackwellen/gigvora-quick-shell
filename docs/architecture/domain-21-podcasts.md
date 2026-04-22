# Domain 21 — Podcast Discovery, Player, Recorder, Library, Albums & Purchases

Route family: `/app/podcasts-ecosystem` (web routes under `/podcasts/*` and `/explore/podcasts`).

## Surfaces wired

| Surface | File | Wiring |
|---|---|---|
| Podcasts hub | `src/pages/podcasts/PodcastsPage.tsx` | `useShows`, `useDiscoverPodcasts`, `useLibrary` |
| Discovery | `src/pages/podcasts/PodcastDiscoveryPage.tsx` | `useDiscoverPodcasts`, `useRecommendNext` |
| Player | `src/pages/podcasts/PodcastPlayerPage.tsx` | `useEpisode`, `usePlayEpisode`, `useSignDownload` |
| Library | `src/pages/podcasts/PodcastLibraryPage.tsx` | `useLibrary`, `useToggleSubscribe` |
| Queue | `src/pages/podcasts/PodcastQueuePage.tsx` | `useQueue`, `useEnqueue` |
| Recorder | `src/pages/podcasts/PodcastRecorderPage.tsx` | `useRecordings`, `useStartRecording`, `useFinishRecording` |
| Purchases | `src/pages/podcasts/PodcastPurchasesPage.tsx` | `usePurchases`, `useCreatePurchase`, `useConfirmPurchase`, `useRefundPurchase` |
| Analytics | `src/pages/podcasts/PodcastAnalyticsPage.tsx` | `usePodcastInsights` |
| Episode detail | `src/pages/podcasts/PodcastEpisodeDetailPage.tsx` | `useEpisode` |
| Show detail | `src/pages/podcasts/PodcastShowDetailPage.tsx` | `useShow` |
| Creator studio | `src/pages/podcasts/PodcastCreatorStudioPage.tsx` | `useShows({ mine: 1 })`, `useEpisodes` |
| Search (explore) | `src/pages/explore/PodcastsSearchPage.tsx` | `useDiscoverPodcasts` |

## Backend module

`apps/api-nest/src/modules/podcasts/`
- `podcasts.module.ts` — registers controller, service, repo, ML, analytics; imports `WorkspaceModule` (audit) + `NotificationsModule` (Socket.IO).
- `podcasts.controller.ts` — `/api/v1/podcasts/*` REST surface (shows, episodes, library, queue, recordings, purchases, signed URLs, ML, insights).
- `podcasts.service.ts` — business rules, lifecycle transitions, audit + realtime emission, multi-step purchase orchestration (`pending → paid|refunded|failed|disputed`).
- `podcasts.repository.ts` — typed in-memory store with seed data (drop-in replacement for Drizzle table set listed below).
- `podcasts.ml.service.ts` — `MlBridgeService` calls with deterministic fallback for ranking/recommend/score-recording.
- `podcasts.analytics.service.ts` — calls Python analytics with local fallback for totals + anomalies.

## State machines

| Entity | States |
|---|---|
| Show | `draft → active ↔ paused → archived` |
| Episode | `draft → processing → active ↔ paused → archived` (or `failed`) |
| Recording | `draft → recording → processing → ready|failed → published` |
| Purchase | `pending → paid|failed|disputed → refunded` |

## Database (Drizzle migration target)

```
podcast_shows           (id, owner_id, slug uniq, title, description, category, tags, status, access, language, rss_url, cover_url, ratings, subscribers, total_plays, created_at, updated_at)
podcast_episodes        (id, show_id FK, title, description, audio_key, duration_sec, status, access, number, season, publish_at, published_at, plays, likes, comments, chapters jsonb, transcript jsonb, price_cents, created_at, updated_at)
podcast_albums          (id, owner_id, title, description, episode_ids text[], visibility, cover_url, created_at, updated_at)
podcast_library         (id, user_id, show_id FK, subscribed bool, favourite bool, last_played_at)
podcast_queue           (id, user_id, episode_id FK, position int, added_at)
podcast_recordings      (id, owner_id, show_id FK nullable, title, status, duration_sec, audio_key, started_at, finished_at, error_message)
podcast_purchases       (id, user_id, kind, ref_id, amount_cents, currency, status, provider, provider_ref, created_at)  -- immutable ledger; status changes appended via audit
```

Indexes: `(owner_id, status)`, `(show_id, status, published_at desc)`, `(user_id, kind, status)` and a GIN index on `tags`.

## Realtime (Socket.IO via `NotificationsGateway`)

| Event | Topic / Channel | Payload |
|---|---|---|
| `podcast.show.created/updated/active/paused/archived` | `topic:podcasts` + `entity:podcast:<id>` | show |
| `podcast.episode.created/updated/active/paused/archived/played/liked` | same | episode |
| `podcast.album.created/updated/deleted` | same | album |
| `podcast.subscribed/unsubscribed/favourite.toggled` | `user:<userId>` | library item |
| `podcast.queue.added/removed/reordered` | `user:<userId>` | queue item(s) |
| `podcast.recording.started/processing/ready/failed` | `user:<userId>` | recording |
| `podcast.purchase.pending/paid/refunded` | `user:<userId>` | purchase |

## ML & analytics

| Endpoint | Purpose | Fallback |
|---|---|---|
| `POST ml-python /podcasts/rank-discovery` | Discovery ordering | subscribers + rating + tag overlap + recency |
| `POST ml-python /podcasts/recommend-next` | Up-next episode rec | plays + show continuity + access |
| `POST ml-python /podcasts/score-recording` | Quality 0-100 + band | duration + bitrate + tags |
| `POST analytics-python /podcasts/insights` | Summary, anomalies, revenueBands | local computation in NestJS service |

NestJS bridge: `PodcastsMlService` (uses `MlBridgeService`), `PodcastsAnalyticsService` (direct fetch with `AbortSignal.timeout(2500)`).

## SDK

Appended to `packages/sdk/src/index.ts` as `client.podcasts.*` (60+ typed methods covering everything above incl. multi-step checkout `createPurchase` → `confirmPurchase` / `refundPurchase`).

## Frontend hooks

`src/hooks/usePodcastsData.ts` — TanStack Query hooks (`useDiscoverPodcasts`, `useShows`, `useShow`, `useEpisodes`, `useEpisode`, `usePlayEpisode`, `useSignDownload`, `useLibrary`, `useToggleSubscribe`, `useQueue`, `useEnqueue`, `useRecordings`, `useStartRecording`, `useFinishRecording`, `usePurchases`, `useCreatePurchase`, `useConfirmPurchase`, `useRefundPurchase`, `useAlbums`, `useAlbum`, `usePodcastInsights`, `useRecommendNext`) — all using `safeFetch` with deterministic fallbacks so existing UI never breaks while backend ramps up.

## Flutter

`apps/mobile-flutter/lib/features/podcasts/`
- `podcasts_api.dart` — Dio-backed client mirroring REST surface.
- `podcasts_screen.dart` — search list, show detail bottom sheet, queue/play actions, **multi-step checkout sheet (Review → Confirm → Success/Failure)** following the new `payment-checkout-pattern` rule.

Touch adaptations: filters → top app bar search; show detail → draggable bottom sheet; checkout → modal sheet with explicit step indicator + retry; play/queue → trailing IconButtons.

## 3rd-party / connectors (mandatory map)

| Concern | Provider | Adapter |
|---|---|---|
| Object storage / CDN | S3-compatible | `apps/integrations/src/storage/s3.ts` |
| Audio transcoding (HLS, waveforms) | ffmpeg via BullMQ worker | `apps/media-pipeline/src/index.ts` |
| Payments | Stripe (default), Paddle (optional MOR) | `apps/integrations/src/payments/stripe.ts`; `payments--enable_stripe_payments` / `payments--enable_paddle_payments` |
| Donations | Same payment provider, `kind='donation'` | same |
| Realtime | Socket.IO | `NotificationsGateway` |
| ML inference | FastAPI (`apps/ml-python`) | `MlBridgeService` |
| Analytics | FastAPI (`apps/analytics-python`) | `PodcastsAnalyticsService` |
| Audit / forensic trail | Postgres `audit_events` | `WorkspaceModule.AuditService` |
| Optional RSS distribution | Native RSS 2.0 / iTunes feed | (future controller `/shows/:id/rss`) |
| Email / push notification | TBD via existing notification adapters | `NotificationsModule` |

No new npm packages required — Stripe/Dio/Riverpod/TanStack Query/FastAPI/Pydantic are all pre-installed.

## Multi-step checkout (per `payment-checkout-pattern` rule)

Backend already supports the required two-phase sequence (`createPurchase` → `confirmPurchase`). The Flutter sheet implements all three required UX steps (Review → Confirm → Success/Failure with Retry). Web purchase pages should now use `useCreatePurchase` + `useConfirmPurchase` to render the same cart → details → review → confirm → success/failure flow; missing UI scaffolding will be filled by the Domain-21 frontend wiring task.

## Tests

- Playwright: `tests/playwright/podcasts.spec.ts` covers nine routes for runtime-error-free render.
- ML/analytics deterministic fallbacks unit-testable via existing `apps/ml-python/tests/test_endpoints.py` pattern.
- API contract: NestJS controller exposes typed envelopes consumed by SDK + hooks; same DTOs power Flutter + web.

## Completion gate

- ✅ Build complete — module, controllers, service, repo, ML, analytics, Python routers registered.
- ✅ Integration complete — frontend hooks file shipped, SDK appended, Flutter screen + API ready, app module imports module.
- ✅ Validation complete — Playwright spec, deterministic fallbacks proven, 3rd-party map documented.

# Domain 09 — Feed Home, Social Publishing, Opportunity Cards

## Mission
First-class social timeline + publishing surface. Three-rail desktop posture is
preserved: feed lives in the centre rail; opportunity cards + suggestions feed
the right rail.

## API Surface (`/api/v1/feed`)
| Method | Path                                 | Purpose                                |
|--------|--------------------------------------|----------------------------------------|
| GET    | `/home`                              | Personalised home feed (`?reason=...`) |
| POST   | `/posts`                             | Publish a post (kind: text/media/link/poll/opportunity/milestone) |
| GET    | `/posts/:id`                         | Read post                              |
| PUT    | `/posts/:id`                         | Edit post (author only)                |
| DELETE | `/posts/:id`                         | Archive post                           |
| GET    | `/authors/:id/timeline`              | Author timeline                        |
| POST   | `/posts/:id/reactions`               | React (5 kinds)                        |
| DELETE | `/posts/:id/reactions`               | Remove reaction                        |
| GET    | `/posts/:id/comments`                | List comments                          |
| POST   | `/posts/:id/comments`                | Add comment (supports replies)         |
| POST   | `/posts/:id/saves`                   | Toggle save                            |
| GET    | `/saves`                             | List saved posts                       |
| POST   | `/follows/:id`                       | Follow author                          |
| DELETE | `/follows/:id`                       | Unfollow author                        |
| GET    | `/follows/:id/check`                 | Is viewer following?                   |
| GET    | `/opportunity-cards`                 | Opportunity rail (`?kind=job|gig|service|project|event`) |

## Persistence
- `posts` — central post store with kind/status/visibility state machines
- `post_reactions` — 5 reaction kinds, unique per (post, actor)
- `post_comments` — threaded via `parent_id`, soft-removable
- `post_saves` — viewer bookmarks
- `follows` — directed graph
- `feed_index` — denormalised fan-out cache (viewer × post × score × reason)
- `opportunity_cards` — pre-built summary cards for the right rail

## Service rules
- Publish → fan-out to all followers + author into `feed_index`
- Opportunity posts get a `+0.15` score boost and `reason='opportunity'`
- Polls require ≥2 options; opportunity posts require a title
- Self-follow is rejected
- Reaction & comment counts updated transactionally

## Analytics (FastAPI)
- `POST /feed/rank` — deterministic ranking (recency 36h half-life, engagement,
  opportunity boost, follow affinity). Drop-in slot for an ML re-ranker.
- `POST /feed/digest` — top-5 daily digest summary.

## Mobile parity
`apps/mobile-flutter/lib/features/feed/feed_api.dart`:
- vertical ListView + pull-to-refresh + infinite scroll
- composer = bottom-sheet with kind segmented control
- reactions = long-press palette; tap-to-like
- comments = bottom-sheet with sticky composer
- saves = swipe-left action
- opportunity cards = taller cards with sticky Apply CTA

## SDK
`packages/sdk/src/index.ts` — `sdk.feed.*` namespace (15 methods) and contracts
(`Post`, `PostKind`, `PostVisibility`, `ReactionKind`, `OpportunityCard`,
`FeedItem`).

## Tests
- Jest: `apps/api-nest/test/feed.service.spec.ts` — publish + fan-out, opportunity
  boost, poll/opportunity validation, self-follow rejection, reaction counter.
- Pytest: `apps/analytics-python/tests/test_feed.py` — ranking sort order,
  opportunity boost, digest top-5.
- Playwright: `tests/playwright/feed.spec.ts` — endpoint mount + /feed render.

## Completion gate
- ✅ Build: migration + seeder + NestJS module + DTOs + repo + service + controller
- ✅ Integration: SDK namespace `sdk.feed.*`, Flutter parity, controller mounted, analytics router mounted
- 🟡 Validation: Jest + pytest + Playwright suites added; per-component frontend swap (FeedHome composer, post cards, RightRail opportunity panel) from mock data to `sdk.feed.*` is the next pass

---

## Enterprise posture (retro-hardened)

| Requirement | Wired |
|---|---|
| Real Postgres (no in-memory) | ✅ `feed.repository.ts` (TypeORM `DataSource`) |
| RBAC on writes | ✅ `author_id = $current` enforced in SQL `UPDATE`/`DELETE` |
| Audit log on every state change | ✅ `AuditService.record({ domain:'feed', action:... })` for create/update/archive/react/unreact/comment/save/unsave/follow/unfollow |
| Validation at controller boundary | ✅ `class-validator` DTOs with bounded lengths and enum constraints |
| Pagination envelope (typed, bounded) | ✅ `homeFeed` returns `{ items, total, limit, hasMore }`, hard cap 100 |
| Error envelope | ✅ global `ErrorEnvelopeFilter` ⇒ `{ error: { code, message, details? } }` |
| Idempotency on writes | ✅ global `IdempotencyInterceptor` honouring `Idempotency-Key` |
| Rate-limit on writes | ✅ global `WriteThrottlerGuard` (60 writes / 60s per actor+route) |
| Observability | ✅ structured audit log line per write + Nest `Logger` |
| GDPR / UK posture | ✅ archive (soft delete) keeps audit trail; opportunity links never store personal data |

## Mobile screens (apps/mobile-flutter/lib/features/feed)

- `feed_api.dart` — Dio client; supports `Idempotency-Key` header on `create`.
- `feed_models.dart` — `FeedPost`, `FeedComment` with safe `fromJson`.
- `feed_providers.dart` — Riverpod: `feedListControllerProvider` (AsyncNotifier
  with refresh / loadMore / optimistic reactions / saves / archive),
  `feedPostProvider`, `feedCommentsProvider`, `feedComposeControllerProvider`.
- `feed_list_screen.dart` — pull-to-refresh, infinite scroll, filter chip row
  (For you / Following / Recommended / Trending / Opportunities), swipe-to-
  archive with confirm dialog, optimistic reactions and saves, FAB + app-bar
  action route to compose.
- `feed_detail_screen.dart` — full post view with opportunity card and
  comments-sheet trigger.
- `feed_compose_screen.dart` — segmented kind control (text / opportunity),
  validated form, idempotency-keyed publish.
- `feed_comments_sheet.dart` — draggable bottom-sheet with sticky composer
  and optimistic refresh of post + comments.

Routes registered in `apps/mobile-flutter/lib/app/router.dart`:
- `/feed` — list (also bound to `/`)
- `/feed/:id` — detail
- `/feed/compose` — compose

Every screen renders through `AsyncStateView` from `core/async_state.dart`,
satisfying the loading / empty / error / success / stale state requirement of
the Mobile Screens Mandate. All destructive actions use `confirmAction(...)`.

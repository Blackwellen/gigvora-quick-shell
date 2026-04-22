# D05 — Feed, Publishing, Social Cards & Three-Rail Experience
## Run 1 · Audit & Inventory

**Date:** 2026-04-18
**Scope:** `src/pages/FeedPage.tsx`, `src/pages/create/PostComposerPage.tsx`, `src/pages/groups/GroupFeedPage.tsx`, `src/components/feed/LiveFeedComposer.tsx`, `src/components/shell/{ShellRightRail,ShellVariants,DashboardLayout}.tsx`, `src/lib/api/feed.ts`, `apps/api-nest/src/modules/feed/*`, `packages/db/{src/schema/feed.ts,migrations/0009_feed.sql}`, `apps/ml-python/app/feed.py`, `apps/api-nest/src/modules/notifications/notifications.gateway.ts`, `apps/mobile-flutter/lib/features/feed/*`, `packages/sdk/src/`.
**Mode:** Read-only inventory + gap report. No code changes in Run 1.

---

## 1. Surface inventory

### 1.1 Frontend feed surfaces
| Surface | LOC | State |
|---|---|---|
| `src/pages/FeedPage.tsx` | 863 | Imports `useCreatePost` + `feedApiConfigured` from `@/lib/api/feed`. Only **one** backend hook actually wired. No `useHomeFeed`, no reaction/comment/save/follow consumption — page renders a **demo dataset** locally. |
| `src/pages/create/PostComposerPage.tsx` | 555 | **0 references** to `useCreatePost`, `fetch`, `api.`, `onSubmit`, or `handleSubmit`. Composer is purely visual; submission is a no-op. |
| `src/components/feed/LiveFeedComposer.tsx` | 82 | Inline composer used inside `FeedPage`. Wires `useCreatePost`. |
| `src/pages/groups/GroupFeedPage.tsx` | (unread) | Group-scoped feed; no scoped backend route exists (`/api/v1/feed/groups/:id` not in controller). |

### 1.2 Frontend API client (`src/lib/api/feed.ts`, 119 LOC)
Hooks: `useHomeFeed`, `useCreatePost`, `useReactToPost`, `useUnreactToPost`, `useCommentOnPost`, `useToggleSavePost`, `useFollowAuthor`, `useOpportunityCards`. All target `/api/v1/feed/*`. Hooks exist; **only `useCreatePost` is consumed** in app code.

### 1.3 Backend module (`apps/api-nest/src/modules/feed/`, 485 LOC total)
Endpoints (`FeedController`, JWT-guarded, mounted at `/api/v1/feed`):
- `GET home`, `POST posts`, `GET posts/:id`, `PUT posts/:id`, `DELETE posts/:id`, `GET authors/:id/timeline`
- `POST posts/:id/reactions`, `DELETE posts/:id/reactions`
- `GET posts/:id/comments`, `POST posts/:id/comments`
- `POST posts/:id/saves`, `GET saves`
- `POST/DELETE follows/:id`, `GET follows/:id/check`
- `GET opportunity-cards`

DTO file (`dto.ts`, 39 LOC) defines `CreatePostDto`, `UpdatePostDto`, `ReactionDto`, `CommentDto`, `FeedQueryDto` with `class-validator`.
**Mismatch:** controller `CreatePostDto` requires `kind`, `body`, `visibility`, `tags`, `media[]`, `link`, `poll`, `opportunity` — but the **frontend `CreatePostInput` sends `body`, `mediaUrls[]`, `hashtags[]`, `visibility`, `sharedEntityType`, `sharedEntityId`**. None of those keys overlap with the backend DTO except `body` and `visibility`. Composer submissions (when wired) **will fail validation**.

### 1.4 Reaction kinds
- DTO `REACTIONS = ['like','celebrate','insightful','curious','support']`
- Frontend `useReactToPost` accepts arbitrary `reaction: string`
- Schema `feed_reactions.kind` defaults to `'like'`, **no CHECK constraint**

### 1.5 Database
- `packages/db/src/schema/feed.ts` — `feed_posts`, `feed_reactions`, `feed_comments` only.
- Migration `0009_feed.sql` ships matching tables + 5 indexes (author/status/published/body-fts/comments-post). **Missing tables for: saves, follows, opportunity-cards, shares, hashtags, mentions, reposts.** The controller implements `/saves`, `/follows`, `/opportunity-cards` against tables that **do not exist in the migration**; service layer must be reading from elsewhere or no-op'ing.

### 1.6 Three-rail layout (the spec's "corrected" architecture)
- `DashboardLayout.tsx` accepts `rightRail` / `rightRailWidth` only. **No `leftRail` prop.** Layout is a top strip + main + optional right rail, not a true three-rail.
- `ShellVariants.tsx` lists variants `default | social | …`; **no `feed-three-rail` variant**, no center-anchored max-width for the feed column.
- `ShellRightRail.tsx` exists but is keyed off `useWorkspace()` (recent items, saved views, suggestions). It is **not bound to feed-specific recommendations** (no "People you may know", "Trending now", "Suggested creators", "Opportunity cards"). The `GET /feed/opportunity-cards` endpoint has no consumer.
- `ShellRightRail.tsx` imports `Link` from **`react-router-dom`** — leftover from the legacy stack, conflicts with the TanStack Start migration.

### 1.7 SDK
- **No `packages/sdk/src/feed.ts`.** `ls packages/sdk/src | grep feed` returns nothing. The SDK has 32 modules but feed is absent. (Per D04-G5 audit, the SDK package.json exports are also broken.)
- Mobile Flutter has its own `feed_api.dart`, `feed_models.dart`, `feed_compose_screen.dart`, `feed_detail_screen.dart`, `feed_list_screen.dart`, `feed_comments_sheet.dart`, `feed_providers.dart` — duplicated logic, no shared contract.

### 1.8 ML
- `apps/ml-python/app/feed.py` exists. `apps/api-nest/src/modules/feed/feed.ml.service.ts` (52 LOC) calls `POST {ML_PY_URL}/feed/rank` with viewer + items, falls back to chronological sort. **Service exists but `FeedService.homeFeed` does not appear to invoke it** based on the surface-level inventory — needs Run 2 verification when wiring is built.

### 1.9 Realtime
- Only realtime gateway in NestJS: `notifications.gateway.ts`. **No feed gateway.** No WebSocket emit on post create / reaction / comment. Frontend has no `useFeedRealtime` / EventSource subscription. New posts only appear after `qc.invalidateQueries`.

### 1.10 Supabase residue in feed-adjacent code
- `src/pages/ProfilePage.tsx` and `src/pages/auth/ResetPasswordPage.tsx` still call `supabase.*` (already flagged D02-G2, D03-G1). Not feed-direct, but ProfilePage is the destination for "View author" links from the feed.

---

## 2. A1–A13 audit checklist

| # | Track | Finding | Evidence |
|---|---|---|---|
| **A1** | Supabase removal | ☐ Feed pages themselves are Supabase-free; ProfilePage destination is not (D03 scope). | §1.10 |
| **A2** | NestJS completeness | ☒ Backend exposes `/saves`, `/follows`, `/opportunity-cards` endpoints **without backing tables in migration 0009**. Either repository silently returns `[]` or runtime error on first call. | §1.5 |
| **A3** | Connectors / secrets | ☐ N/A at D05 layer. | — |
| **A4** | ML wiring | ☒ `feed.ml.service.ts` exists with `MlClient.withFallback` but `FeedService.homeFeed()` does not show ML call sites in surface scan — likely defaults to chronological ranking. Per-request ML scoring must be confirmed and wired. | §1.8 |
| **A5** | Indexers / search | ☒ `feed_published_idx` and `feed_posts_body_fts_idx` exist on the table. No OpenSearch document writer for posts (no indexer worker for Domain 09). | §1.5 |
| **A6** | Pages / components | ☒ `PostComposerPage` (555 LOC) submits nothing — purely cosmetic. ☒ `GroupFeedPage` exists with no scoped backend. ☒ `ShellRightRail` is workspace-scoped, not feed-scoped — no "People you may know", "Trending now", "Suggested creators" widgets despite the spec naming them. | §1.1, §1.6 |
| **A7** | Real data / no demo | ☒ **P0** — `FeedPage.tsx` (863 LOC) renders a local demo array. `useHomeFeed` exists in `lib/api/feed.ts` but **is never imported by any page**. The published surface ships hardcoded fixtures. | §1.1, §1.2 |
| **A8** | Player / editor | ☐ Composer mediaUrls accept image/video/audio in DTO but no upload pipeline ties to `apps/media-pipeline/`. Poll/opportunity/link blocks unsupported by frontend composer. | §1.1, §1.3 |
| **A9** | Logic-flow | ☒ **P0** — Composer submit chain is broken end-to-end: `PostComposerPage` has 0 submit handlers, and even if wired, **DTO field names don't match** (`mediaUrls` vs `media`, `hashtags` vs `tags`, `sharedEntityType/Id` vs `opportunity{kind,refId}`). | §1.1, §1.3 |
| **A10** | Forms enrichment | ☒ Composer does not surface `kind` (text/media/link/poll/opportunity/milestone), `language`, `orgId`, or rich poll/opportunity blocks defined in `CreatePostDto`. | §1.3 |
| **A11** | Frontend ↔ backend integration | ☒ **P0** — 7 of 8 React Query hooks in `lib/api/feed.ts` have **zero call sites** in `src/`. The frontend duplicates feed state locally. | §1.1, §1.2 |
| **A12** | Security / GDPR | ☒ Reaction `kind` has no DB CHECK constraint, accepts any string from client. ☒ No moderation/flag pipeline (status `'flagged'` exists on posts but no admin route, no reporter table). ☒ Visibility `'connections'` evaluated by what graph? `feed_follows` table doesn't exist in migration 0009. | §1.3, §1.4, §1.5 |
| **A13** | Mobile parity | ☒ Flutter ships 7-file feed module (`feed_api`, `feed_models`, list/detail/compose/comments screens, providers). No shared SDK contract — Flutter and TS will drift. | §1.7 |

---

## 3. Gaps to remediate in Run 2

| Gap ID | Priority | Description |
|---|---|---|
| **D05-G1** | **P0** | Wire `FeedPage` to `useHomeFeed('for-you' | 'network' | 'opportunities' | 'creators' | 'following')`. Remove the 800-line demo dataset. Render the 5 context tabs against backend results. |
| **D05-G2** | **P0** | Wire `PostComposerPage` to `useCreatePost`. Add `kind` selector (text/media/link/poll/opportunity/milestone), `visibility` picker, hashtag chips, media upload zone (calls media-pipeline upload service), poll builder, opportunity picker. Submit and navigate to `/feed?published=<id>`. |
| **D05-G3** | **P0** | Reconcile DTO field names. Pick one canonical set (recommend backend `media`/`tags`/`opportunity{kind,refId}`) and update `src/lib/api/feed.ts` `CreatePostInput` + `LiveFeedComposer` to match. Add Zod schema in `packages/sdk/src/feed.ts` so both ends share it. |
| **D05-G4** | **P0** | Create `packages/sdk/src/feed.ts` with typed `FeedClient` covering all 17 controller endpoints. Add to `packages/sdk/package.json` exports (per D04-G5). Replace `src/lib/api/feed.ts` `req()` calls with SDK methods. |
| **D05-G5** | **P0** | Add migration `0086_feed_engagement.sql` creating `feed_saves`, `feed_follows`, `feed_opportunity_cards`, `feed_shares`, `feed_post_hashtags`, `feed_post_mentions` tables — currently the controller's `/saves`, `/follows`, `/opportunity-cards` endpoints have no backing tables. Add CHECK constraint on `feed_reactions.kind`. |
| **D05-G6** | **P0** | Build true three-rail layout: extend `DashboardLayout` with `leftRail` slot, add `ShellVariants.feedThreeRail` with center max-width `~640px` and rail widths `~280px / 1fr / ~320px`. `FeedPage` consumes the variant. |
| **D05-G7** | **P1** | Build feed-scoped right-rail widgets: `<PeopleYouMayKnow>`, `<TrendingHashtags>`, `<SuggestedCreators>`, `<OpportunityCardStack>` (consumer of `useOpportunityCards`). Mount via `ShellRightRail` when `feed-three-rail` variant is active. |
| **D05-G8** | **P1** | Build feed-scoped left-rail: `<FeedContextTabs>` (For You / Network / Opportunities / Creators / Following), `<MyShortcuts>` (saved searches, drafts), `<RecentlyViewed>`. |
| **D05-G9** | **P1** | Confirm `FeedService.homeFeed()` calls `feedMl.rank(...)` with viewer follows/interests/muted. Add the ML invocation if missing. Capture latency + fallback flag in response meta. |
| **D05-G10** | **P1** | Add `FeedGateway` (NestJS WebSocketGateway) emitting `feed.post.created`, `feed.post.reacted`, `feed.post.commented`, `feed.post.archived`. Frontend `useHomeFeed` subscribes via `VITE_REALTIME_URL` and prepends new posts optimistically. |
| **D05-G11** | **P1** | Add OpenSearch indexer worker for `feed_posts` (writes on insert/update/archive, removes on delete). Add `GET /api/v1/feed/search?q=` backed by OpenSearch with hashtag + author + date filters. |
| **D05-G12** | **P1** | Replace `react-router-dom` `Link` import in `src/components/shell/ShellRightRail.tsx` with `@tanstack/react-router` (TanStack migration). |
| **D05-G13** | **P1** | Replace `useReactToPost` arbitrary string with `Reaction` enum from SDK. Add Zod validation client-side. |
| **D05-G14** | **P2** | Wire `GroupFeedPage` to `GET /api/v1/feed/home?scope=group&groupId=...` (extend `FeedQueryDto`). Backend filter by `visibility='org'` + `orgId`. |
| **D05-G15** | **P2** | Build feed moderation surface: `POST /api/v1/feed/posts/:id/report`, admin queue at `/internal/moderation/feed`, status transitions to `'flagged'`/`'archived'`. Reporter table + audit log. |
| **D05-G16** | **P2** | Generate Dart `FeedClient` from same SDK source-of-truth (per D04-G13). Replace 7-file Flutter feed module's API layer with the generated client. Keep Flutter screens. |
| **D05-G17** | **P2** | Composer media upload zone integrates with `apps/media-pipeline/` for image/video transcode + thumbnail. Composer poll/opportunity blocks. |
| **D05-G18** | **P3** | Add Playwright spec covering: open `/feed`, switch context tabs, publish text post via composer, react/unreact, comment, save, follow author, opportunity card click. Capture network trail showing real `/api/v1/feed/*` calls and assert no demo fixtures rendered. |

---

## 4. Sign-off matrix

| Track | Audit | Build | Integrate | Test | Sign-off |
|---|---|---|---|---|---|
| A1  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A2  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A4  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A5  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A6  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A7  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A8  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A9  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A10 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A11 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A12 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A13 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A3 | n/a at D05 | — | — | — | — |

**Run 1 status: COMPLETE.** 18 gaps recorded (6× P0, 7× P1, 4× P2, 1× P3).

**Headline findings:**
1. **`FeedPage.tsx` (863 LOC) is 99% demo data** — only `useCreatePost` is wired; `useHomeFeed` and 6 other hooks have **zero call sites** anywhere in `src/` despite existing in `lib/api/feed.ts` (P0).
2. **`PostComposerPage.tsx` (555 LOC) submits nothing** — no `onSubmit`, no `useCreatePost` import, no `fetch` (P0).
3. **DTO field names mismatch** — frontend sends `mediaUrls`/`hashtags`/`sharedEntityType` while backend expects `media`/`tags`/`opportunity{kind,refId}`. Submissions would 422 even if wired (P0).
4. **Backend exposes `/saves`, `/follows`, `/opportunity-cards`** without backing tables in migration `0009_feed.sql`. Service either silently returns empty or crashes on first call (P0).
5. **No SDK feed module** despite the SDK existing for 32 other domains (P0).
6. **`DashboardLayout` has no `leftRail` slot** — the spec's "corrected three-rail desktop architecture" is unimplemented (P0).
7. **No realtime feed gateway** — only notifications has a WebSocket gateway. New posts only surface on cache invalidation (P1).

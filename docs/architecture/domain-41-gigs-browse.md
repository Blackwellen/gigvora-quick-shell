# Domain 41 — Gigs Browse, Search, and Marketplace Discovery

## Surfaces
- Web: `/gigs` (`GigsDiscoveryPage`), `/gigs/$id` (`GigDetailPage`), `/explore/gigs` (`GigsSearchPage`).
- Mobile: `apps/mobile-flutter/lib/features/gigs_browse/gigs_browse_screen.dart`.
- ML: `apps/ml-python/app/gigs_browse.py` (POST `/gigs-browse/rank`).
- Analytics: `apps/analytics-python/app/gigs_browse.py` (POST `/gigs-browse/summary`).

## API
| Method | Path | Purpose |
|---|---|---|
| GET    | `/api/v1/gigs-browse/search` | Primary discovery (filters + facets + ranking). |
| GET    | `/api/v1/gigs-browse/insights` | Right-rail analytics card. |
| GET    | `/api/v1/gigs-browse/:idOrSlug` | Gig detail with packages + add-ons. |
| GET    | `/api/v1/gigs-browse/saved` | Saved searches for current identity. |
| POST   | `/api/v1/gigs-browse/saved` | Create/update saved search. |
| PUT    | `/api/v1/gigs-browse/saved/:id` | Update saved search. |
| DELETE | `/api/v1/gigs-browse/saved/:id` | Remove saved search. |
| POST   | `/api/v1/gigs-browse/:idOrSlug/bookmark` | Toggle bookmark. |
| GET    | `/api/v1/gigs-browse/bookmarks` | List bookmarked gig ids. |

## State machines
- **Gig:** `draft → pending_review → active ↔ paused → archived; active → escalated → active|archived`.
- **Saved search:** `inactive ↔ active → snoozed → active → archived`.

## Persistence
- Migration: `packages/db/migrations/0041_gigs_browse.sql`.
- Drizzle schema: `packages/db/src/schema/gigs-browse.ts`.
- Tables: `gigs`, `gig_packages`, `gig_addons`, `gig_media`, `gig_skills`, `gigs_browse_saved_searches`, `gigs_browse_bookmarks`, `gigs_browse_ranking_signals`, `gigs_browse_view_events`.
- Indexes on `status`, `category`, `owner_id`, `slug` (unique), `pricing_from_cents`, `rating_avg`.

## Ranking
- ML primary: heuristic blend (category, skills Jaccard, languages, rating, orders, Pro Seller, Featured, fast delivery, recency, price-fit).
- Fallback: `GigsBrowseRepository.fallbackRank` — deterministic, also used when ML times out (>600 ms) or when sort != relevance.
- Modes returned in envelope: `ml | fallback | recency | popularity`.

## Search indexer
- Bookmarks emit a best-effort `INDEXING_QUEUE.add('gigs', { op: 'upsert', index: 'gigs', doc })` so the search-indexer worker can boost popularity. The `gigs` index already exists in `apps/search-indexer/src/index.ts` (line 10).

## Realtime
- `gigs-browse.saved-search.upserted`, `gigs-browse.saved-search.removed`, `gigs-browse.bookmark.toggled` emitted via the optional `NOTIFICATIONS_GATEWAY` to the owner socket.

## RBAC / privacy
- `search` and `:idOrSlug` are publicly accessible for `status='active'` + `visibility='public'`.
- `saved` and `bookmark*` endpoints require an identity; anonymous identity falls back to the literal `'anonymous'` bucket (no cross-leak because all reads filter by `owner_id`).

## Tests
- `apps/api-nest/test/gigs-browse.service.spec.ts` — TODO (next turn).
- `tests/playwright/gigs-browse.spec.ts` — runtime-error + smoke render.

## Mobile parity decisions
- Filters → bottom sheet.
- Sort → sticky horizontal chip row.
- Long-press on card → quick-actions bottom sheet (Bookmark / Compare / Share).
- Saved searches → AppBar action opens bottom sheet.

## Demo-mode behaviour
The `useGigsBrowse` hook returns `demoMode: true` envelopes with deterministic
seed data when `VITE_GIGVORA_API_URL` is unset, so existing pages keep
rendering during the cutover from mock data to live API.

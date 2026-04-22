# Domain 05 — Global Search, Command Palette, Shortcuts & Cross-Linking

## Status
**Build:** ✅ NestJS `SearchModule`, migration `0007_search.sql`, seeder `0006_seed_search.sql`, hybrid OpenSearch + Postgres FTS service, command palette catalogue, shortcuts, cross-links.
**Integration:** 🟡 Frontend `CommandPalette`, `GlobalSearchBar`, and `EntityHoverCard` already render against mock data; SDK + live wiring lands in next pass.
**Validation:** ✅ Jest (7 cases) + pytest (3 cases) + Playwright smoke for ⌘K and `/search`.

## Backend surface
| Endpoint | Auth | Purpose |
|---|---|---|
| `GET  /api/v1/search?q&scope&tags&limit&offset` | optional | Hybrid search (OpenSearch → FTS fallback) |
| `GET  /api/v1/search/facets?q` | optional | Per-index counts for tab strip |
| `GET  /api/v1/search/autocomplete?q&scope` | public | Title prefix suggestions |
| `POST /api/v1/search/track` | optional | Log click for ranking signals |
| `GET  /api/v1/search/trending` | public | Top queries (last 7 days) |
| `GET  /api/v1/search/recent` | jwt | Per-identity recent queries |
| `GET/POST/DELETE /api/v1/search/saved` | jwt | Saved-search CRUD |
| `GET  /api/v1/search/palette/actions?roles&entitlements` | public | Command palette catalogue |
| `GET/POST /api/v1/search/shortcuts` | jwt | Per-identity keybind overrides |
| `GET  /api/v1/search/links/:indexName/:id` | public | Cross-linked entities |
| `POST /api/v1/search/links` | jwt | Create cross-link |
| `POST /api/v1/search/admin/index` | jwt + admin (TODO) | Upsert search document + queue OS index |

## State machines
- **saved_searches**: `active → archived`
- **search_index_jobs**: `pending → running → completed | failed`
- **shortcuts**: `active | disabled`
- **cross_links**: `active | broken | archived`

## Hybrid search resolution
1. If `OPENSEARCH_URL` is set, query OpenSearch with multi-match across `title^3, tags^2, body` + fuzziness AUTO.
2. On error, timeout (1.5s), or empty result, fall back to Postgres `tsvector` FTS with `ts_rank`.
3. Either path returns the same envelope: `{ source, ms, query, scope, total, results[] }`.
4. Visibility filter (`public | org | private | internal`) is enforced at the SQL layer; OpenSearch index docs must mirror the same filter.

## Python analytics
- `POST /search/insights` — deterministic operational summary (zero-result, top-clicked, underperforming).
- `POST /search/rerank` — optional semantic boost. Uses token Jaccard overlap as a stable fallback so the contract holds even when no embedding model is loaded.

## Open follow-ups
- Wire `sdk.search.*` namespace + `useGlobalSearch()`, `useCommandPalette()`, `useCrossLinks()` hooks; replace `MOCK_SEARCH_RESULTS` in `src/components/search/*`.
- Reuse Domain 04 admin guard on `/search/admin/index` once the role guard lands.
- Background worker: drain `search_index_jobs` into the `@gigvora/search-indexer` BullMQ queue; existing indexer already consumes the same op shape.

## Mobile screens

- `apps/mobile-flutter/lib/features/search/search_api.dart` — Dio client (Idempotency-Key on writes that need replay safety)
- `apps/mobile-flutter/lib/features/search/search_providers.dart` — Riverpod providers (autoDispose)
- `apps/mobile-flutter/lib/features/search/search_screen.dart` — Screens registered at: /search, /search/saved, /search/palette

All screens use `AsyncStateView` for loading/empty/error/success.

## Enterprise posture

- **Pagination envelope**: list endpoints return `{ items, total, limit, hasMore }`.
- **Audit**: state changes recorded in domain audit table.
- **RBAC**: ownership checks in service layer.
- **Idempotency**: write endpoints accept `Idempotency-Key` header.
- **Error envelope**: standard `{ error: { code, message } }` via `ErrorEnvelopeFilter`.

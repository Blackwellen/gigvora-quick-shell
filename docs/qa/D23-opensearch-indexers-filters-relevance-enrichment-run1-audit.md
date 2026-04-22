# D23 — OpenSearch, Indexers, Filters, Search Relevance, and Enterprise Search Enrichment — Run 1 Audit

Date: 2026-04-18 · Group: G6 (D23/4) · Status: Run 1 (Audit) complete.

## Inventory

### `apps/search-indexer`
- ✅ Single file `src/index.ts` — **41 LOC**. Defines 10 OpenSearch indexes (`users/jobs/projects/gigs/services/companies/startups/media/groups/events`), one BullMQ `indexing` worker handling `{index, doc, op}` upsert/delete with `refresh: 'wait_for'`.
- ❌ **Toy mappings only** — every index is created with the same 5-field stub (`id keyword / title text / body text / tags keyword / createdAt date`). No per-index field discipline (skills/seniority/geo_point/salary_range/availability/employment_type/sector/headcount/eventStartAt/etc.). Identical to D19's audit finding.
- ❌ No analyzers, no synonyms, no stopwords, no stemming, no edge_ngram for prefix, no completion suggester for autocomplete, no `keyword.normalizer` for case-insensitive sort.
- ❌ No `geo_point` / `geo_shape` fields → no map view, no geo_distance filter, no bounding-box queries (Domain 62 / explore map pages cannot work).
- ❌ No knn_vector / dense_vector mappings → no semantic search, no hybrid lexical+vector ranking despite D21 ML modules existing for it.
- ❌ No bulk-indexer batch path — one HTTP `os.index()` call per document destroys throughput on backfill.
- ❌ No reconciliation worker (DB ↔ OpenSearch drift detector).
- ❌ No full-reindex command, no zero-downtime alias swap (`jobs_v1` → `jobs_v2` blue/green), no `_aliases` registry.
- ❌ No DLQ for permanent indexing failures (BullMQ retries then drops silently).
- ❌ No backpressure / circuit breaker on OpenSearch outage.
- ❌ Worker concurrency hard-coded to 8, no per-index priority lanes.

### NestJS `apps/api-nest/src/modules/search`
- ✅ Module exists with `controller (70 LOC) / service (113) / repository (183) / ml.service (72) / dto (66)` — total **526 LOC**. Endpoints: search, facets, autocomplete, track, trending, recent, saved, palette/actions, shortcuts, links/:indexName/:id, admin/index.
- ✅ Hybrid resolution: prefer OpenSearch, fall back to Postgres FTS via `to_tsquery('simple', ...)` with `:*` prefix tokens — deterministic and always-on.
- ✅ Visibility filter at SQL layer (`visibility = 'public' OR owner_id = $identityId`).
- ✅ Saved searches CRUD + history + click logging + trending + recent + cross-links + command palette + shortcuts.
- ❌ **`tsv` column referenced but no migration creates a generated `tsvector` column or GIN index** in `0055_search.sql` (verified by inspecting search_documents schema — uses `title/body/tags` but the FTS path assumes `tsv` exists; either FTS silently never returns rows or the migration is partial).
- ❌ No `searchOpenSearch()` per-index field discipline — multi-match across `title^3, tags^2, body` for ALL indexes (jobs should boost `skills^4 / title^3 / company^2`; people should boost `skills^4 / headline^3 / location^2`).
- ❌ No filter DSL (salary range, location radius, seniority, employment_type, posted_at window, remote/hybrid/onsite, must_have skills, has_visa_sponsorship, company_size). Controller accepts `tags[]` only.
- ❌ No saved-search **notify** worker — `notify` boolean stored but no worker scans for new matches and emits notifications/emails.
- ❌ No saved-search snooze/archive state machine (D23 docs claim `inactive ↔ active → snoozed → archived`, code only has `active|archived`).
- ❌ No "search-as-you-type" instant-search endpoint with debounce hint (autocomplete returns titles only, not blended hits + suggestions + entities + recent + saved).
- ❌ No spell-correction / "did you mean" / phonetic match.
- ❌ `admin/index` upserts one doc at a time — no bulk endpoint, no diff/patch, no soft-delete + tombstone, no per-tenant isolation enforcement.
- ❌ No background **search_index_jobs** drainer despite the migration declaring the table per Domain 05 docs.
- ❌ `linksFor` / `createLink` exist but no broken-link sweeper, no archived-target reconciliation.
- ❌ No `MlBridge` to call `search.py` rerank — `search.ml.service.ts` exists (72 LOC) but isn't wired into the main `search()` path.

### Database — search tables
- ✅ Two migrations: `database/migrations/0055_search.sql` and `supabase/migrations/0007_search.sql`. Two seeders.
- ❌ **Conflicting / duplicate schemas** — `packages/db/src/schema/search.ts` declares `search_index` (with `searchIndex` table name + `tenant_id` + `external_id` + `engagement_score` + `recency_at` + `visibility ∈ public|tenant|private`) but the repository queries **`search_documents`** with `index_name/owner_id/visibility ∈ public|org|private`. Schema/code drift — one or the other is dead code.
- ❌ Missing tables: `search_index_jobs` (declared in D05 docs but no SQL), `search_synonyms` (per-tenant synonym lists), `search_relevance_overrides` (manual boosts per query→doc), `search_saved_filters` (named filter presets distinct from saved searches), `search_blocklist` (suppress docs from results), `search_geo_polygons` (named regions for "in this area"), `search_query_clusters` (LLM-summarised intent buckets), `search_facet_definitions` (per-index facet config in DB instead of hard-coded).
- ❌ No `tsvector` generated column + GIN index in the canonical migration (FTS path is broken).
- ❌ No partitioning on `search_history` / `search_clicks` (unbounded growth; D22 audit flagged this).

### ML / Python
- ✅ 4 relevant routers: `search.py`, `recruiter_dashboard.py`, `recruiter_jobs.py`, `sales_navigator.py`.
- ❌ Not wired into NestJS search path (mentioned above) — no rerank, no semantic boost, no learning-to-rank, no per-user personalization adapter.
- ❌ Missing modules per D19 audit: `boolean_search_parser.py` (recruiter Boolean DSL: AND/OR/NOT/quotes/parentheses/proximity), `enterprise_query_understanding.py` (intent classifier: skills vs role vs company vs location), `recruiter_diversity_rerank.py` (D&I-safe rerank), `sales_navigator_intent.py` (buyer-intent scoring on company moves), `search_query_clusters.py` (nightly LLM clusters of recent queries for trending/UX), `geo_resolver.py` (city/region → geo_point + radius).

### SDK
- ❌ **No `packages/sdk/src/search.ts`** — every frontend search consumer hand-writes fetch in `src/lib/api/search.ts`. No typed envelope, no shared filter DTO, no client for facets/autocomplete/saved/palette/shortcuts/links/track.

### Frontend — search surfaces
- ✅ Many pages exist: `CommandSearch.tsx`, `LiveSearchResults.tsx`, `AdvancedFilterPanel.tsx`, `InternalSearchPage.tsx`, `SearchCommandCenterPage.tsx`, `SavedSearchesPage.tsx`, plus 9 explore pages (`Events/Gigs/Groups/Jobs/Pages/People/Podcasts/Projects/Services` + index). `src/lib/api/search.ts` exists.
- ❌ **No map view / geo search page** despite legacy coverage requiring it. No `MapSearchPage.tsx`, no `useGeoSearch` hook, no Mapbox/MapLibre integration (or comparable).
- ❌ **No compare view** — no `CompareDrawer` wired into search results (memory references it but no comparison router page).
- ❌ **No NavigatorPage** (Sales-Navigator-style buyer-intent discovery distinct from People search).
- ❌ **No EnterpriseConnectPage** for enterprise Boolean+filter+saved-search workflows.
- ❌ **No RecruiterSearchPro page** — recruiter intelligence search depth missing.
- ❌ `AdvancedFilterPanel` is generic — no per-domain filter schemas (jobs vs gigs vs services vs people vs companies vs events vs media), no URL state sync, no filter chips, no "save current filters as preset", no "clear all", no shareable filter URLs.
- ❌ `LiveSearchResults` doesn't blend recent + saved + autocomplete + entities + suggestions; doesn't show ML rank explanations.
- ❌ No keyboard navigation contract documented (↑↓ in palette, `/` to focus search, Enter to open, ⌘+click new tab, Tab to switch scope).
- ❌ No empty/loading/error state primitives shared across the 9 explore pages.
- ❌ No "trending now" widget on home/discovery, no "popular searches near you" on map, no "search-history-driven recommendations" on dashboard.

### Realtime
- ❌ No socket channel for `saved-search.matched` (despite Domain 23 jobs-browse docs claiming `jobs-browse.saved-search.upserted/removed` channels exist for that domain only).
- ❌ No live-results push for new matches while a search page is open.

### Mobile (Flutter)
- ✅ `apps/mobile-flutter/lib/features/search/` exists per D05 docs (`search_api.dart`, `search_providers.dart`, `search_screen.dart`).
- ❌ Not verified end-to-end — same per-index/filter/geo gaps as web.

### Cross-domain ingest-on-write
- ❌ No NestJS module enqueues to the `indexing` BullMQ queue on entity create/update/delete. Jobs/Gigs/Services/Companies/Profiles/Events/Media all mutate Postgres without notifying search-indexer. **The OpenSearch corpus is empty in production.**

## Gaps (38 total — 13 P0 / 14 P1 / 8 P2 / 3 P3)

### P0
1. **OpenSearch corpus is empty** — no NestJS module emits index jobs on entity write; even if mappings were correct, search is hitting only the Postgres FTS fallback (which is also broken; see #2).
2. **Postgres FTS path is broken** — repository queries `tsv` generated column + uses `to_tsquery` but no migration creates `tsv` or a GIN index. FTS returns 0 rows in production.
3. **Toy index mappings** — same 5-field shape for all 10 indexes; no skills/geo_point/salary/seniority/employment_type/availability/sector/event_start_at/etc.
4. **No geo_point / map search** — Domain 62 map view and "near me" filters cannot function.
5. **Schema drift between drizzle (`search_index`) and repository (`search_documents`)** — one is dead code; risk of missing migrations on prod.
6. **No per-domain filter DSL** — controller accepts `tags[]` only; no salary range / location radius / seniority / employment_type / posted_at window / remote-mode / must-have skills / company_size / sector.
7. **No SDK module** — every consumer hand-rolls fetch; no typed envelope; future API changes will break silently.
8. **No saved-search notify worker** — `notify` boolean is stored but nothing scans for new matches and emits notifications.
9. **No bulk-indexer + no full-reindex + no alias swap** — backfill takes hours, schema migration causes downtime, no rollback path.
10. **No reconciliation worker** — DB ↔ OpenSearch drift goes undetected; deletes/updates may silently disappear.
11. **No map / compare / navigator / enterprise-connect / recruiter-search-pro pages** — entire enterprise-search surface is missing.
12. **No boolean query parser** for recruiter Boolean (AND/OR/NOT/quotes/parens/proximity) — recruiter pro is unusable.
13. **ML rerank not wired** — `search.ml.service.ts` exists but `search.service.search()` never calls it; `search.py` does nothing in the request path.

### P1
14. **No semantic / vector search** — no knn_vector field, no embeddings refresh, no hybrid lexical+vector ranking.
15. **No completion suggester** — autocomplete uses `ILIKE 'q%'` against title only; no fuzzy, no typo tolerance, no per-scope ranking.
16. **No spell-correction / "did you mean"**.
17. **No synonyms / stopwords / stemming** in OpenSearch; no per-tenant `search_synonyms` table.
18. **No relevance-override admin UI** (manual boosts/blocks per query→doc).
19. **No facet definitions table** — facets hard-coded; cannot configure per-tenant.
20. **No search_index_jobs background drainer** despite D05 declaring it.
21. **No diversity / D&I-safe rerank** for recruiter search.
22. **No buyer-intent scoring** for sales navigator (company moves / hiring spikes / funding events).
23. **No URL-synced filter state** in AdvancedFilterPanel; no shareable filter URLs.
24. **No filter presets** distinct from saved searches.
25. **No realtime saved-search-matched push** to open search pages.
26. **No partitioning on `search_history` / `search_clicks`** — unbounded growth.
27. **No `search_blocklist`** — cannot suppress problematic docs from results org-wide.

### P2
28. **No "popular near you" / "trending in your industry" widgets** seeded from `search_history` aggregations.
29. **No keyboard-shortcut contract** documented or enforced across palette / explore pages.
30. **No empty/loading/error state primitives** shared across the 9 explore pages.
31. **No nightly LLM query-clustering** for trending/UX intelligence.
32. **No A/B testing harness** for ranking changes (D21 dependency).
33. **No per-user personalization adapter** in the search path.
34. **No per-tenant isolation** on `admin/index` (any authenticated user could write to any tenant).
35. **No backpressure / circuit breaker** on OpenSearch outage in indexer worker.

### P3
36. **No multi-language analyzers** (English only).
37. **No image / file-name search** for Media.
38. **No federated search across external corpora** (LinkedIn / GitHub / Crunchbase via D19/D20 connectors) when consent allows.

## Recommended Run 2 (Build) priorities

1. **Fix Postgres FTS** — migration `0090_search_fts_canonical.sql` with `tsvector` generated column on `search_documents(title || ' ' || body || ' ' || array_to_string(tags,' '))` + GIN index; reconcile with drizzle `search_index` schema.
2. **Per-index OpenSearch mappings** — split `apps/search-indexer/src/mappings/` into one file per index (jobs/gigs/services/companies/people/projects/events/media/groups/podcasts) with proper analyzers, synonyms (`search_synonyms` table feed), stopwords, completion suggester, geo_point, knn_vector, salary_range, employment_type keywords.
3. **Bulk indexer + reconciliation + alias swap** — `apps/search-indexer/src/{bulk-indexer.ts,reconciliation.ts,alias-swap.ts,full-reindex.ts}` + admin command surface.
4. **Cross-domain ingest-on-write** — `SearchIndexerBridge` NestJS module + `@OnEvent` listeners on Jobs/Gigs/Services/Companies/Profiles/Events/Media/Projects entity create/update/delete that enqueue normalized docs.
5. **Filter DSL** — typed `SearchFiltersDto` with per-scope fields (jobs: salaryMin/salaryMax/seniority[]/employmentType[]/remoteMode[]/locationCountry/locationRadiusKm/postedWithinDays/mustHaveSkills[]/excludedSkills[]/companySize[]/visaSponsorship; people: skills[]/seniority[]/headlineKeywords[]/locationRadiusKm/openToRoles[]/availability[]; companies: sector[]/headcount[]/funding[]/hqCountry/recentExits/hiringSpike; gigs: priceMin/priceMax/deliveryDays/tier[]/category[]; services: hourlyMin/hourlyMax/availability[]/region[]; events: startAfter/startBefore/format[]/locationRadiusKm).
6. **Saved-search notify worker** — APScheduler/BullMQ-cron job runs every 15 min, runs each `notify=true` saved search, diffs against last_run_at, emits `saved-search.matched` notification + Socket.IO push + optional email.
7. **Map / Compare / Navigator / EnterpriseConnect / RecruiterSearchPro pages** — `src/routes/explore/map.tsx`, `compare.tsx`, `src/routes/navigator/index.tsx`, `src/routes/enterprise-connect/index.tsx`, `src/routes/hire/search.tsx` with shared `useGeoSearch / useCompare / useBooleanParser / useSavedFilterPreset` hooks.
8. **SDK** — `packages/sdk/src/search.ts` with full typed client (`search/facets/autocomplete/track/trending/recent/saved.{list,create,archive,snooze}/palette/shortcuts/links/admin.{index,bulkIndex,reconcile,reindex,aliasSwap}`).
9. **Boolean query parser** — `apps/ml-python/app/boolean_search_parser.py` + Nest `BooleanParserGuard` that translates `("staff engineer" OR "principal") AND (kubernetes OR k8s) NOT (recruiter)` → OpenSearch DSL.
10. **Wire ML rerank** — `search.service.search()` calls `search.ml.service.rerank()` with 600ms budget + deterministic fallback; learning-to-rank from `search_clicks` history.
11. **Semantic / vector search** — knn_vector mapping + nightly embeddings worker (D22 dependency) + hybrid `bool { should: [match, knn] }`.
12. **Synonyms / stopwords / completion suggester / spell-correction** — per-tenant synonym table + OpenSearch analyzer config + completion field on title + `suggest.text` "did you mean".
13. **Migration `0090_search_relevance_fabric.sql`** — `search_synonyms / search_relevance_overrides / search_saved_filters / search_blocklist / search_geo_polygons / search_query_clusters / search_facet_definitions / search_index_jobs` (+ `search_history`/`search_clicks` partitioning).
14. **AdvancedFilterPanel V2** — per-domain filter schema, URL state sync, chips, clear-all, save-preset, shareable URLs, keyboard nav.
15. **Realtime** — `user:{identityId}` socket emits `saved-search.matched`, `search.results.refreshed`.
16. **Admin terminal** — `/admin/search/{relevance,synonyms,blocklist,reindex,index-jobs,query-clusters}` pages.
17. **Playwright** — type query → autocomplete → enter → results → apply filters (URL syncs) → save filter preset → save search with notify=true → simulate match → toast appears → open saved searches → snooze → archive → boolean recruiter query parses → map view shows pins → compare two jobs side-by-side.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

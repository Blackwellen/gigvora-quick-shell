# FD-11 — Search, Indexing, OpenSearch, Filter Richness & Enterprise Discovery — Run 1 Audit

Date: 2026-04-18 · Group: G3 · Maps to **Master Sign-Off Matrix → G03 (backend coverage), G04 (data/indexing), G07 (mobile parity), G09 (Playwright), G10 (third-party — OpenSearch), G12 (analytics/ML)**.

> Scope: prove search has a real OpenSearch backbone (indexers + reindex jobs), every explorer/discovery surface uses real backend filters (not frontend-only), recruiter pro + Enterprise Connect + Sales Navigator are richly filterable, and saved searches + autocomplete + compare/map views + ranking are wired end-to-end.

## 1. Inventory snapshot

### Search indexer — `apps/search-indexer/` (50 LOC)
- `@opensearch-project/opensearch` ✅, `bullmq` worker on `indexing` queue ✅, `pino` logging ✅, Zod listed ✅.
- `INDEXES = ['users','jobs','projects','gigs','services','companies','startups','media','groups','events']` — **10 indexes** ✅ but missing: `podcasts`, `webinars`, `pages`, `reels`, `videos`, `creators`, `agencies`, `connect-partners` (Enterprise Connect), `nav-accounts`/`nav-leads` (Sales Navigator), `chat-messages`, `saved-searches`, `taxonomy-terms`. The frontend has 17+ explorer pages but the indexer covers only 10 entity types.
- Mappings are **`dynamic: 'true'` with only 5 properties** (id, title, body, tags, createdAt). This is a fatal coverage gap — without explicit mappings per entity (e.g. `salary_min`/`salary_max` as numeric ranges, `location` as `geo_point`, `skills` as keyword array, `seniority`/`employment_type` as keyword, `published_at` as date, `company_id` as keyword, `is_remote` as boolean, `compensation_currency` as keyword), all of the AdvancedFilterPanel filters will be string-matched against `body`, breaking range/geo/facet semantics.
- No analyzers configured beyond `standard`. No edge-ngram for autocomplete, no synonyms file, no language analyzers (en/es/fr), no shingle/phrase analyzer.
- No `aliases` strategy → reindex requires downtime. No `index_patterns` / templates → new entities can't inherit consistent mappings.
- Single shard, **0 replicas** — fine for dev, **forbidden for prod** (data loss on a single node failure).
- Worker has no DLQ wiring (relies on BullMQ defaults), no retry config visible at this layer, no idempotency key (re-indexing the same doc twice is fine for `index` but `delete` after `index` race could leave stale data).

### NestJS search module
- `apps/api-nest/src/modules/search/` ✅ exists (controller + service + repository + spec). `search.repository.ts` referenced under saved-searches grep.
- `projects-browse-discovery` and `sales-navigator` modules exist ✅; `gigs-browse` and `jobs-browse` ✅; **no `enterprise-connect` search module surface** despite `packages/db/src/schema/enterprise-connect.ts` existing.
- Domain emit hooks (`*.emit.ts`) only present for `project-posting-smart-match`, `projects-browse-discovery`, `proposal-builder-bid-credits` — every other domain that should publish to the `indexing` queue (jobs, gigs, services, companies, profiles, media, podcasts, webinars, groups, events, pages, reels) **does not emit on create/update/delete**. This means the indexer is starved — it cannot index data it never receives.

### Database
- `0055_search.sql` migration exists ✅ (schema for saved searches + likely search history tables).
- Postgres FTS (`tsvector`, `GIN`, `to_tsvector`, `websearch_to_tsquery`) appears in 14+ migrations across feed, profiles, companies, agency, groups, events, ads, donations, audit log — **good Postgres-side fallback** but means there are **two competing search backends** (Postgres FTS + OpenSearch) with no documented routing rule for which surface uses which. Risk: drift between the two indexes.
- No explicit `taxonomy_terms` / `skills_taxonomy` table surfaced in grep — taxonomy linkage referenced in business goal is unproven.

### Frontend
- **45+ explorer/discovery surfaces** across `src/pages/explore/`, `src/pages/sales/`, `src/pages/recruiter/`, `src/pages/enterprise/`, `src/pages/media/`, `src/pages/podcasts/`, `src/pages/launchpad/`, `src/pages/inbox/`, `src/pages/admin/`.
- Key surfaces: `SearchCommandCenterPage`, `SearchComparePreviewPage`, `SearchMapViewPage`, `SavedSearchesPage`, `ExplorerPage`, plus per-entity (`Jobs/Gigs/Services/Projects/People/Groups/Events/Webinars/Podcasts/Pages`).
- `AdvancedFilterPanel.tsx` ✅ (per `advanced-filtering-system` memory: 15-25 filters per context). Used by **14 surfaces** (Events, Gigs, Jobs, People, Podcasts, Projects, Recruiter Candidate, Navigator Accounts, Navigator Company Intel, Navigator Leads, Services, plus discovery pages).
- `CommandSearch.tsx` + `LiveSearchResults.tsx` ✅ for ⌘K (per `search-and-command-center` memory: 10 categories).
- `src/lib/api/search.ts` ✅ but is hand-rolled (cross-cuts FD-09 SDK gap).

### Mobile
- `apps/mobile-flutter/lib/features/search/` ✅ (api/providers/screen) and `apps/mobile-flutter/lib/features/search_v2/search_screens.dart` (newer) — two parallel implementations risk drift.
- No Flutter screens for SavedSearches, CompareView, MapView, NavigatorAccounts, EnterpriseConnect, recruiter talent search.

### Tests
- `tests/playwright/search.spec.ts` — **single spec** for the entire search domain. No coverage of: facets, saved-search CRUD, autocomplete latency, recruiter Boolean queries, map view, compare drawer, zero-result UX, pagination.
- `apps/api-nest/test/search.service.spec.ts` ✅ exists.

### Analytics / ML
- `apps/analytics-python/app/search.py` ✅ exposes `/search/insights` (zero-results, top-clicked, under-performing) and `/search/rerank` (Jaccard placeholder). Real semantic re-rank not wired; no embeddings pipeline.

## 2. Findings

### 🚨 P0 (release blockers)

1. **Indexer mappings are wide-open `dynamic: 'true'`**, defeating typed filtering. Range filters (salary, budget, dates), geo filters (location radius), facets (skills, seniority, employment type, compensation currency, remote-policy), and sorts (relevance vs newest vs salary-desc) will all silently fall back to string matching. Every "real backend filter" claim fails until per-entity mappings exist.
2. **Indexer covers 10 entities but the frontend has 17+ explorer surfaces.** Missing: `podcasts`, `webinars`, `pages`, `reels`, `videos`, `creators`, `agencies`, `connect-partners`, `nav-accounts`, `nav-leads`, `chat-messages`. Pages render against an empty index → results are silently mocked or sourced from Postgres ad-hoc queries.
3. **Only 3 NestJS modules emit to the `indexing` queue** (`project-posting-smart-match`, `projects-browse-discovery`, `proposal-builder-bid-credits`). Every other write surface (job-posting-studio, gig-builder, service-builder, profile updates, company updates, media uploads, group/event creation) never publishes index events → OpenSearch is permanently stale.
4. **No alias strategy** (`<index>_v1` ↔ `<index>` alias). Without aliases there is no zero-downtime reindex path; production reindex requires schema-incompatible blue/green via app code, which doesn't exist.
5. **Two search backends with no routing contract.** Postgres FTS lives in 14 migrations; OpenSearch lives in `apps/search-indexer/`; nothing documents which surface should query which (e.g. "feed → Postgres FTS, explorer → OpenSearch"). This guarantees future drift and inconsistent filter behaviour between surfaces.
6. **No autocomplete/typeahead infrastructure in the indexer.** `search.controller.ts` references autocomplete but the OpenSearch index has no `completion`/`search_as_you_type`/edge-ngram fields. Current ⌘K and `LiveSearchResults` will return slow `match` queries instead of true sub-50ms suggest.
7. **Saved searches surface exists but no notification/digest worker.** `SavedSearchesPage.tsx` ✅ and `0055_search.sql` migration ✅ but no scheduled job that re-runs saved queries and emails/notifies the user on new matches (the entire point of saving a search).
8. **No reindex job / admin reindex action.** `/internal/search` (`InternalSearchPage.tsx`) exists but no operator action to "reindex {entity}" or "rebuild from snapshot". Single grep hit for `reindex` is in `gigs-browse.service.ts` only.
9. **Recruiter Boolean / structured query support unverified.** `RecruiterTalentSearchPage` + `RecruiterCandidateSearchPage` exist but there is no evidence of `query_string` / `simple_query_string` parsing (e.g. `"react" AND ("typescript" OR "tsx") AND NOT "agency"`), seniority bucketing, OFCCP-safe filtering, or saved talent pools.
10. **Enterprise Connect search has no module.** Schema `packages/db/src/schema/enterprise-connect.ts` exists, page `EnterprisePartnerDiscoveryPage.tsx` exists, but no `apps/api-nest/src/modules/enterprise-connect/` directory and no dedicated index → page must be rendering against ad-hoc data.
11. **`number_of_replicas: 0`** in the indexer is fine for dev but unsafe for prod. No environment-aware override.
12. **No OpenSearch security**: client connects with no auth (`process.env.OPENSEARCH_URL`) — production must use TLS + signed requests (AWS sig v4 if AWS-managed) + scoped IAM/role; current code has no path for that.

### P1
13. Two parallel Flutter search implementations (`features/search/` + `features/search_v2/`) — pick one, delete the other.
14. No language analyzers (English/Spanish/French) → poor recall on stemming and stopwords for non-English content.
15. No synonyms file (`react ↔ reactjs`, `pm ↔ product manager`, `swe ↔ software engineer`) → recall gap on common alias queries.
16. No `min_score` / score normalisation across indexes for federated search → relevance bleed between entities in `SearchCommandCenterPage`.
17. No `function_score` / business boosts (recency, completeness, verified-status, conversion-rate). Sales Navigator and Recruiter Pro need this for enterprise-grade ranking.
18. `AdvancedFilterPanel` filter state doesn't appear to be URL-persisted via `validateSearch` + `zodValidator` — sharing/saving searches by URL is unreliable. Cross-cuts `tanstack-search-params` knowledge.
19. Compare view (`SearchComparePreviewPage`) and Map view (`SearchMapViewPage`) have no visible backend support for batch-fetching N entity ids with the same projection, nor a `geo_bounding_box` query for the visible map viewport.
20. Search analytics rerank uses Jaccard token overlap as a placeholder — no real embedding/vector backend (e.g. `knn_vector` field in OpenSearch ≥2.x or a separate vector store).
21. No `_msearch` consolidation in `SearchCommandCenterPage` — currently likely fans out N HTTP calls instead of one multi-search.
22. No "did you mean" / spellcheck (OpenSearch `phrase` suggester) for zero-result queries.

### P2
23. No `/internal/search/health` operator surface (cluster yellow/green, doc counts per index, indexing lag, slow query log).
24. No facet count caps / circuit breaker → an open-ended `terms` aggregation on a high-cardinality field could OOM the cluster.
25. No published search SLO (e.g. p99 < 300ms cold, < 80ms warm, autocomplete < 50ms).

## 3. Run 2 build priorities (FD-11 only)

### A. Indexer mappings + analyzers
1. Replace `dynamic: 'true'` with **strict per-entity mappings** under `apps/search-indexer/src/mappings/` — one file per entity (`jobs.ts`, `gigs.ts`, `services.ts`, `projects.ts`, `profiles.ts`, `companies.ts`, `agencies.ts`, `media.ts`, `podcasts.ts`, `webinars.ts`, `pages.ts`, `groups.ts`, `events.ts`, `creators.ts`, `connect-partners.ts`, `nav-accounts.ts`, `nav-leads.ts`, `chat-messages.ts`). Each defines: id, title (text + keyword), description (text), tags (keyword), skills (keyword), seniority (keyword), employment_type (keyword), salary_min/max (long), currency (keyword), location (`geo_point`), is_remote (boolean), company_id (keyword), owner_id (keyword), published_at (date), updated_at (date), status (keyword), score boosts (long), suggest (`completion`), search_as_you_type (`search_as_you_type`).
2. Custom analyzers: `english_with_synonyms` (lowercase + asciifolding + english_stemmer + synonyms file), `edge_ngram_autocomplete` (1–20), `phrase_search` (shingles 2–3).
3. Synonyms file `apps/search-indexer/src/synonyms/{en,es,fr}.txt` seeded with role/skill/title aliases.

### B. Alias + reindex strategy
4. All indexes created as `<entity>_v1` with alias `<entity>` pointing at the live version. New mappings ship as `<entity>_v2`, indexer dual-writes during cutover, then alias swap → drop `_v1`. Helper `apps/search-indexer/src/reindex.ts` automates this.
5. `/internal/search/reindex` admin action (NestJS controller in `search` module + page in `InternalSearchPage.tsx`) triggers per-entity reindex from Postgres source-of-truth via BullMQ batch jobs.

### C. Index-event emission across all writes
6. Add `*.emit.ts` to each write-owning module: `job-posting-studio`, `gig-builder`, `service-builder`, `profile`, `company-builder`, `agency`, `media-uploads`, `podcasts`, `webinars`, `pages-builder`, `groups`, `events`, `reels`, `enterprise-connect`, `sales-navigator-accounts`, `sales-navigator-leads`. Each emits `{index, op, doc}` to the `indexing` BullMQ queue on create/update/delete (transactional outbox pattern, not best-effort).
7. Outbox table `search_index_outbox(id, entity, entity_id, op, payload, enqueued_at, processed_at)` so a missed Redis publish is recoverable.

### D. Backend search/filter contract
8. NestJS `search` module gains: `POST /search/{entity}` with Zod-validated body for filters, facets, sort, page, cursor; returns `{hits, total, facets, took, suggest}`. Each entity controller (jobs-browse, gigs-browse, etc.) delegates to a shared `OpenSearchQueryBuilder` that maps `AdvancedFilterPanel` JSON → OpenSearch DSL.
9. Recruiter `simple_query_string` parser supports `AND/OR/NOT`, quoted phrases, `field:value` syntax for `RecruiterTalentSearchPage`.
10. New `enterprise-connect` NestJS module with controller + service + repository + emitter + `connect-partners` index.
11. `nav-accounts` + `nav-leads` indexes wired to existing `sales-navigator` module emissions.

### E. Autocomplete
12. `GET /search/suggest?prefix=` calls OpenSearch `_search` with `completion` suggester + `search_as_you_type` fallback, p99 budget 50ms. `LiveSearchResults.tsx` + Flutter `search_v2` consume.

### F. Saved searches + digest worker
13. `apps/workers` adds `saved-searches-digest` BullMQ queue. Cron schedules per-user runs (daily/weekly per user pref). New matches → in-app notification + optional email via existing email adapter.
14. Saved search execution writes to `saved_search_runs(id, saved_search_id, ran_at, new_matches_count)` for the SavedSearches page activity feed.

### G. Compare + map views
15. `POST /search/batch-projection` accepts up to 50 ids per index and returns the projection used by `SearchComparePreviewPage`.
16. `POST /search/{entity}/geo-bounds` accepts `{n,e,s,w, zoom}` and returns clustered hits via `geo_bounding_box` + `geohash_grid` aggregation for `SearchMapViewPage`.

### H. URL-persisted filters
17. Migrate every `AdvancedFilterPanel`-using page to TanStack Start `validateSearch` + `zodValidator` so filter state lives in the URL and can be saved/shared.

### I. Tests
18. Playwright `tests/playwright/search/`:
   - `jobs-filters.spec.ts` (every filter exercised + facet counts asserted)
   - `recruiter-boolean.spec.ts` (`AND/OR/NOT` + saved talent pool)
   - `autocomplete-latency.spec.ts` (p99 < 100ms)
   - `saved-searches-crud.spec.ts` + digest worker fixture
   - `command-search-msearch.spec.ts` (single network call returns ≥3 entity types)
   - `compare-view.spec.ts` (3+ entities side-by-side)
   - `map-view.spec.ts` (geo-bounds + cluster expand)
   - `enterprise-connect-discovery.spec.ts`
   - `navigator-accounts-leads.spec.ts`
   - `zero-result-suggest.spec.ts` ("did you mean")

### J. Mobile parity
19. Flutter screens for: `saved_searches_screen.dart`, `recruiter_search_screen.dart`, `navigator_accounts_screen.dart`, `compare_view_screen.dart`. Consolidate `features/search/` + `features/search_v2/` into one.

### K. Hardening
20. Per-env config: prod uses ≥2 replicas, dedicated index lifecycle policies, TLS + IAM-signed requests, slow-query log → admin surface.
21. Circuit breaker on facet aggregations (`size` cap, `terminate_after`).

### L. Analytics / ML
22. Replace Jaccard rerank with real vector backend: `knn_vector` field on selected entities (jobs, profiles, services), embedding pipeline in `apps/analytics-python` populating vectors on emit.
23. `apps/analytics-python/app/search.py` `/search/insights` runs hourly via cron, results visible at `/internal/search/insights`.

## 4. Mapping to Master Sign-Off Matrix
- **Primary**: G03 (backend), G04 (data/indexing), G09 (Playwright), G10 (OpenSearch), G12 (analytics/ML).
- **Secondary**: G07 (mobile), G09 (URL-state via `tanstack-search-params`), G13 (runbooks for reindex + cluster ops).

## 5. Domain checklist (Run 1 state)

| Validation Item | Tick | Evidence |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages mapped | ☑ | 45+ surfaces enumerated |
| Backend files & APIs complete | ☐ | `search` module ✅; only 3 emitters; no `enterprise-connect` module |
| Supabase/demo data eliminated | ☐ | Cross-cuts FD-08 mock audit |
| DB schema, seeders, fixtures | ☐ | `0055_search.sql` ✅; outbox + saved_search_runs missing |
| ML/analytics/workers | ☐ | `search.py` exists; rerank is Jaccard placeholder; no embedding pipeline |
| Indexing/search/filter logic | ☐ | `dynamic:true` mappings + 10/17 indexes + 3/N emitters |
| Realtime / live data | ☐ | Saved-search digest worker missing |
| Security & middleware | ☐ | OpenSearch client unauthenticated; replicas=0 |
| Playwright coverage | ☐ | 1 spec for entire domain |
| Mobile parity | ☐ | Two parallel impls; no saved/recruiter/navigator/compare screens |
| Acceptance criteria | ☐ | Pending Run 2 + Run 4 |

## 6. Acceptance criteria (binding)
- A1. Indexer ships strict per-entity mappings for ≥17 entities; no `dynamic:'true'`.
- A2. ≥17 NestJS write-owning modules emit `{index,op,doc}` via transactional outbox.
- A3. `<entity>_v1` + alias pattern in place; reindex action documented + admin-triggerable.
- A4. `POST /search/{entity}` returns `{hits,total,facets,took,suggest}` for every entity.
- A5. Recruiter Boolean + saved talent pools wired and exercised by Playwright.
- A6. Autocomplete p99 ≤ 100ms via `completion` suggester proven by Playwright timing assertion.
- A7. Saved searches digest worker runs on cron and writes `saved_search_runs`; email/in-app notification proven.
- A8. `SearchComparePreviewPage` + `SearchMapViewPage` consume real backend (`batch-projection` + `geo-bounds`).
- A9. All `AdvancedFilterPanel` pages persist filter state in URL via `zodValidator`.
- A10. ≥10 Playwright specs in `tests/playwright/search/` covering filters, Boolean, autocomplete, saved, compare, map, enterprise-connect, navigator, zero-result suggest.
- A11. Flutter has saved-searches + recruiter-search + navigator + compare screens; legacy `features/search/` removed.
- A12. Prod OpenSearch: ≥2 replicas, TLS, IAM/signed-request auth, slow-query log surfaced at `/internal/search/health`.
- A13. Vector rerank wired for jobs + profiles + services with `knn_vector` field; Jaccard removed.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate._

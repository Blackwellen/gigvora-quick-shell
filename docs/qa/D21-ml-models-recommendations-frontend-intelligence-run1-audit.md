# D21 — Machine Learning Models, Recommendation Logic, and Frontend Intelligence Placement — Run 1 Audit

Date: 2026-04-18 · Group: G6 (D21/4 — opens G6) · Status: Run 1 (Audit) complete.

## Inventory

### Python ML service (`apps/ml-python`)
- ✅ **53 modules · 4,241 LOC total** mounted via `main.py` FastAPI app with `_obs.py` (174 LOC) providing `install_observability(app)` `/metrics` endpoint, `payload_guard()` DoS caps, and `track("<endpoint>")` latency/outcome counters.
- ✅ Per-domain rankers/scorers: `feed.py` (recency × affinity × diversity × engagement velocity), `search.py` (BM25-lite over title/body/tags + intent boosts), `trust_safety_ml.py` (deterministic explainable fraud scorer with code+severity bands), plus `recruiter_jobs.py`, `recruiter_dashboard.py`, `sales_navigator.py` (162 LOC), `enterprise_connect.py`, `enterprise_dashboard.py`, `media.py`, `podcasts.py`, `webinars.py`, `feed.py`, `network.py`, `profiles.py`, `companies.py`, `notifications.py`, `groups.py`, `events.py`, `interview_planning.py`, `job_applications.py`, `gigs_browse.py`, `jobs_browse.py`, `jobs_studio.py`, `agency.py`, `client_dashboard.py`, `customer_service.py`, `dispute_ops.py`, `moderator_dashboard.py`, `verification_compliance.py`, `ads_ops.py`, `ads_analytics_performance.py`, `ads_manager_builder.py`, `map_views_geo_intel.py`, `wallet_credits_packages.py`, `billing_invoices_tax.py`, `resource_planning_utilization.py`, `experience_launchpad.py`, `networking_events_groups.py`, `agency_management_dashboard.py`, `user_dashboard.py`.
- ✅ Tests: `test_enterprise_qa.py` (207 LOC), `test_turn2_rankers.py`, `test_turn3_identity.py`, `test_turn4_groups.py`.
- ⚠️ **All rankers are deterministic CPU-only heuristics** (BM25-lite, exp-decay recency, log-velocity). No ML training, no model artifacts, no model registry, no experiments/A-B framework, no feature store, no embedding store, no online learning, no `MODEL`/`VERSION` discipline beyond two-string constants in each file.
- ❌ Missing modules called out in earlier audits but never created: `boolean_search_parser.py`, `talent_match_score.py`, `ads_pacing.py`, `ads_bid_optimizer.py`, `ads_attribution.py`, `payouts_fraud.py`, `donations_recommend.py`, `integrations.py` (anomaly), `crm_dedupe.py`, `lookalike_audience.py`, `semantic_jobsearch.py`.

### NestJS ↔ ML wiring
- ✅ Only **6 NestJS services** call ml-python: `enterprise-hiring-workspace.ml.service.ts`, `gigs-browse.ml.service.ts`, `jobs-browse.ml.service.ts`, `media-viewer.module.ts`, `podcasts.module.ts`, `trust.ml.service.ts`. Out of 50+ NestJS modules, **only 6 actually consume the ML service** despite 53 ML routers existing.
- ✅ One real NestJS ML module exists: `trust-safety-ml/` (615 LOC: controller 62 + service 259 + repository 187 + dto 96 + module 11) — solid pattern but not replicated.
- ❌ **No NestJS modules**: `recommendations` (cross-domain Recommend-Service that frontends call uniformly), `ranking-bridge` (single bridge to ml-python with circuit-breaker/timeout/fallback), `signals-ingest` (events → feature store), `model-registry` (deploy/rollback model versions), `ab-experiments` (variant assignment + outcome capture), `personalization` (per-user vector cache), `moderation-pipeline` (joins trust_safety_ml signals → enforcement actions).
- ❌ `apps/api-nest` has zero ML-related shared infrastructure — every consumer hand-rolls its own ml-python URL, retries, fallback. No `MlBridgeModule` with `@Injectable()` `MlClient` providing typed methods like `rankFeed()`, `rankSearch()`, `scoreSignal()`, `recommendForUser()`.

### SDK
- ✅ Only **3 SDK files**: `moderator-dashboard.ts`, `trust-safety-ml.ts`, `trust.ts`.
- ❌ Missing: `recommendations.ts`, `ranking.ts`, `personalization.ts`, `signals.ts`, `experiments.ts`, `model-registry.ts`, `feature-flags.ts`, `embeddings.ts` — frontends cannot call ML in a typed way and instead inline fetch URLs.

### Frontend intelligence placement (CRITICAL GAP)
- ❌ **Zero dedicated recommendation components** exist in `src/components` — search for `*Recommend*`, `*Intelligence*`, `*ForYou*`, `*Suggested*`, `*Ranking*`, `*ScoreCard*`, `*MLBadge*`, `*Trust*` returned **NOTHING**.
- ❌ Despite ~4,475 LOC of ml-python rankers, **the frontend has no `<RecommendedForYou>`, `<TrendingNearYou>`, `<PeopleYouMightKnow>`, `<JobsMatchedToYou>`, `<GigsForYou>`, `<SimilarToThis>`, `<BecauseYouViewed>`, `<RankExplanation>` widgets**. Recommendation surfaces on Feed, Discovery, Marketplace, Recruiter, Network, Events, Podcasts, Webinars are **dead UI** — they show static unranked lists.
- ❌ **No `<MlBadge>` / `<RelevanceScore>` / `<TrustBadge>` chip primitive** to render rank/score reasons on cards. The `trust_safety_ml.py` returns explainable `reasons: ["code:...", "severity:..."]` arrays but no UI consumes them.
- ❌ **No `<RecommendationCarousel>`** primitive to standardise placement on dashboards / detail pages / search results.
- ❌ Only 3 hooks reference ML: `useTrustSafetyMl`, `useModeratorDashboard`, `useMapViewsGeoIntel`. Missing: `useRecommendations(scope)`, `useRanking(items)`, `usePersonalizedFeed`, `useSimilarItems(id)`, `useTrustScore(subject)`, `useExperimentVariant(key)`.
- ❌ Pages flagged as "having recommend" via grep (`LandingPage`, `NotificationsPage`, `EnterpriseConnectHomePage`, `BillingPage`, `GigCreatePage`, `GigDetailPage`, `ProductPage`, `ProjectDetailPage`, `AdsForecastingPage`, etc.) match the literal string `recommend` only in copy/comments — **none actually call a ranker endpoint**.

### Database
- ✅ `0060_moderation_queues.sql`, `0079_trust_safety_ml.sql` — moderation/trust tables exist.
- ❌ Missing tables: `ml_models` (registry: name/version/checksum/status/rollout_pct), `ml_model_deployments`, `ml_experiments` (A/B variants + traffic split), `ml_experiment_assignments` (sticky per-user variant), `ml_experiment_outcomes` (impression/click/convert/dwell), `recommendation_impressions` (what the ranker showed → for offline replay/training), `recommendation_clicks`, `recommendation_dismissals`, `personalization_vectors` (user embedding cache), `item_embeddings` (item embedding cache), `feature_store` (named features per subject with TTL), `signal_events` (raw events feeding ml-python), `model_feedback` (thumbs/explicit ratings), `ranking_explanations` (auditable: input features → output score), `moderation_actions` (signal → enforcement decision audit), `lookalike_audiences`.

### Mobile
- ✅ `mobile-flutter/lib/features/{trust,trust_safety_ml,moderator_dashboard,map_views_geo_intel}` — minimal parity.
- ❌ No mobile recommendation widgets, no mobile A/B framework, no mobile signal capture for client-side events feeding ML.

### Workers / Pipelines
- ❌ No `apps/workers/src/jobs/*` for: hourly recompute of personalization vectors, daily item-embedding refresh, hourly experiment outcome rollup, signal-events → feature-store ETL, model rollout traffic-shifting, recommendation impression flush from frontend → DB.

### Observability
- ✅ `_obs.py` provides `/metrics` and request-id middleware.
- ❌ No model-quality metrics (precision@k, MRR, NDCG, drift), no per-experiment dashboards, no per-model latency SLO breakdown beyond generic endpoint counters, no shadow-mode evaluation.

## Gaps (32 total — 10 P0 / 12 P1 / 7 P2 / 3 P3)

### P0
1. **Zero frontend ML placement** — 4,241 LOC of rankers ship with no `<RecommendedForYou>` / `<TrendingNearYou>` / `<PeopleYouMightKnow>` / `<JobsMatchedToYou>` / `<SimilarToThis>` widgets. The product is invisible to users.
2. **No `MlBridgeModule` in NestJS** — every consumer hand-rolls fetch + retry + fallback; only 6 of 50+ NestJS modules even call ml-python.
3. **No `recommendations` SDK module** — frontend cannot call rankers in a typed way.
4. **No model registry / experiments / variant assignment** — cannot ship a new ranker safely; cannot A/B test; cannot roll back a bad model.
5. **No impression/click/dismissal capture** — without `recommendation_impressions`/`recommendation_clicks` tables, no offline replay, no training data, no NDCG/MRR/precision@k measurement → ML cannot improve.
6. **No feature store** — every ranker recomputes from raw inputs each request; no shared features (`user.affinity_topics_30d`, `item.engagement_velocity_7d`); duplicated logic across 53 modules.
7. **No embedding store / vector index** — semantic search/similar-item/lookalike audiences impossible without `item_embeddings` + pgvector or external vector DB.
8. **No personalization vectors** — every request is anonymous-feeling; per-user vector cache absent.
9. **No `<MlBadge>` / `<RankExplanation>`** UI primitive — rankers return reasons but UI hides them; trust/transparency posture violated.
10. **Missing critical ML modules**: `boolean_search_parser.py` (D19), `talent_match_score.py` (D19), `ads_pacing.py`/`ads_bid_optimizer.py`/`ads_attribution.py` (D18), `payouts_fraud.py`/`donations_recommend.py` (D17), `integrations.py` (D20). Cross-domain ML debt accumulated.

### P1
11. **No moderation pipeline** joining trust_safety_ml signals → automatic enforcement (auto-hide/queue/escalate) with audit trail.
12. **No signals-ingest module** — events from frontend (impressions, dwell, scroll-depth, hover) have nowhere to flow into ML.
13. **No experiments dashboard** in admin terminal (variant traffic, lift, p-value, guardrail metrics).
14. **No shadow-mode** — cannot run a candidate model alongside production to compare without user impact.
15. **No drift monitoring** — feature distribution drift, prediction drift, label drift unchecked.
16. **No model rollout controls** — cannot say "10% of traffic to v2" with sticky assignment.
17. **No `useRecommendations(scope)` / `useRanking(items)` / `useSimilarItems(id)` hooks**.
18. **No `<RecommendationCarousel>` primitive** — placement on dashboards/detail pages/search results would be ad-hoc even if widgets existed.
19. **No model-feedback capture** (thumbs up/down on recommendations).
20. **No cross-model ensembling** (combine search BM25 + semantic + recency + personalization weights).
21. **No `MlClient` typed methods** — every consumer types its own request/response shape.
22. **No mobile signal capture** — Flutter app can't feed events back to ML.

### P2
23. **No precision@k / MRR / NDCG / hit-rate** evaluation harness.
24. **No replay tooling** to backfill rankers on historical impressions.
25. **No per-segment fairness audit** (gender, geography, age bucket — required for FCA/GDPR posture).
26. **No cold-start strategy** for new users / new items.
27. **No lookalike audiences** for ads (D18 dependency).
28. **No real-time feature freshness SLO** (e.g. impression should affect next request within 60s).
29. **No `feature-flags.ts` SDK** (orthogonal to experiments but needed).

### P3
30. **No on-device personalization** (privacy-preserving inference on mobile/web).
31. **No federated learning** (cross-tenant model improvement without sharing data).
32. **No knowledge-graph backbone** for related-entity reasoning.

## Recommended Run 2 (Build) priorities

1. **Build `MlBridgeModule`** in NestJS with `@Injectable() MlClient` providing typed `rankFeed()`, `rankSearch()`, `scoreSignal()`, `recommend(scope, viewer, candidates)`, `similar(itemId, k)`, `trustScore(subject)` — with circuit-breaker, p95 timeout, deterministic fallback.
2. **Build `recommendations` NestJS module** as the cross-domain entry point: per-scope endpoints (`/feed`, `/people-you-may-know`, `/jobs-for-you`, `/gigs-for-you`, `/services-for-you`, `/similar-to/:id`, `/trending`, `/because-you-viewed/:id`).
3. **Add SDK modules**: `recommendations.ts`, `ranking.ts`, `personalization.ts`, `signals.ts`, `experiments.ts`, `model-registry.ts`, `feature-flags.ts`, `embeddings.ts`.
4. **Add migration `0088_ml_intelligence_fabric.sql`**: `ml_models`, `ml_model_deployments`, `ml_experiments`, `ml_experiment_assignments`, `ml_experiment_outcomes`, `recommendation_impressions`, `recommendation_clicks`, `recommendation_dismissals`, `personalization_vectors` (pgvector), `item_embeddings` (pgvector), `feature_store`, `signal_events`, `model_feedback`, `ranking_explanations`, `moderation_actions`, `lookalike_audiences`.
5. **Build frontend primitives** in `src/components/intelligence/`: `<RecommendedForYou>`, `<TrendingNearYou>`, `<PeopleYouMightKnow>`, `<JobsMatchedToYou>`, `<GigsForYou>`, `<ServicesForYou>`, `<SimilarToThis>`, `<BecauseYouViewed>`, `<RecommendationCarousel>`, `<MlBadge>`, `<RankExplanation>`, `<TrustBadge>`, `<RelevanceScore>`, `<RecommendationFeedback>` (thumbs).
6. **Build hooks**: `useRecommendations(scope, viewer)`, `useRanking(items, query?)`, `useSimilarItems(id, k)`, `useTrustScore(subject)`, `useExperimentVariant(key)`, `useImpressionTracker(scope)` (auto-flushes impressions to backend).
7. **Mount widgets on these surfaces**: Feed (PeopleYouMayKnow + TrendingNearYou), Discovery (RecommendedForYou + TrendingNearYou per category), Marketplace gig/service detail (SimilarToThis + BecauseYouViewed), Recruiter Talent Search (JobsMatchedToYou for candidates, CandidatesMatchedToJob for recruiters), Network (PeopleYouMayKnow), Events (EventsForYou), Podcasts/Webinars (RecommendedForYou), Profile (PeopleYouMayKnow), Dashboards (Recommended actions/items per role).
8. **Build `signals-ingest` module** + `signal_events` table + frontend `useImpressionTracker` auto-flusher.
9. **Build `model-registry` module** + admin terminal page (deploy/rollback/traffic-shift) + `experiments` module + admin experiments dashboard (variant lift, p-value, guardrails).
10. **Add missing ml-python modules**: `boolean_search_parser.py`, `talent_match_score.py`, `ads_pacing.py`, `ads_bid_optimizer.py`, `ads_attribution.py`, `payouts_fraud.py`, `donations_recommend.py`, `integrations.py`, `crm_dedupe.py`, `lookalike_audience.py`, `semantic_jobsearch.py` (closes cross-domain ML debt from D17–D20).
11. **Add embeddings**: enable pgvector; add `item_embeddings` + `personalization_vectors`; nightly worker to refresh; expose `similar(itemId, k)` via vector search.
12. **Add evaluation harness** (`apps/ml-python/eval/`): precision@k / MRR / NDCG / hit-rate / coverage / diversity / freshness on replayed `recommendation_impressions`.
13. **Add observability**: per-model p50/p95 latency, prediction drift, feature drift, fairness metrics per protected segment.
14. **Add Playwright**: feed loads with PeopleYouMayKnow widget → click feedback thumb → variant assignment sticky across reloads → impression captured in DB.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

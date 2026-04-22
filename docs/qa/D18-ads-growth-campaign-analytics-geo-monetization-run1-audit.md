# D18 — Ads, Growth, Campaign Analytics, Geo Targeting & Monetization — Run 1 Audit

Date: 2026-04-18 · Group: G5 (D18/4) · Status: Run 1 (Audit) complete.

## Inventory

### Frontend pages (23 surfaces, 4,475 LOC ads + 1 geo)
- `src/pages/ads/` (22 pages). Top-level: AdsHomePage 141, AdsManagerPage **760**, AdsAnalyticsPage **742**, AdsOpsDashboardPage **528**.
- Builders: AdSetBuilder 100, CreativeBuilder 133, AudienceBuilder 110, KeywordBuilder 119, BidBudget 100, GeoTargeting 122, PlacementManager 127.
- Detail/list: CampaignList 131, CampaignDetail 158, AssetLibrary 123, SavedAudiences 149.
- Performance/insight: CreativePerformance 154, CreativeCompare 119, AudienceInsights 118, Attribution 145, Forecasting 120, Billing 123, PolicyReview 153.
- Geo: `src/pages/geo/MapGeoIntelPage.tsx`.
- Missing: no `src/pages/monetization/`, no `src/pages/promotions/`, no `src/pages/growth/`, no `src/pages/sponsorship/` — pricing/promo/monetization handled via `src/pages/finance/PricingMonetizationPage.tsx` (already counted in D17).

### Mock / router debt
- **4 of 23 pages** still on `react-router-dom`/MOCK_: AdsHomePage, AdsManagerPage **(760)**, AdsAnalyticsPage **(742)**, AdsOpsDashboardPage **(528)** — the **3 largest pages = 2,030 LOC**.

### Backend (5 NestJS modules — full controller/service/repo/dto each)
- `ads-manager-builder`, `ads-analytics-performance`, `ads-ops`, `map-views-geo-intel`, `pricing-promotions-monetization`.

### SDK
- ✅ `ads-ops.ts` only.
- ❌ Missing: `ads-manager-builder.ts`, `ads-analytics-performance.ts`, `map-views-geo-intel.ts`, `pricing-promotions-monetization.ts` (hooks exist but no typed contract).

### Hooks
- ✅ `useAdsAnalyticsPerformance`, `useAdsManagerBuilder`, `useAdsOps`, `useMapViewsGeoIntel`, `usePricingPromotionsMonetization`.

### Migrations
- ✅ 0061 ads-manager-builder · 0062 ads-analytics-performance · 0063 map-views-geo-intel · 0067 pricing-promotions-monetization · 0080 ads-ops.
- ⚠️ Likely-missing durable tables: `ad_impressions` + `ad_clicks` (event-grain log for CPC/CPM/CTR), `ad_conversions` + `attribution_touchpoints` (multi-touch attribution), `ad_creatives_assets` (R2/S3 refs), `audience_segments` + `lookalike_seeds`, `geofences` + `geofence_events`, `frequency_caps`, `pacing_state` (budget burn-down per hour), `bid_history`, `policy_violations` + `appeals`, `placements_inventory`, `affiliate_tracking_links`.

### ML / Python
- ✅ `ads_manager_builder.py`, `ads_analytics_performance.py`, `ads_ops.py`, `map_views_geo_intel.py`.
- ❌ Missing: `ads_pacing.py` (real-time budget pacing), `ads_bid_optimizer.py` (autobid), `ads_lookalike.py` (audience expansion), `ads_attribution.py` (Markov / Shapley multi-touch), `ads_brand_safety.py` (creative content moderation), `ads_geo_uplift.py` (geo experiment lift).

### Components
- ❌ **No `src/components/ads/` or `src/components/geo/` directory.** Missing primitives: `<CampaignWizard>` (objective → audience → placement → creative → budget → review), `<CreativeUploadStudio>` (image/video/carousel/HTML5), `<AudienceBuilder>` (interest/behaviour/lookalike/custom-list), `<GeoMapPicker>` (radius/polygon/postcode/DMA on Mapbox/MapLibre), `<BidStrategySelector>`, `<PacingChart>`, `<AttributionFunnel>`, `<CreativePreviewMatrix>` (mobile/desktop/feed/story/reel), `<HeatmapOverlay>`, `<ChoroplethMap>`, `<PolicyReviewBadge>`, `<PromoCodeForm>`, `<DiscountStack>`.

### Mobile + Tests
- ✅ Mobile features for all 5 modules. ✅ Playwright specs for all 5 (probe-level only).

### Maps / geo provider
- ❌ **No Mapbox/MapLibre/Leaflet/Google Maps** integration evident — `MapGeoIntelPage` and `AdsGeoTargetingPage` cannot render an actual map. No `mapbox-gl`, `maplibre-gl`, `leaflet`, or `@react-google-maps/api` in deps.

### External integrations
- ❌ No Meta Business / Google Ads / TikTok Ads / LinkedIn Ads connector for cross-posting (current ads stack appears to be platform-native only — confirm scope).
- ❌ No GeoIP service (MaxMind GeoLite2 / IPinfo / ipapi) for impression geo-tagging.
- ❌ No conversion tracking pixel / S2S endpoint for advertisers' websites.
- ❌ No fraud/IVT (invalid traffic) detection (HUMAN/IAS/MOAT).

## Gaps (26 total — 7 P0 / 9 P1 / 7 P2 / 3 P3)

### P0
1. **No map rendering library** — geo targeting + geo intel are unusable without Mapbox/MapLibre. Pick MapLibre GL JS + free OSM tiles (no API key needed) for cost, or Mapbox for richer styles.
2. **3 largest pages on `react-router-dom`/MOCK_** (AdsManagerPage 760, AdsAnalyticsPage 742, AdsOpsDashboardPage 528 = 2,030 LOC). Must migrate to TanStack + SDK.
3. **4 missing SDK files** (`ads-manager-builder.ts`, `ads-analytics-performance.ts`, `map-views-geo-intel.ts`, `pricing-promotions-monetization.ts`).
4. **No event-grain impression/click/conversion tables** — CPC/CPM/CTR/CVR cannot be computed without `ad_impressions`/`ad_clicks`/`ad_conversions`. P0 because the entire analytics stack collapses without them.
5. **No real-time pacing engine** — budgets will overshoot daily caps without a `pacing_state` table + worker decrementing budget per hour. Money-loss risk.
6. **No creative storage/CDN path** — `ad_creatives_assets` referencing R2/S3 absent; CreativeBuilder/AssetLibrary have nowhere to upload.
7. **No `src/components/ads/` primitives** — 22 pages duplicate logic; CampaignWizard / AudienceBuilder / GeoMapPicker / CreativePreviewMatrix needed before any further build.

### P1
8. **No multi-touch attribution** — only last-click possible; needs Markov/Shapley in `ads_attribution.py` + `attribution_touchpoints` table.
9. **No autobidder** — manual CPC/CPM only; `ads_bid_optimizer.py` for tCPA/tROAS absent.
10. **No lookalike audiences** — `ads_lookalike.py` + `lookalike_seeds` absent.
11. **No frequency capping** — risk of audience burnout; `frequency_caps` table absent.
12. **No brand safety / IVT** — creative moderation + invalid traffic filtering absent; budget waste + reputational risk.
13. **No geofence event ingestion** — `geofences` + `geofence_events` absent for foot-traffic measurement.
14. **No A/B / multi-arm-bandit creative testing** — CreativeCompare page exists but no experiment infrastructure.
15. **No conversion pixel / S2S endpoint** — advertisers can't report conversions back from their site.
16. **No promo code / discount stack engine** — `pricing-promotions-monetization` migration exists but no rules engine for stacking, expiry, eligibility.

### P2
17. **No GeoIP provider** — impressions can't be geo-tagged; MaxMind GeoLite2 binding needed.
18. **No DMA / postcode targeting** — only country/region likely; need Nielsen DMA + postcode polygon set.
19. **No dayparting / scheduling** — campaigns run 24/7 only.
20. **No native cross-platform publishing** — Meta/Google/TikTok Ads connectors absent.
21. **No affiliate tracking** — `affiliate_tracking_links` absent.
22. **No revenue attribution back to wallet/payouts** (D17 link) — ad spend → invoice → wallet debit not wired end-to-end.
23. **No GDPR consent gating on tracking** — IAB TCF v2.2 / Google Consent Mode v2 absent.

### P3
24. **Playwright probe-only** — needs full create campaign → upload creative → set audience+geo+bid → submit for review → simulate impressions → close-loop conversion → invoice → pay.
25. **Mobile parity** — verify map + creative preview on Flutter.
26. **No `<HeatmapOverlay>` / `<ChoroplethMap>`** — geo intel page can show data but not visualize density.

## Recommended Run 2 (Build) priorities
1. Add MapLibre GL JS (free, no API key) + `<GeoMapPicker>` (radius/polygon/postcode draw) + `<HeatmapOverlay>` / `<ChoroplethMap>` under `src/components/geo/`.
2. Build `src/components/ads/` primitives: `<CampaignWizard>` (6-step), `<AudienceBuilder>`, `<CreativeUploadStudio>`, `<CreativePreviewMatrix>` (mobile/desktop/feed/story/reel), `<BidStrategySelector>`, `<PacingChart>`, `<AttributionFunnel>`, `<PolicyReviewBadge>`, `<PromoCodeForm>`.
3. Add 4 SDK files: `ads-manager-builder.ts`, `ads-analytics-performance.ts`, `map-views-geo-intel.ts`, `pricing-promotions-monetization.ts`.
4. Migrate AdsManagerPage / AdsAnalyticsPage / AdsOpsDashboardPage / AdsHomePage off `react-router-dom`+MOCK_ to TanStack + SDK; split each (>500 LOC) into per-tab routes.
5. Migration `0084_ads_event_grain.sql`: `ad_impressions`, `ad_clicks`, `ad_conversions`, `attribution_touchpoints`, `ad_creatives_assets` (R2/S3), `audience_segments`, `lookalike_seeds`, `geofences`, `geofence_events`, `frequency_caps`, `pacing_state`, `bid_history`, `policy_violations`, `placements_inventory`, `affiliate_tracking_links`.
6. Add real-time pacing worker (every minute) + autobidder cron + lookalike batch job.
7. Add `ads_pacing.py`, `ads_bid_optimizer.py`, `ads_lookalike.py`, `ads_attribution.py`, `ads_brand_safety.py`, `ads_geo_uplift.py`.
8. Add MaxMind GeoLite2 GeoIP, conversion pixel + S2S endpoint, IAB TCF v2.2 consent gate.
9. Wire ad spend → D17 invoices/wallet (closes the money loop).
10. Expand Playwright with full campaign lifecycle + Stripe test-mode billing.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

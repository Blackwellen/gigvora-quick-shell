# D12 — Gigs, Services, Orders, Custom Offers, Bookings & Seller Operations — Run 1 Audit

Date: 2026-04-18 · Group: G3 · Status: Run 1 (Audit) complete. Closes G3.

## Scope coverage
- **Frontend** — 33 pages, ~7,400 LOC across 4 namespaces:
  - `src/pages/gigs/` (19 pages): `GigsDiscoveryPage` (813), `GigsPages` (599), `GigDetailPage` (869), `GigCreatePage` (470 — Creation Studio wizard), `GigOrderPage`, `GigOrdersCenterPage`, `GigPackagesBuilderPage`, `GigAddonsBuilderPage`, `GigRequirementsBuilderPage`, `GigPricingIntelPage`, `GigPromotionsPage`, `GigMediaManagerPage`, `GigAnalyticsPage`, `GigArchivePage`, `GigWorkspaceHomePage`, `RevisionManagementPage`, `CustomOffersPage`, `SellerAvailabilityPage`, `SellerPerformancePage` (676).
  - `src/pages/services/` (14 pages): `ServicesMarketplacePage`, `ServicesBrowsePage`, `ServiceDetailPage` + `ServiceDetailPageFull`, `ServiceListingBuilderPage` (388) + `ServiceListingBuilderPageFull`, `ServicePackagesBuilderPage`, `ServiceBookingPage`, `ServiceDeliveryPage`, `ServiceAvailabilityPage`, `ServicePromotionsPage`, `ServiceAnalyticsPage`, `ServiceOrdersCenterPage`, `ServiceOrdersPage`.
  - `src/pages/orders/`: `OrdersDashboardPage` (905 — biggest D12 page).
  - `src/pages/offers/`: `OffersPage`.
- **Backend (4 NestJS modules)** — `gigs-browse`, `booking`, `seller-performance-availability`, `customer-service`. ❌ **No modules for: gig-detail/creation-studio, custom-offers/price-match, orders-fulfilment, services-catalogues** (legacy domains 42/43/44/45/47).
- **ML** ✅ `booking.py`, `gigs_browse.py`, `customer_service.py`. ❌ no `seller_performance.py`, no `pricing_intel.py`, no `orders_routing.py`.
- **SDK** ✅ `booking.ts`, `customer-service.ts`. ❌ **missing `gigs-browse.ts`, `seller-performance-availability.ts`, `services.ts`, `orders.ts`, `custom-offers.ts`, `gig-creation-studio.ts`** — six SDK modules.
- **Migrations** ✅ 4 files (`0016_booking`, `0041_gigs_browse`, `0046_seller_performance_availability`, `0075_customer_service`). ❌ **no DDL for: services catalogue, orders/fulfilment, custom offers / price-match, gig creation (packages/addons/requirements/media), revisions, promotions**.
- **Seeders** — only `0014_seed_booking.sql`. ❌ no seeders for gigs/services/orders/seller/customer-service.
- **Hooks** ✅ 4 (`useBookingData`, `useCustomerService`, `useGigsBrowse`, `useSellerPerformanceAvailability`).
- **Playwright** ✅ 4 specs (booking, customer-service, gigs-browse, seller-performance-availability) — all probe-only.

## Gaps (26 total — 8 P0 / 9 P1 / 7 P2 / 2 P3)

### P0 — blockers
1. **Massive backend coverage gap** — 4 of the 7 legacy D12 domains have **no NestJS module**: gig-creation-studio (legacy 43), custom-offers/price-match (44), orders-fulfilment (45), services-catalogues (47). All present-only as frontend pages = effectively mock.
2. **Six missing SDK modules** in `packages/sdk/src/`: `gigs-browse`, `seller-performance-availability`, `services`, `orders`, `custom-offers`, `gig-creation-studio`. Even where the backend exists (gigs-browse, seller-performance-availability), the frontend has no type-safe client.
3. **Missing migrations** for: services catalogue, orders/fulfilment line-items, custom_offers + price_match, gig packages/addons/requirements/media, revisions, promotions/coupons. Seeders exist for 1 of 4 modules; nothing for the missing 4 domains.
4. **`OrdersDashboardPage.tsx` (905 LOC)** is the largest page in D12 — mock-driven (1 router hit, almost certainly composite mock state), no `orders` module/SDK to bind to.
5. **`GigDetailPage.tsx` (869)** mock-driven — gig detail/packages/addons/requirements/reviews/seller card all need orders + gigs-detail backend that doesn't exist.
6. **`GigsDiscoveryPage.tsx` (813)** still on `react-router-dom` — needs `sdk.gigsBrowse.*` (which itself needs to be created) plus saved-search/AdvancedFilterPanel wiring per `mem://features/advanced-filtering-system`.
7. **`SellerPerformancePage.tsx` (676)** + `GigsPages.tsx` (599) mock-driven — no `seller-performance-availability` SDK to bind seller scorecard, response-time, on-time delivery, completion-rate, capacity slots.
8. **Zero WebSocket gateways** for D12 — order status transitions (placed→accepted→in-progress→delivered→revision→completed→disputed), booking acceptance/reschedule, custom-offer counters, seller availability changes, revision requests cannot be realtime. `grep WebSocketGateway | grep -iE gig|order|booking|seller` → no hits.

### P1
9. **`GigCreatePage` (470 — Creation Studio wizard)** per `mem://features/commercial-builders` should be a 10-step draftable wizard; needs `gig-creation-studio` backend + draft autosave endpoint.
10. **`ServiceListingBuilderPage` (388) and Full (variant)** — duplicate "Full" variants suggest indecision; consolidate to single canonical builder (services 14 pages contain `ServiceDetailPage` + `ServiceDetailPageFull`, `ServiceListingBuilderPage` + `ServiceListingBuilderPageFull`, `ServiceOrdersCenterPage` + `ServiceOrdersPage`). Decide canonical, redirect duplicates.
11. **No Stripe wiring** for gig/service order checkout, custom-offer accept→checkout, revision-fee charge, booking deposit. `apps/integrations/src/payments/stripe.ts` exists but no controller wiring visible.
12. **No escrow/payouts** path for sellers — D34 owns escrow per docs; confirm `OrdersDashboardPage` payouts column flows through `proposal-builder-bid-credits` escrow service or has its own marketplace-orders escrow.
13. **No OpenSearch indexer** for gigs/services in `apps/search-indexer/src/index.ts` — `GigsDiscoveryPage` and `ServicesMarketplacePage` advanced filters cannot scale beyond a few thousand listings.
14. **No workers** for: `order_sla_breach` (delivery clock), `revision_window_expiry`, `auto_complete_after_72h`, `seller_response_time_compute`, `custom_offer_expiry`, `booking_reminder`, `pricing_intel_refresh`, `promotion_expiry`.
15. **No customer-service intake from orders** — `customer-service` module exists separately; verify dispute-open from `OrdersDashboardPage` creates a ticket and links to escrow hold.
16. **Marketplace differentiation** per `mem://features/marketplace-differentiation` — Gigs (productized, tiered packages) vs Services (consultative, custom scope). Audit confirms two namespaces exist; verify routing/IA prevents user confusion (e.g. "gig with hourly retainer" should redirect to Service builder).
17. **A8 player** — gig media (image carousel, video preview, before/after, audio sample, 3D/figma embed) on `GigDetailPage` and `GigMediaManagerPage` not validated.

### P2
18. **Mobile parity** — no Flutter feature folders for gigs, services, orders, offers, seller, booking. Booking has backend + ML but no mobile client.
19. **Entitlements** — Pro/Team/Enterprise gating on Promotions, Pricing Intel, Multi-package gigs, Custom Offers; verify `EntitlementGate`.
20. **Audit trail** — order state changes, refunds, escrow holds, dispute outcomes — confirm admin audit log writes.
21. **Privacy/no-index** — `/sell/*`, `/orders/*`, builder pages must be `noindex`; public discovery (`/gigs`, `/services`) should be indexable with proper SEO + product schema.
22. **Realtime presence** in `GigWorkspaceHomePage` (buyer + seller in same order workspace).
23. **Rate limiting** on custom-offer creation (anti-spam) and revision requests (anti-abuse).
24. **Idempotency** on order placement, payment capture, payout — confirm `Idempotency-Key` enforcement.

### P3
25. **Playwright is probe-only** for all 4 specs. Need: place-order checkout, custom-offer accept, revision request, booking reschedule, seller decline, dispute open, payout.
26. **Five monoliths to extract**: `OrdersDashboardPage` (905), `GigDetailPage` (869), `GigsDiscoveryPage` (813), `SellerPerformancePage` (676), `GigsPages` (599).

## Domain completion matrix (Run 1 status)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- File: 33 pages in `src/pages/{gigs,services,orders,offers}/`, 4 modules in `apps/api-nest/src/modules/`, 4 migrations, 1 seeder, 2 SDK files, 4 hooks, 4 Playwright specs.
- No browser/test execution captured this run.

## Recommended Run 2 (build) priorities
1. **Backend creation (largest D12 build):**
   - `apps/api-nest/src/modules/services-catalogue/` (catalogue, listings, packages, availability, promotions, analytics).
   - `apps/api-nest/src/modules/orders-fulfilment/` (orders state machine, deliverables, revisions, disputes, payouts hook to D34 escrow).
   - `apps/api-nest/src/modules/custom-offers-price-match/` (custom offers, counters, expiry, price-match guarantees).
   - `apps/api-nest/src/modules/gig-creation-studio/` (10-step wizard drafts, packages, addons, requirements, media).
2. **Migrations** for all four new modules + seeders.
3. **Six SDK modules** in `packages/sdk/src/` and export from index.
4. **Rewrite the 5 monoliths** off MOCK_/react-router-dom: `OrdersDashboardPage`, `GigDetailPage`, `GigsDiscoveryPage`, `SellerPerformancePage`, `GigsPages`.
5. **Add WS gateways**: `orders-fulfilment.gateway.ts` (order state + revision requests), `booking.gateway.ts` (acceptance/reschedule), `custom-offers.gateway.ts` (counter/expiry), `seller-performance-availability.gateway.ts` (availability changes).
6. **ML services**: `seller_performance.py` (response-time + completion-rate scoring), `pricing_intel.py` (market median by category/skill/region), `orders_routing.py` (capacity-aware load balancing across seller team).
7. **Stripe checkout** wiring for gig orders, custom-offer accept, revision fees, booking deposits.
8. **OpenSearch gigs + services indexers** + saved-search alert workers.
9. **Consolidate** duplicate `*Full` page variants to single canonical files; redirect.
10. **Flutter feature folders** for gigs/services/orders/offers/booking parity.
11. **Expand Playwright** — full checkout, custom-offer accept, revision request, booking reschedule, dispute open scenarios.

---

## G3 audit closure
With D12 audited, **Group 3 (Recruitment, Projects, Services Commerce, and Execution Workflows) Run 1 audit phase is complete**. Audits delivered: D09 (18 gaps), D10 (22), D11 (24), D12 (26) = **90 gaps documented across G3**, with the consistent themes being:
- **SDK gaps**: 11+ missing SDK modules across G3.
- **Mock + `react-router-dom`** persisting in 12+ large pages (>500 LOC each).
- **Zero WebSocket gateways** across all G3 modules — no realtime anywhere yet.
- **Missing DDL** for jobs/applications/credits (D09) and the entire D10 recruiter stack despite seeders existing.
- **Largest backend gap**: D12 services-catalogue, orders-fulfilment, custom-offers, gig-creation-studio — 4 missing modules.
- **Largest frontend gap**: G3 contains 17 pages over 500 LOC; top monoliths are `ProjectWorkspacePage` (1277), `OrdersDashboardPage` (905), `RecruiterJobsPage` (938), `ApplicationTrackerPage` (979), `NotificationsPage` (934 — D08), `GigsPages` (888 D09 jobs misnamed?), `TaskBoardPage` (867), `GigDetailPage` (869).

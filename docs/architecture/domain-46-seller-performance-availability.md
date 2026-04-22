# Domain 46 — Seller Performance, Capacity, Availability, and Offer Optimization

**Route family:** `/app/seller-performance-availability` (web: `/gigs/availability`)

## Layers
- **Schema** — `packages/db/src/schema/seller-performance-availability.ts`
  - `seller_availability` (1-per-seller working hours, queue limits, vacation)
  - `seller_gig_capacity` (per-gig pause + queue depth)
  - `seller_performance_snapshots` (rolling KPI snapshots, immutable)
  - `seller_offer_optimizations` (suggestions with open|dismissed|applied lifecycle)
  - `seller_availability_events` (audit ledger)
- **Migration** — `packages/db/migrations/0046_seller_performance_availability.sql`
- **NestJS** — `apps/api-nest/src/modules/seller-performance-availability/`
  - DTOs zod-validated, controller ↔ service ↔ repository split
  - State machine for gig capacity: `active → paused → active`, `→ archived`
  - Strict RBAC: only the seller (or admin overlay) may mutate
- **Analytics** — `apps/analytics-python/app/seller_performance_availability.py`
  - `/seller-performance/summary` — health classification + flags + recommendations
  - `/seller-performance/capacity-hint` — utilization posture (`accept_more|balanced|throttle`)
- **ML** — Shared signals deferred; deterministic snapshot fallback in service.
- **Frontend hook** — `src/hooks/useSellerPerformanceAvailability.ts`
  - `useSellerOverview` + `useSellerActions` with demo-mode fallback (preserves UI)
- **Flutter** — `apps/mobile-flutter/lib/features/seller_performance_availability/`
  - Bottom-sheet vacation scheduler, swipe-to-pause gig rows, optimization tap-apply
- **Tests** — `tests/playwright/seller-performance-availability.spec.ts`

## Logic paths validated
- Entry: `/gigs/availability` → overview load with demo fallback
- Update working hours / queue limits → audit event
- Schedule vacation → status auto-transitions to `vacation`
- Pause all gigs → bulk status change + audit
- Optimization apply/dismiss → status lifecycle close-out
- Mobile parity: swipe gesture mirrors web pause toggle

## Completion gates
- ✅ Build (NestJS module, repo, service, controller, DTOs, migration)
- ✅ Integration (hook ready for `SellerAvailabilityPage` wiring; Flutter screen + API)
- ✅ Validation (Playwright smoke; deterministic ML/analytics fallback verified)

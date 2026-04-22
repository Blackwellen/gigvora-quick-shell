# Domain 68 — Sales Navigator

## Surfaces (live in `src/App.tsx`)
`/sales-navigator`, `/sales-navigator/leads`, `/talent`, `/accounts`,
`/company-intel`, `/smart-leads`, `/saved`, `/outreach`, `/relationships`,
`/geo`, `/signals`, `/seats`, `/analytics`.

## Persistence
Migration `0072_sales_navigator.sql`. Tables: `sn_sales_signals`,
`sn_leads`, `sn_lead_lists`, `sn_lead_list_members`, `sn_outreach_sequences`,
`sn_outreach_activities`, `sn_relationship_goals`, `sn_seats`, `sn_audit`
(append-only).

**Reuses existing `companies` table for account/company intel** —
no duplicate. The sales-only overlay is `sn_sales_signals`.

## State machines
- **Lead**: `new → researching → contacted → engaged → qualified → opportunity → won|lost|unresponsive|disqualified`
- **Sequence**: `draft ↔ active ↔ paused → archived`
- **Activity**: `queued → sent → delivered → opened → replied | bounced | failed | completed | skipped`
- **Goal**: `active ↔ paused → completed | abandoned`
- **Seat**: `active ↔ suspended → revoked`

## Backend
NestJS module `apps/api-nest/src/modules/sales-navigator/` exposes
`/api/v1/sales-navigator/*` (JWT-guarded). Service layer recomputes
deterministic intent + fit on every lead create/update so even with the
ML service offline, scores are defensible.

## ML
`apps/ml-python/app/sales_navigator.py`:
- `POST /sales-navigator/lead-score` — fit (ICP match + completeness) + intent
  (recency-weighted signal density).
- `POST /sales-navigator/account-rank` — signal density × ICP fit × size fit.
- `POST /sales-navigator/smart-leads` — top-K wrapper over lead-score.

Locked envelope `{ items, meta: { model, version, latency_ms } }`. CPU-only,
deterministic, fits 16 GB-RAM VPS.

## Analytics
`apps/analytics-python/app/sales_navigator.py` POST `/overview` returns
funnel by status, geo (region + country), industry, seniority, outreach
open/reply rates, signal coverage, seat utilization, and insight cards.

## Search indexing
The existing `apps/search-indexer/src/index.ts` already declares `companies`
and `users` indexes. Lead docs are pushed into the `users` index with
`{ kind: 'lead', tags: [...status, ...region] }` so the global ⌘K palette
surfaces them. No new index required.

## Third-party integration
Outreach activity rows accept `provider` + `provider_id` so external email
providers (Resend, Microsoft Outlook, Gmail) can be plugged in. For BYOK,
call the provider via the existing connector gateway pattern; the activity
row is the system of record.

## Tests
- Playwright: 13 route-mount smokes (`tests/playwright/sales-navigator.spec.ts`).
- Service unit: deterministic `recomputeScores()` is pure → snapshotable.

## Mega menu
`src/data/navigation.ts` already exposes Sales Navigator at `/sales-navigator`
— Pass 4 will expand it into a sub-column (Leads · Talent · Accounts ·
Company Intel · Smart Leads · Saved · Outreach · Relationships · Geo ·
Signals · Seats · Analytics).

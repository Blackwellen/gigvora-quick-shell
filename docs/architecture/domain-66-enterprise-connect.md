# Domain 66 — Enterprise Connect & Startup Showcase

## Route family
`/app/enterprise-connect/*` (also surfaced under `/enterprise-connect/*`).

## Surfaces (already mounted in `src/App.tsx`)
- `/enterprise-connect` — `EnterpriseConnectHomePage`
- `/enterprise-connect/directory` — `EnterpriseDirectoryPage`
- `/enterprise-connect/profile` — `EnterpriseProfilePage`
- `/enterprise-connect/partners` — `EnterprisePartnerDiscoveryPage`
- `/enterprise-connect/procurement` — `EnterpriseProcurementPage`
- `/enterprise-connect/intros` — `EnterpriseIntrosPage`
- `/enterprise-connect/events` — `EnterpriseEventsPage`
- `/enterprise-connect/rooms` — `EnterpriseRoomsPage`
- `/enterprise-connect/analytics` — `EnterpriseAnalyticsPage`
- `/enterprise-connect/startups` — `StartupShowcasePage`
- `/enterprise-connect/startups/:id` — `StartupDetailPage`

## Persistence
Migration: `packages/db/migrations/0070_enterprise_connect.sql`
Schema: `packages/db/src/schema/enterprise-connect.ts`

Tables (`ec_*`): `org_profiles`, `directory_entries`, `partners`,
`procurement_briefs`, `intros`, `rooms`, `events`, `startups`, `audit`.

Constraints:
- `ec_audit` is **append-only** (Postgres trigger blocks UPDATE/DELETE).
- Status enums enforced via CHECK constraints.
- Unique partner pair: `(org_id_a, org_id_b, relation_kind)`.
- `ec_startups.org_id` and `ec_directory_entries.org_id` are 1:1 with `ec_org_profiles`.

## Backend
NestJS module: `apps/api-nest/src/modules/enterprise-connect/`
- `controller` — REST under `/api/v1/enterprise-connect/*`, JWT-guarded.
- `service` — business rules + state machines + deterministic partner ranker.
- `repository` — raw SQL via TypeORM DataSource (returns plain rows).
- `dto` — Zod schemas with strict bounds (DoS-safe arrays, URL/email checks).

State machines:
- **Org**: draft ↔ active ↔ paused → archived.
- **Brief**: draft → open → shortlisting → awarded → closed → archived.
- **Intro**: pending → accepted | declined | expired | completed | cancelled.
- **Room**: draft → scheduled → live → ended → archived.
- **Event**: draft → published → completed | cancelled.

## ML
`apps/ml-python/app/enterprise_connect.py`
- `POST /enterprise-connect/partner-match` — Jaccard caps + industry + geo.
- `POST /enterprise-connect/startup-rank` — bounded tanh on MRR/growth/customers.
Locked envelope: `{ items|ranked, meta: { model, version, latency_ms } }`.

## Analytics
`apps/analytics-python/app/enterprise_connect.py`
- `POST /enterprise-connect/overview` — totals, byKind, byStatus, intro accept-rate, insight cards.

## SDK
`packages/sdk/src/enterprise-connect.ts` — typed envelopes shared by web + mobile.

## Web hooks
`src/hooks/useEnterpriseConnect.ts` — `useEcOverview`, `useEcMyOrg`,
`useEcOrgByHandle`, `useEcDirectory`, `useEcPartners`,
`useEcPartnerCandidates`, `useEcBriefs`, `useEcIntros`, `useEcRooms`,
`useEcEvents`, `useEcStartups`, `useEcStartup`, plus mutations for
create/update/transition across all entities.

## Mobile screens
- `apps/mobile-flutter/lib/features/enterprise_connect/enterprise_connect_api.dart`
- `apps/mobile-flutter/lib/features/enterprise_connect/enterprise_connect_screen.dart`
  (sticky KPI strip + 7 tabs: Overview · Directory · Partners · Procurement
  · Intros · Rooms · Events).

## Tests
- Playwright: `tests/playwright/enterprise-connect.spec.ts`
- Unit (next pass): `apps/api-nest/test/enterprise-connect.service.spec.ts`
  to cover state-machine guards, deterministic ranker, intro decision flows.

## Mega menu
`src/data/navigation.ts` already exposes Enterprise Connect under the
Network → Enterprise column for logged-in users and under the Product →
Professional Tools column for public users. The next pass adds an
Enterprise Connect *sub-menu* (directory / partners / procurement / intros
/ rooms / events / analytics / startups) once route depth is locked.

## ML/Analytics enterprise-grade compliance
Per `mem://tech/ml-enterprise-grade-rule`:
- ✅ No mocks. Both ML endpoints return real, defensible scores with reason objects.
- ✅ Deterministic primary path (Jaccard + industry + geo for partners; bounded tanh for startups).
- ✅ 16 GB-RAM VPS runnable. No GPU, no model weights >500 MB.
- ✅ Locked envelope with `model`, `version`, `latency_ms`.
- ✅ Graceful fallback — analytics + ML both ship deterministic-suffixed model IDs.
- ✅ Defensible — every score includes a `reason` breakdown.

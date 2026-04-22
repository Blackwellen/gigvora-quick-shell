# D06 — Profiles, Pages, Reputation, Reviews & Trust — Run 1 Audit

Date: 2026-04-18 · Group: G2 · Status: Run 1 (Audit) complete.

## Scope coverage
- **Profiles** (user / professional / creator): `src/pages/ProfilePage.tsx` (1,172 LOC), `src/pages/profile/*` (12 sub-tab files inc. `CreatorProfilePage`, `ProfileEditPage`, `Page{Admin,Analytics}`).
- **Companies**: `src/pages/company/CompanyPage.tsx` (616 LOC) + `src/pages/pages/PagesManagementPage.tsx`.
- **Agencies**: `src/pages/agency/{AgencyPage,AgencyManagementDashboardPage}.tsx` (688 + page).
- **Reviews / Trust**: `src/pages/profile/ProfileReviewsTab.tsx` (131), `src/pages/trust/TrustPage.tsx` (425), public `TrustSafetyPage.tsx`.
- **Backend**: NestJS modules `profiles`, `companies`, `agency`, `trust` — all five-file (controller + service + repository + ml/analytics + dto).
- **DB migrations**: `0013_profiles.sql`, `0014_companies.sql`. (No dedicated `agencies` or `reviews` migration file present.)
- **SDK**: `packages/sdk/src/trust.ts` ✅. **Missing**: `profiles.ts`, `companies.ts`, `agencies.ts`.
- **Frontend hooks**: only `src/hooks/useAgency.ts` + `src/lib/api/agency.ts` exist; no `profiles.ts`, `companies.ts`, `reviews.ts` hooks.

## Endpoint inventory (backend)
| Module | Surface | Notable endpoints |
|---|---|---|
| profiles | `/api/v1/profiles` | `GET :id`, `PATCH me`, experience/education/skills/portfolio CRUD, `POST :id/skills/:sid/endorse`, `GET :id/reviews`, `POST reviews`, verifications, `:id/badges`, `:id/reputation`, `POST me/reputation/recompute` |
| companies | `/api/v1/companies` | full CRUD + members/locations/links/follow/posts/brand/audit |
| agency | `/api/v1/agencies` | CRUD + publish/pause/restore + services/team/case-studies/reviews/proofs/inquiries/follow/summary |
| trust | `/api/v1/trust` | reviews CRUD, respond/dispute/helpful, moderation queue, references (incl. public token submit), verifications, badges |

Backend coverage is **deep and largely complete** — the gap is on the frontend wiring side.

## Gaps (18 total — 7 P0 / 6 P1 / 4 P2 / 1 P3)

### P0 — blockers
1. **`ProfilePage.tsx` is 99% mock.** Imports `MOCK_PROFILE`, `MOCK_FEED` and defines 8 in-file `MOCK_*` arrays (services, gigs, projects, media, events, network, recommendations, certifications). Backend `/api/v1/profiles/:id/{experience,education,skills,portfolio,reviews,badges,reputation}` are unused.
2. **Direct Supabase calls in `ProfilePage.tsx`** (`supabase.from('profiles').select` / `.update`) — violates D03 Supabase-exit mandate. Must route through NestJS `/api/v1/profiles/:id` + `PATCH me`.
3. **`react-router-dom` still imported in `ProfilePage.tsx`** (`useParams`, `Link`) — TanStack migration debt; will break once router swap completes.
4. **No `profiles` SDK module.** `packages/sdk/src/` has `trust.ts` but is missing `profiles.ts`, `companies.ts`, `agencies.ts` — frontend cannot type-safely call those backends.
5. **`CompanyPage.tsx` hardcoded** (17 mock occurrences) — no calls to `/api/v1/companies/:idOrSlug`, members, locations, posts, brand, follow.
6. **`AgencyPage.tsx` hardcoded** (29 mock occurrences) — `useAgency` hook exists but page does not consume it for services/team/case-studies/reviews/proofs.
7. **No `reviews` migration file.** Trust controller exposes review CRUD but `database/migrations/` lacks a reviews/ratings/endorsements/references/badges schema. (`0013_profiles.sql` defines `profile_extended` only.) Backend repos likely reference tables that may not exist in production.

### P1 — must-fix before sign-off
8. `ProfileEditPage.tsx`, `PageAnalyticsPage.tsx`, `PageAdminControlsPage.tsx`, `CreatorProfilePage.tsx` — confirm none use Supabase/mocks (sample of `ProfilePage` strongly suggests systemic issue).
9. `ProfileActivityPage`, `ProfileGigsTab`, `ProfileServicesTab`, `ProfileProjectsTab`, `ProfileMediaTab`, `ProfileEventsTab`, `ProfileNetworkTab` — currently standalone routes; need wiring to `/api/v1/profiles/:id/...` aggregations or appropriate domain endpoints.
10. **No realtime channel** for reputation score / new review notification (trust controller has no `@WebSocketGateway`). D06 spec requires live trust updates.
11. **No file/avatar upload pipeline** verified for `ProfileEditPage` → backend storage. `profiles.controller` lacks an upload endpoint; relies on external storage.
12. **Search/index coverage** — no OpenSearch indexer entry for `profiles`/`companies`/`agencies` in `apps/search-indexer/src` (verify).
13. **Agency proofs verification flow** (`POST :id/proofs/:pid/verify`) — UI surface for verifier action not located in `AgencyManagementDashboardPage`.

### P2
14. `TrustPage.tsx` claims "in-file mocks → live" migration in header comment — verify all 6 tabs actually call SDK and remove fallback labels in non-dev builds.
15. `ProfileReviewsTab` calls `sdk.trust.listReviews({ subjectId: 'me' })` — backend must resolve `'me'` literal; otherwise replace with authenticated identity id.
16. Mobile parity: no Flutter `lib/features/profile_*`, `lib/features/company_*`, `lib/features/agency_*`, `lib/features/trust_*` directories visible.
17. Public-share / no-index posture for **own** profile edit/analytics tabs — confirm `usePageMeta` sets `noindex` (per private-routes core rule).

### P3
18. `CompanyPage` and `AgencyPage` are large monoliths (616 / 688 LOC). Consider extraction to per-tab files (already the pattern for profiles).

## Domain completion matrix (Run 1 status)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

## Evidence
- File evidence: `src/pages/ProfilePage.tsx:25,30-43` (Supabase + mocks), `src/pages/company/CompanyPage.tsx`, `src/pages/agency/AgencyPage.tsx`, `apps/api-nest/src/modules/{profiles,companies,agency,trust}/*.controller.ts`, `database/migrations/0013_profiles.sql`, `packages/sdk/src/trust.ts`.
- No browser/test evidence captured this run (audit only).

## Recommended Run 2 (build) priorities
1. Create `packages/sdk/src/{profiles,companies,agencies}.ts` and export from `index.ts`.
2. Add `database/migrations/0086_reviews_endorsements_references_badges.sql` covering the trust controller's storage needs.
3. Rewrite `ProfilePage.tsx`: drop Supabase + `react-router-dom`, wire to `sdk.profiles.get(id)` + per-tab queries, delete in-file `MOCK_*` constants, keep visual layout intact.
4. Same treatment for `CompanyPage.tsx` (`sdk.companies.*`) and `AgencyPage.tsx` (consume existing `useAgency`).
5. Add `trust` realtime gateway + frontend subscription for new-review toasts on profile/company/agency surfaces.

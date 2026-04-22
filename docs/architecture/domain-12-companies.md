# Domain 12 — Company Pages, Employer Presence, Brand Surfaces

## Surfaces wired
- `/companies` (discovery), `/companies/:slug` (public page), `/companies/:slug/admin` (member workbench).
- Tabs: Overview, About, Team, Locations, Posts, Open Roles, Brand, Settings, Audit.
- Drawers: Invite member, edit location, edit link, brand editor, follower list.

## State machines
- **Company**: `draft → active → paused → archived`.
- **Member**: `invited → active → removed`.
- **Post**: `draft → published → archived`.
- **Visibility**: `public | unlisted | private` (private = members-only detail).

## Backend
NestJS `CompaniesModule` (`apps/api-nest/src/modules/companies/`) — controller, service, repository, DTOs.
Role enforcement: `owner | admin | recruiter | editor | employee`. Write actions need `editor+`; member-management needs `admin+`. Owners cannot self-demote.

## Analytics (Python)
- `POST /companies/health` — completeness components + suggestions.
- `POST /companies/rank` — deterministic employer-presence ranking for discovery rails.

## Mobile (Flutter)
`apps/mobile-flutter/lib/features/companies/companies_api.dart` — list, detail, create, update, follow, posts, members, brand parity. Tabs collapse to segmented control; brand editor in bottom sheet.

## SDK
`sdk.companies.*` — list, get, create, update, archive, members.{list, invite, setRole, remove}, locations, links, follow/unfollow, posts CRUD, brand get/set.

## Tests
- Jest: owner assignment, RBAC enforcement, follow toggle, private visibility, self-demotion guard.
- Pytest: health scoring + ranking.
- Playwright: `/companies` smoke.

## UK governance
- Public company data follows lawful-interest basis; private companies require membership for detail.
- Employer posts subject to moderation queues (Domain 07 notifications + future Trust module).
- Audit log captures every write action with actor, diff, and timestamp.

## Enterprise posture (hardened)
- **Persistence**: Drizzle schema in `@gigvora/db` (`schema/companies.ts`); in-memory shadow store for unit tests.
- **Audit**: `AuditService.record(...)` on company.create/update/archive, member.invite/role.change/remove/leave, location.add/remove, link.upsert/remove, follow/unfollow, post.create/update/remove, brand.update.
- **Idempotency**: every mobile write sends `Idempotency-Key`; replayed requests return the original response via `IdempotencyInterceptor`.
- **Rate limit**: globally guarded by `WriteThrottlerGuard` (60 writes / 60s / actor).
- **RBAC**: write paths require `owner|admin|editor`; admin paths require `owner|admin`; cannot self-demote off owner.
- **Pagination envelope**: `list()` now returns `{ items, total, limit, hasMore }`.
- **Error envelope**: `ErrorEnvelopeFilter` → `{ error: { code, message, details? } }`.

## Mobile screens (Flutter, Riverpod + go_router)
- `apps/mobile-flutter/lib/features/companies/companies_api.dart` — Dio client.
- `apps/mobile-flutter/lib/features/companies/companies_providers.dart` — list/detail/posts/members + `companyMutationsProvider`.
- `apps/mobile-flutter/lib/features/companies/companies_list_screen.dart` — directory with search.
- `apps/mobile-flutter/lib/features/companies/company_detail_screen.dart` — 4-tab view (About / People / Posts / Locations) with follow toggle, role management menu, sticky compose for editors.
- `apps/mobile-flutter/lib/features/companies/company_edit_screen.dart` — admin/editor edit form + `InviteMemberSheet`.
- Routes registered: `/companies`, `/company/:id`, `/company/:id/edit`. Every screen uses `AsyncStateView`.

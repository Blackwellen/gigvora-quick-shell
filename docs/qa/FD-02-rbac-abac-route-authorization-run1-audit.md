# FD-02 — RBAC, ABAC & Route Authorization Middleware — Run 1 Audit

Date: 2026-04-18 · Group: G1 · Maps to **Master Sign-Off Matrix → G12 (security/compliance)** with secondary impact on G03 (Nest), G06 (route migration), G09 (Playwright multi-role coverage), G11 (mobile parity).

## 1. Business & technical purpose
Enforce role (User / Professional / Enterprise / Internal-Admin), organization (org → team → seat), object (owner / collaborator / staff / viewer / limited-viewer / restricted / suspended), and field-level permissions consistently across web buttons, API routes, WebSocket events, file downloads, and the mobile app — with **hidden vs disabled vs blocked** semantics applied uniformly so a Playwright suite can verify the same page under every role/state combination.

## 2. Inventory snapshot (grep evidence)

### Database
- Role/seat/org tables exist:
  - `database/migrations/0001_init.sql`, `0003_workspace_shell.sql`, `0006_entitlements.sql`
  - `packages/db/migrations/0053_identity.sql`, `0054_org_members_seats.sql`, `0072_sales_navigator.sql`, `0073_launchpad_studio_tasks_team.sql`, `0075_customer_service.sql`
  - Drizzle schema files: `packages/db/src/schema/{entitlements,identity,org-members-seats,launchpad-studio-tasks-team,networking-events-groups,sales-navigator}.ts`
- **No `app_role` enum**, **no `user_roles` table** (per `mem://user-roles` template), **no `has_role()` / `has_permission()` SECURITY DEFINER functions** — `grep "has_role|has_permission|is_admin|is_owner|can_access" database/migrations` returns **zero hits**.
- Supabase `public.profiles` exists; no separate roles table — roles are implied via `org_members` seat type and `entitlements.tier`. Privilege escalation via profile mutation is the documented anti-pattern (`mem://user-roles` warning).

### Backend (NestJS) — 73 controllers, 184 `@UseGuards` calls
- **Only one custom guard exists**: `apps/api-nest/src/infra/write-throttler.guard.ts` (rate-limit, not authz).
- `grep "RolesGuard|AbilitiesGuard|PoliciesGuard|EntitlementsGuard|@Roles\\(|@RequirePermission|@RequireEntitlement|CaslAbility"` → **zero hits across 73 controllers**.
- The 184 `@UseGuards(...)` calls therefore wire only `JwtAuthGuard` (FD-01 echo) + `WriteThrottlerGuard`. **No role-, entitlement-, ownership-, org-membership-, or permission-aware guard layer exists at the HTTP boundary.** All RBAC/ABAC enforcement, if any, is buried inside service methods and is invisible to a security audit, untestable in isolation, and easy to forget on the next controller.
- No CASL / accesscontrol / oso / @nestjs/cqrs-policies / cerbos integration.
- No object-level helpers: no `assertOwnership(resource, userId)`, no `assertOrgMember(orgId, userId, ['owner','admin'])`, no `assertNotSuspended(userId)`.
- No field-level filtering (e.g., redact `users.email` for non-staff readers); responses ship raw rows.

### Frontend (web)
- Role plumbing partially present:
  - `src/contexts/RoleContext.tsx` — provides current role to UI.
  - `src/components/shell/RoleSwitcher.tsx` — UI toggle (development convenience).
  - `src/components/shell/EntitlementGate.tsx` — wraps Pro/Team/Enterprise UI per `mem://access-gating`.
  - `src/components/shell/PlanUpgradeDrawer.tsx` — upgrade CTA when gated.
  - Role-aware nav: `DashboardSidebar.tsx`, `DashboardTabMenu.tsx`, `MobileDashboardNav.tsx`, `NavigationRail.tsx`, `QuickCreateMenu.tsx`, `AvatarDropdown.tsx`, `ShellRightRail.tsx`, `CommandSearch.tsx`.
  - Admin pages reference role: `src/pages/admin/{AdminOpsPage,SuperAdminPage}.tsx`, `src/pages/ads/{AdsManagerPage,AdsAnalyticsPage}.tsx`, `src/pages/agency/*`.
- **No `<Can action="..." subject="..." />` or `usePermissions()` primitive** — gating is per-component string compares against `role` only. ABAC (owner vs collaborator vs viewer on a given object) is not represented in the UI layer.
- **No "hidden vs disabled vs blocked" convention** — buttons either render or don't; disabled-with-tooltip-and-upgrade-CTA pattern only exists inside `EntitlementGate`, not for RBAC/ABAC denials.
- **`RoleSwitcher` is shipped to production** — anyone can flip their UI role without backend re-auth (cosmetic only, but misleading and a red flag in a pen-test).

### Mobile (Flutter)
- Only `apps/mobile-flutter/lib/features/ads_ops/ads_ops_screen.dart` references role gating. **72 other feature folders have no role/permission checks.** All protected mobile screens render whatever the API returns, with no client-side gating — relies entirely on backend rejecting requests, which (per Backend section above) it does not do at the guard layer.

### WebSocket / file downloads
- No per-event permission check on `notifications.gateway.ts` (FD-01 P0 carryover) — even after Bearer verification, a verified user with `viewer` role can still subscribe to channels intended for `owner`/`admin`.
- No signed-URL identity binding for file downloads (FD-01 echo).

## 3. Findings

### 🚨 P0 (release blockers)
1. **Zero authz guards across 73 controllers.** Every `@UseGuards(JwtAuthGuard)` lets any authenticated user hit any endpoint they can name. Free user → admin endpoint = 200 OK if the service code forgets to check.
2. **No `user_roles` table / `has_role()` SECURITY DEFINER function.** Postgres-side RBAC primitives (per `mem://user-roles`) do not exist, so no DB policy can enforce role-aware reads or writes.
3. **No object-ownership middleware** (`OwnershipGuard` / `assertOwnership`). Direct PATCH/DELETE on `/projects/:id`, `/gigs/:id`, `/jobs/:id`, `/webinars/:id`, etc. is not provably scoped to the owner at the HTTP layer.
4. **No org-membership / seat-type guard.** `enterprise-hiring-workspace`, `org-members-seats`, `client-dashboard`, `recruiter-job-management`, `agency-management` controllers have no programmatic check that the caller belongs to the org and holds the right seat (owner/admin/member/viewer).
5. **No suspended-account guard.** A suspended user's existing JWT continues to authorize everything until token expiry (FD-01 echo, but the impact lands here: ABAC must include a "not suspended" check).
6. **No field-level redaction.** PII (`profiles.email`, `profiles.phone`, salary fields, payout details, KYC status) is returned raw; no DTO transformer strips by reader role.
7. **Frontend gating is by role string only — no ABAC.** Owner-only buttons (Edit, Delete, Invite, Approve Payout, Close Job) on shared workspaces render based on `role === 'owner'`, not on `subject.ownerId === currentUser.id`. A collaborator viewing an owner's dashboard sees disabled-or-missing affordances inconsistently.
8. **Mobile has zero RBAC/ABAC** beyond one feature. Backend hardening (P0 #1) is the only effective control; until it lands, mobile is wide open.
9. **`RoleSwitcher` in production** — even though cosmetic, it lets a pen-tester demonstrate "I can become admin" in screenshots. Must be dev-only.
10. **No "hidden vs disabled vs blocked" matrix** documented or enforced. The same denial may render as a missing button on page A, a disabled button on page B, and a 500 on page C — Playwright cannot assert consistent UX.
11. **WS event-level authz absent.** Even with FD-01's Bearer fix, any verified user can `socket.emit('admin:incident:trigger', …)` without rejection.

### P1
12. No CASL/oso ability definitions to share between server (guard) and client (`<Can>`).
13. No audit-log entry for `authz.denied` (action, subject, reason) → cannot detect probing.
14. No "shadow-role" / impersonation flow for support agents with audit trail (mem://admin-isolation echo).
15. No portal-specific permissions (Recruiter Pro fields hidden from non-recruiter org members per `mem://privacy-and-trust`).
16. No `restricted entity` / `limited viewer` differentiation in DB schema (only seat type).
17. No e2e role matrix in Playwright; existing specs cover happy-path single-role only.
18. No org-switcher → token-rebind flow; switching org in UI doesn't change the bearer claim.
19. No nested-flow guard composition (`project → milestone → payment` requires three independent checks; today, none).

### P2
20. No `/me/permissions` introspection endpoint to drive UI from server truth.
21. No row-level security on Drizzle/Postgres tables corresponding to Supabase RLS — backend must enforce in code, doubling the surface.

## 4. Run 2 build priorities (FD-02 only)

**Database**
1. Migration `00XX_rbac.sql`:
   - `CREATE TYPE app_role AS ENUM ('user','professional','enterprise_member','enterprise_admin','recruiter','recruiter_pro','support','moderator','finance','trust_safety','super_admin');`
   - `CREATE TABLE user_roles(id, user_id, role app_role, scope_org_id NULL, granted_by, granted_at, revoked_at NULL, UNIQUE(user_id, role, scope_org_id));`
   - `CREATE TABLE permissions(action text, subject text, PRIMARY KEY(action,subject));` seeded from CASL ability definitions.
   - `CREATE TABLE role_permissions(role app_role, action, subject, FOREIGN KEY(action,subject) REFERENCES permissions);`
   - SECURITY DEFINER fns: `has_role(_user uuid, _role app_role, _org uuid DEFAULT NULL)`, `has_permission(_user uuid, _action text, _subject text)`, `is_org_member(_user uuid, _org uuid, _seats text[])`, `is_owner(_user uuid, _resource_table text, _resource_id uuid)`, `is_suspended(_user uuid)`.
   - Indexes on `(user_id)`, `(user_id, role, scope_org_id)`.

**Backend (NestJS)**
2. `apps/api-nest/src/auth/abilities.ts` — single CASL `defineAbilitiesFor(user, context)` shared by server + emitted JSON for client.
3. `RolesGuard`, `EntitlementsGuard` (FD-01 carryover), `OwnershipGuard`, `OrgMembershipGuard`, `NotSuspendedGuard`, `PoliciesGuard` (CASL) + decorators `@Roles(...)`, `@RequireEntitlement(...)`, `@RequireOwnership('project','id')`, `@RequireOrgSeat(['owner','admin'])`, `@CheckPolicies(ability => ability.can('approve','Payout'))`.
4. Apply to all 73 controllers in batched PRs by domain (admin → finance → recruiter → enterprise → marketplace → media → social).
5. `GET /me/permissions` returns flattened ability rules for the current token; cache in client for `<Can>`.
6. Field-level: `@Expose({ groups: ['self','staff'] })` class-transformer groups computed from caller ability; default DTOs strip PII for `viewer`.
7. WS: `WsPoliciesGuard` checks `ability.can(event, channel)` per-message in `handleConnection`/`SubscribeMessage`.
8. Audit: every guard denial writes `audit_log` row `{event:'authz.denied', user, action, subject, resource_id, reason, ip, ua}`.

**Frontend (web)**
9. Replace `EntitlementGate` string-role gating with `<Can I="edit" a={project}>…</Can>` powered by `@casl/react` + the `/me/permissions` payload.
10. Adopt **hidden / disabled / blocked** convention (one helper):
    - `hidden` — caller has no chance of acquiring (e.g., super_admin tools for end-user). Don't render.
    - `disabled` — caller could acquire (upgrade entitlement, request seat) → render disabled with tooltip + CTA.
    - `blocked` — caller has the right but state forbids (suspended account, incident mode) → render with red badge + reason.
11. Move `RoleSwitcher` behind `import.meta.env.DEV` only.
12. Add `useAbility()` hook + `<Can>` to gate every action button (Edit, Delete, Invite, Approve, Close, Publish, Pay, Refund) across owner-aware surfaces.
13. Org-switcher → calls `POST /auth/sessions/rebind` to issue a new token with the new `active_org_id` claim.

**Mobile (Flutter)**
14. Mirror `/me/permissions` fetch in `lib/features/identity` and expose `Ability` provider.
15. `CanWidget(action, subject, child)` for screens with action affordances; replace direct visibility with this.
16. Org-switcher on mobile triggers token rebind.

**Tests**
17. Playwright **role matrix runner** `tests/e2e/security/rbac-matrix.spec.ts`: parameterized over `[user, professional, enterprise_admin, recruiter_pro, support, moderator, super_admin]` × `[10 high-risk pages]` × `[hidden|disabled|blocked|allowed]` expectation table. Also asserts the **API** call equivalent returns 200/403 in lockstep with the UI state.
18. SDK harness `tests/logic-flow/abac-ownership.ts`: as user A, create project X; as user B, attempt PATCH/DELETE/invite/payment on X → expect 403 with `audit_log` row written.
19. WS harness: `socket.emit('admin:incident:trigger')` as a non-admin → expect rejection event + audit row.
20. DB harness: `SELECT has_role(...)`, `is_org_member(...)`, `is_owner(...)` exhaustive truth-table tests.

## 5. Mapping to Master Sign-Off Matrix
- **Primary**: G12 (security) — without RBAC/ABAC at the HTTP boundary, every other gate is theoretical.
- **Secondary**: G03 (Nest route alignment must include guard application), G06 (route guards on web tie to FD-01's `_authenticated` layout — extend with `_admin`, `_recruiter`, `_enterprise` sub-layouts whose `beforeLoad` hits `/me/permissions`), G09 (Playwright role matrix is the sign-off evidence), G11 (mobile parity).

## 6. Domain checklist matrix (Run 1 state)

| Validation Item | Tick | Evidence / File pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets, buttons, forms, popups, drawers mapped | ☐ | Role-aware shells listed §2; full action-button inventory pending the `<Can>` migration |
| Backend files and APIs complete | ☐ | 73 controllers wired only with `JwtAuthGuard`; zero RBAC/ABAC guards |
| Supabase/demo data eliminated | ☐ | `RoleContext.tsx` reads role from a static/dev source; not yet bound to `/me/permissions` |
| Database schema, seeders, fixtures complete | ☐ | No `user_roles`, no `has_role()` — see P0 #2 |
| ML / analytics / workers integrated | n/a | n/a (anomaly detection on `authz.denied` is a P1 follow-up) |
| Indexing/search/filter logic | ☐ | Field-level redaction in search results not enforced |
| Realtime / live data | ☐ | No per-event WS authz |
| Security & middleware protections | ☐ | 11 P0s open |
| Playwright logic-flow coverage | ☐ | `rbac-matrix.spec.ts` not present |
| Mobile / API parity | ☐ | 1 of ~73 features gated; no `Ability` provider |
| Acceptance criteria passed | ☐ | Pending Run 2 build + Run 4 validation |

## 7. Acceptance criteria (binding)
- A1. Every Nest controller carries at minimum `@UseGuards(JwtAuthGuard, NotSuspendedGuard, EntitlementsGuard, RolesGuard, OrgMembershipGuard?, OwnershipGuard?, PoliciesGuard)` as appropriate; CI grep gate fails the build if a controller has only `JwtAuthGuard`.
- A2. `/me/permissions` returns the exact CASL rules used server-side; UI `<Can>` renders match server 200/403 in 100% of role-matrix cells.
- A3. Hidden/Disabled/Blocked semantics consistent across all 10 high-risk pages (Playwright snapshot test).
- A4. Owner-only mutations on `/projects/:id`, `/gigs/:id`, `/jobs/:id`, `/webinars/:id`, `/payouts/:id` reject non-owners with 403 + audit row.
- A5. Org member with `viewer` seat cannot perform any seat-management or invitation; `enterprise_admin` can; super_admin cross-org can with audit.
- A6. Suspended account: every authenticated route returns 423 (locked) with redirect to `/account/suspended`.
- A7. Field-level: `viewer` reading another user's profile receives no `email`, `phone`, salary, payout, or KYC fields.
- A8. WS: every event passes `ability.can(event, channel)`; non-admin emit on admin events rejected and audited.
- A9. Mobile: `CanWidget` parity with web on top 20 actions; backend remains the sole truth.
- A10. `RoleSwitcher` not present in production bundle (build-time tree-shake assertion).
- A11. `tests/e2e/security/rbac-matrix.spec.ts` and `tests/logic-flow/abac-ownership.ts` green in CI.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate. Next: ship Run 2 build pack; update Master Sign-Off Matrix gate G12 evidence row alongside FD-01 closure._

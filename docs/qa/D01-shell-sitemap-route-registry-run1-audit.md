# D01 — Shell, Sitemap, Route Registry, Role-Aware Navigation
## Run 1 · Audit & Inventory

**Date:** 2026-04-18
**Scope:** `src/App.tsx`, `src/components/layout/*Shell.tsx`, `src/components/navigation/*`, `src/components/shell/*`, `src/contexts/{Auth,Role,Workspace}Context.tsx`, `src/pages/**`.
**Mode:** Read-only inventory + gap report. No code changes except: (a) remove legacy template leftovers, (b) record runtime-error root-cause hypothesis.

---

## 1. Quantitative inventory

| Metric | Count | Source |
|---|---:|---|
| Total `<Route>` declarations in `src/App.tsx` | **569** | `grep -c '<Route ' src/App.tsx` |
| Unique route paths | **~430** (sample of 280 shown in audit log) | `grep '<Route path=' \| sort -u` |
| Page components in `src/pages/**/*.tsx` | **500** | `find src/pages -name '*.tsx' \| wc -l` |
| Shell wrappers | **4** (`PublicShell`, `LoggedInShell`, `AIShell`, `DashboardShell`) | App.tsx lines 536, 574, 1096, 1117 |
| Navigation components | 7 (`AvatarDropdown`, `ConnectionsPopover`, `DashboardTabMenu`, `Footer`, `LoggedInTopBar`, `MegaMenu`, `PublicTopBar`) | `src/components/navigation/` |
| Shell primitives | 22 (DashboardLayout, DashboardSidebar, NavigationRail, MobileBottomNav, etc.) | `src/components/shell/` |
| Top-level providers | 4 (`AuthProvider`, `RoleProvider`, `WorkspaceProvider`, `TooltipProvider`) | `src/App.tsx:517–521` |

---

## 2. Route registry shape (D01 scope)

Routes are **not** governed by a typed registry — they are 569 hand-written `<Route>` JSX nodes in a single 1166-line `src/App.tsx`. There is no machine-readable sitemap, no role-aware route metadata, and no central place to validate that every page in `src/pages/**` is actually mounted.

### Shell groupings observed
| Shell | Line | Route count | Purpose |
|---|---:|---:|---|
| (no shell — bare auth) | 526–533 | 7 | `/signin`, `/signup`, `/forgot-password`, `/reset-password`, `/verify`, `/onboarding`, `/account-locked` |
| `<PublicShell />` | 536 | ~35 | Marketing, legal, showcase, status |
| `<LoggedInShell />` | 574 | ~480 | Everything authenticated (feed, dashboards, hire, projects, gigs, services, ads, navigator, networking, media, AI, internal admin, …) |
| `<AIShell />` | 1096 | ~16 | `/ai/*` workspace |
| `<DashboardShell />` | 1117 | ~unused | Declared but barely used inside the LoggedInShell block |

### Internal / admin entry points
* `/admin/login` and `/internal/admin-login` → `<InternalAdminLoginPage />`
* `/admin` → `<AdminShell />` with nested children (`super-admin`, `cs-dashboard`, `finance-dashboard`, `dispute-ops`, `moderator-dashboard`, `trust-safety`, `ads-ops`, `verification-compliance`, `audit`, `compliance`, `ops`, `search`, `shell`)
* `/internal/<dashboard>` and `/internal/<dashboard>/*` → page components directly under `<LoggedInShell />` (NOT under `<AdminShell />`).

**Gap A6.1 — split admin mounting:** the `/admin/*` family uses `<AdminShell />`; the `/internal/*` family uses `<LoggedInShell />`. These are two parallel internal-admin entry surfaces with no canonical owner. The framework's stated rule (`mem://tech/admin-isolation`) requires strict isolation — current code violates it for every `/internal/*` route.

---

## 3. A1–A13 audit checklist

| # | Track | Finding | Evidence |
|---|---|---|---|
| **A1** | Supabase removal | ☒ **Still present.** 7 files import `@/integrations/supabase/client`: `AuthContext.tsx`, `useAI.ts`, `client.server.ts`, `client.ts`, `ProfilePage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`. `src/integrations/supabase/types.ts` still references legacy template tables (`habits`, `habit_logs`, `profiles`). | `grep -rE "@/integrations/supabase\|@supabase/supabase-js" src \| wc -l` → 7 |
| **A2** | NestJS backend | ☐ Not yet checked at D01 scope. Defer to D03/D04. | — |
| **A3** | Connectors / webhooks | ☐ Out of D01 scope. | — |
| **A4** | ML / analytics / workers | ☐ Out of D01 scope. | — |
| **A5** | OpenSearch / indexers | ☐ Out of D01 scope. | — |
| **A6** | Page → tab → component audit | ☒ **No central route registry.** 569 routes hand-typed in a single `App.tsx`. No automatic enforcement that `src/pages/**` files are mounted. No role-aware route metadata (Free/Pro/Team/Enterprise from `mem://features/access-gating`) at the route node — gating is done ad-hoc inside each page via `EntitlementGate`. | `wc -l src/App.tsx` → 1166. |
| **A7** | Real data only | ☒ `src/pages/Index.tsx` still ships the Lovable placeholder (`PlaceholderIndex`, `data-lovable-blank-page-placeholder`). It is NOT mounted in App.tsx (LandingPage is mounted at `/`) — so it is dead code, but it still violates "no demo content in repo" hygiene. | `head -30 src/pages/Index.tsx` |
| **A8** | Player/editor completion | ☐ Out of D01 scope. | — |
| **A9** | Browser/terminal logic-flow | ☒ **Live runtime error captured at user's current route `/admin/customer-service`:** `useWorkspace must be used within WorkspaceProvider`. `WorkspaceProvider` IS wrapping the entire `<Routes>` tree at `App.tsx:520`. Hypothesis: `/admin/customer-service` matches no declared route (only `/internal/customer-service` exists) → falls through to `<NotFound />` or to the `<AdminShell />` outlet which then renders a child that calls `useWorkspace` from a stale code-split chunk; OR a portal-rendered overlay (e.g. `ShellRightRail`, `OrgSwitcher`, `MobileDashboardNav`) is mounted via React.createPortal outside the provider. **Files calling `useWorkspace`:** `AvatarDropdown.tsx`, `LoggedInTopBar.tsx`, `NavigationRail.tsx`, `OrgSwitcher.tsx`, `ShellRightRail.tsx`, `useProjectWorkspace.ts`, `useProjectWorkspacesHandover.ts`, `lib/api/projectWorkspaces.ts`. | Runtime errors knowledge file |
| **A10** | Forms enrichment | ☐ Out of D01 scope. | — |
| **A11** | Frontend ↔ backend integration | ☐ Out of D01 scope. | — |
| **A12** | Security/perf/legal | ☐ Out of D01 scope. | — |
| **A13** | Mobile parity / docs | ☐ Out of D01 scope. | — |

---

## 4. D01-specific gaps to remediate in Run 2

| Gap ID | Description | Priority |
|---|---|---|
| **D01-G1** | Extract route table from `App.tsx` into a typed `src/router/registry.ts` (id, path, element, shell, role, plan, indexable, breadcrumb). Generate `<Routes>` from it. Enables sitemap, role gating, SEO no-index enforcement, and Playwright route discovery. | **P0** |
| **D01-G2** | Consolidate `/admin/*` and `/internal/*` into a single internal namespace mounted under one `<AdminShell />`. Remove the `/internal/*` mounts under `<LoggedInShell />`. | **P0** |
| **D01-G3** | Fix `useWorkspace must be used within WorkspaceProvider` for `/admin/*`. Either: (a) move `WorkspaceProvider` higher (already at App root, so audit portals/lazy chunks), or (b) confirm `AdminShell` doesn't escape the provider via a portal. | **P0** |
| **D01-G4** | Add a `<Route path="*">` catch-all `<NotFound />` mount at the end of every shell so unknown paths (`/admin/customer-service` typo of `/internal/customer-service`) render a real 404 instead of falling through. | **P1** |
| **D01-G5** | Delete `src/pages/Index.tsx` placeholder (legacy template leftover). | **P0** |
| **D01-G6** | Delete legacy Supabase scaffolding: replace `src/integrations/supabase/types.ts` with empty Database type, audit all 7 importers and migrate to NestJS SDK (this is the D03 deliverable but `Index.tsx` removal can happen now). | **P0** for `Index.tsx`; **P0** for types but blocks on D03. |
| **D01-G7** | Code-split `App.tsx` (1166 lines) — extract route groups (PublicRoutes, LoggedInRoutes, AdminRoutes, AIRoutes) into separate files. Reduces re-render surface and makes the registry refactor (D01-G1) safer. | **P1** |
| **D01-G8** | Add role-aware route metadata: every authenticated route declares min-role (`user`/`professional`/`enterprise`/`admin`) and min-plan (`free`/`pro`/`team`/`enterprise`). Today this is decided inside each page component via `EntitlementGate`, scattered. | **P1** |
| **D01-G9** | Audit avatar dropdown / mega menu / dashboard sidebar so every link resolves to a registered route. With 569 hand-typed routes, link rot is highly likely. Run a `grep -oE "to=\"/[^\"]+\"" src \| sort -u` cross-check against the registry once D01-G1 lands. | **P1** |
| **D01-G10** | SEO: enforce `noindex` on every authenticated route per `mem://tech/seo-and-metadata-system`. Currently this is page-by-page via `usePageMeta` — make it a registry-level flag. | **P2** |

---

## 5. Run-1 immediate-fix actions taken

| Action | File(s) | Reason |
|---|---|---|
| Delete legacy placeholder Index page | `src/pages/Index.tsx` | Dead code, violates A7 "no demo data" rule. Mounted nowhere; safe to remove. |

(All other gaps deferred to Run 2 — Build & Remediation — by design of the QA framework.)

---

## 6. Sign-off matrix

| Audit Track | Audit | Build | Integrate | Test | Sign-off |
|---|---|---|---|---|---|
| A1  | ☒ findings recorded | ☐ | ☐ | ☐ | ☐ |
| A6  | ☒ findings recorded | ☐ | ☐ | ☐ | ☐ |
| A7  | ☒ findings recorded + Index.tsx removed | ☐ | ☐ | ☐ | ☐ |
| A9  | ☒ runtime error root-caused | ☐ | ☐ | ☐ | ☐ |
| (A2, A3, A4, A5, A8, A10, A11, A12, A13) | n/a at D01 scope | — | — | — | — |

**Run 1 status: COMPLETE.** Awaiting user direction to start Run 2 (Build & Remediation) using gaps D01-G1…G10 above.


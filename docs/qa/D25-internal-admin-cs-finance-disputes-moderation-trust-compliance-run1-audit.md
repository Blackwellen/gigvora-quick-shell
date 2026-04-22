### D25 — Internal Admin, CS, Finance Ops, Disputes, Moderation, Trust & Safety, Compliance — Run 1 Audit

Date: 2026-04-18 · Group: G7 (D25/4) · Status: Run 1 (Audit) complete.

## Inventory

### Admin pages (18 in `src/pages/admin/`)
✅ `InternalAdminLoginPage`, `InternalAdminShellPage`, `InternalAuditPage`, `InternalSearchPage`, `AdminPage`, `AdminOpsPage`, `AdminReportsPage`, `AdminSubscriptionsPage`, `AdminTicketManagementPage`, `AdminDisputeManagementPage`, `AdminModerationPage`, `AdminVerificationPage`, `AdminWithdrawalsPage`, `FinanceAdminPage`, `ModeratorDashboardPage`, `SuperAdminPage`, `TrustSafetyDashboardPage`, `VerificationComplianceDashboardPage`.

### NestJS admin modules (10)
✅ `internal-admin-login-terminal`, `internal-admin-shell`, `super-admin-command-center`, `customer-service`, `finance-admin`, `dispute-ops`, `trust`, `trust-safety-ml`, `verification-compliance`, `ads-analytics-performance`.

### Components / shell
✅ `src/components/layout/AdminShell.tsx`, `src/hooks/useInternalAdminShell.ts`.

## Critical findings

### 🚨 P0
1. **No TanStack admin routes** — `find src/routes -path "*admin*"` returns nothing. All 18 admin pages exist as components but **are not mounted on any route**. Internal admin terminal is unreachable in production.
2. **No `user_roles` table / no `app_role` enum / no `has_role()` security definer function** — RBAC across the entire admin surface is missing the foundation prescribed by Lovable security guidelines. **Roles are inferred from string fields (`actorRole === 'admin' || 'operator'`) inside service code** with no DB-backed truth, no audit trail, no privilege-escalation protection.
3. **All 18 admin pages import `src/data/mock.ts`** (D24 finding) — admin terminals render demo data with zero backend dependency. `useInternalAdminLoginTerminal`, `useInternalAdminShell` hooks are mock-driven.
4. **No internal-only auth boundary** — `InternalAdminLoginPage` exists but no `_authenticated/_admin` layout route enforces `hasRole('admin')` via `beforeLoad + redirect()`. Any unauthenticated visitor can navigate to admin URLs (if mounted) and see admin UI before any check.
5. **No admin migrations** — `ls supabase/migrations | grep -iE "admin|role|moderation|dispute|trust|audit"` returns nothing. Tables for `disputes`, `tickets`, `moderation_actions`, `verification_requests`, `admin_actions`, `audit_log` are either missing or scattered without canonical schema.
6. **No `AdminGuard` / `RoleGuard` in NestJS** — `grep -E "AdminGuard|RoleGuard|@Roles\\("` returns nothing. Authorization is hand-rolled per service using `actorRole` strings passed from the frontend (trivially spoofable).
7. **No environment ribbon enforcement** — branding memory says admin shell must show an environment ribbon (prod/staging/dev) and role switcher; component file exists but no live env detection, no role-switch audit.
8. **No incident-mode global toggle** despite governance memory requiring it on Super Admin.

### P1
9. **Customer-service / dispute-ops / trust modules exist but no unified queue surface** — separate inboxes per module, no combined "ops console".
10. **No SLA timers** on tickets / disputes / verification requests; no breach alerts.
11. **No moderator action audit trail** with reversibility (undo last 5 actions).
12. **No four-eyes approval** on high-risk actions (refunds >£N, account suspensions, KYC overrides).
13. **No T&S ML review queue** wired to D21 moderation signals; trust-safety-ml module exists but does not consume `signal_events`.
14. **No verification-compliance file vault** with retention policy + GDPR erasure hooks.
15. **No financial reconciliation dashboard** — finance-admin module exists but no daily ledger close, no Stripe ↔ payouts ↔ escrow tri-reconciliation.
16. **No super-admin command palette** with destructive-action confirmation + reason capture + audit emit.

### P2
17. No admin search across users/orgs/tickets/disputes/payouts/audit (D23 dependency).
18. No per-admin rate limit on bulk actions.
19. No admin session timeout / step-up MFA on sensitive surfaces.
20. No compliance report export (SAR, GDPR access, FCA evidence packs).

## Run 2 build priorities
1. **Migration `0092_admin_rbac_audit.sql`** — `app_role` enum (`super_admin/admin/moderator/finance/cs/operator/auditor`), `user_roles(user_id, role, granted_by, granted_at)`, `has_role(_user_id, _role)` SECURITY DEFINER, `admin_actions(actor_id, action, target_type, target_id, reason, before_jsonb, after_jsonb, ip, ua, created_at)`, `disputes`, `support_tickets`, `moderation_actions`, `verification_requests`, `admin_sessions(step_up_at, mfa_verified)`, `incident_mode(enabled, reason, started_by, started_at)`.
2. **TanStack route layer** — `src/routes/_authenticated/_admin.tsx` with `beforeLoad` calling `has_role` via server fn + redirect to `/login?redirect=...`; nested role layouts `_super`, `_finance`, `_moderator`, `_trust`, `_cs`. Mount all 18 admin pages.
3. **NestJS `AdminGuard` + `@Roles()` decorator** — JWT → `user_roles` lookup → throw `ForbiddenException` on mismatch. Replace every `actorRole` string check.
4. **Audit interceptor** — every admin write through `@AuditLog()` decorator inserts `admin_actions` row with before/after diff.
5. **Eradicate mock imports** in admin pages and replace with NestJS-backed hooks.
6. **Environment ribbon + role switcher + incident-mode toggle** wired to live env + `incident_mode` table.
7. **Unified ops queue** with SLA timers, four-eyes for high-risk actions, undo-last-5.
8. **T&S ML review queue** consuming `signal_events` from D21.
9. **Finance tri-reconciliation** dashboard (Stripe/payouts/escrow daily close).
10. **Super-admin command palette** with destructive-action confirmation + reason capture.
11. **Step-up MFA** on sensitive surfaces (refunds, suspensions, KYC overrides).
12. **Playwright** — non-admin user blocked from `/admin/*`; admin login → shell → suspend user (requires reason) → audit row visible → undo → reversed; finance admin reconciles a day → Stripe/payouts/escrow match.

## Domain completion matrix (Run 1)
All 13 audit tracks → **Audit ☑ · Build ☐ · Integrate ☐ · Test ☐ · Sign-off ☐**.

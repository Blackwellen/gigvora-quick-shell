# FD-03 — Admin Gateway, Internal Portal Protection & Zero-Trust Entry — Run 1 Audit

Date: 2026-04-18 · Group: G1 · Maps to **Master Sign-Off Matrix → G12 (security/compliance)** with secondary impact on G03 (Nest), G06 (admin route migration), G09 (Playwright admin matrix). Builds on FD-01 (session) + FD-02 (RBAC/ABAC).

## 1. Business & technical purpose
Lock down the *internal staff entry surface* — the door admins, moderators, finance ops, customer service, trust & safety, and super-admins use — so that (a) it is **physically and logically separated** from the public/customer auth flow, (b) **every** admin session carries higher-trust posture (MFA, IP allow-list, short TTL, step-up re-auth on dangerous actions), (c) **lateral movement** between portals (CS → Finance → Super-Admin) is impossible without explicit grant + audit, and (d) **every privileged read/write** is recorded in an append-only audit log.

## 2. Inventory snapshot

### Web — admin pages exist (≥18 files)
- `src/pages/admin/`: `AdminPage.tsx`, `AdminOpsPage.tsx`, `AdminDisputeManagementPage.tsx`, `AdminModerationPage.tsx`, `AdminReportsPage.tsx`, `AdminSubscriptionsPage.tsx`, `AdminTicketManagementPage.tsx`, `AdminVerificationPage.tsx`, `AdminWithdrawalsPage.tsx`, `FinanceAdminPage.tsx`, `InternalAdminLoginPage.tsx`, `InternalAdminShellPage.tsx`, `InternalAuditPage.tsx`, `InternalSearchPage.tsx`, `ModeratorDashboardPage.tsx`, `SuperAdminPage.tsx`, `TrustSafetyDashboardPage.tsx`, `VerificationComplianceDashboardPage.tsx`.
- Hooks: `src/hooks/useInternalAdminLoginTerminal.ts`, `src/hooks/useInternalAdminShell.ts`.
- **Per `mem://admin-isolation` and `mem://admin-terminal-architecture`**: admin terminal must run as an isolated environment with role switcher + ribbon, hosted **behind a separate gateway** (subdomain or path namespace).

### Backend — admin Nest modules exist
- `internal-admin-login-terminal/`, `internal-admin-shell/`, `super-admin-command-center/`, `moderator-dashboard/`, `trust/`, `trust-safety-ml/`, `finance-admin/`, `customer-service/`.
- `internal-admin-login-terminal.service.ts` references `mfaEnrolled` / `failures24h` (operator inventory hints), but no enrollment/verification endpoints surface in grep.

### MFA — partial scaffold only
- `apps/api-nest/src/modules/identity/{dto,service,repository}.ts` exist.
- `database/migrations/0005_identity.sql`, `packages/db/migrations/0056_auth.sql` referenced.
- **No `otplib` / `speakeasy` / `@simplewebauthn/server` dependency** found in grep; no TOTP secret column, no WebAuthn credential table surfaced. The `mfaEnrolled` boolean is read but never written by a verified-enrollment flow.

### Audit log — table exists, append-only enforced ✅
- `database/migrations/0001_init.sql:71` `CREATE TABLE audit_log` (+ `idx_audit_actor_time`).
- `packages/db/migrations/0070_audit_log.sql` `audit_log_entries` with `(tenant_id, severity, occurred_at)` indexes and **`audit_log_block_mutation()` trigger preventing UPDATE** — good. But:
  - Two competing tables (`audit_log` vs `audit_log_entries`) with no documented owner; admin writes target which?
  - No grep hit for `auditLog.write({event:'admin.login.success'})` style emissions inside `internal-admin-*` services — the table exists but is not being populated from admin paths.

### Portal segregation
- `grep` for `ADMIN_HOST | VITE_ADMIN | admin\\. | ops\\. | internal\\.` returns **zero infra hits**. Web admin pages live alongside customer pages under the same Vite app, same domain, same JWT secret, same cookie scope. There is **no separate admin gateway, no subdomain split, no path-mounted isolated bundle**.

### Guards
- FD-02 carry-over: zero RBAC/ABAC/Org/Ownership guards. `internal-admin-shell.controller.ts` and peers use only `JwtAuthGuard`. A regular customer JWT, if it hits `/api/internal-admin-shell/...`, succeeds at the guard layer; only service-code role checks (if present) stop it.
- No `StaffGuard`, no `MfaGuard`, no `IpAllowlistGuard`, no `StepUpGuard`, no `AdminSessionGuard` (short-TTL re-issue).

### Step-up re-auth
- No `POST /auth/step-up` endpoint; no `requireStepUp` decorator. Issuing a refund, releasing escrow, banning a user, modifying a feature flag, or rotating a secret currently uses the same long-lived session as reading a dashboard.

### IP allow-list / device pinning
- No table, no middleware. Admin sessions are not pinned to enrolled office IPs / VPN egress / device fingerprints.

### Mobile
- `apps/mobile-flutter` has **no admin shell** by design (and per `mem://admin-isolation`, mobile must not host admin surfaces). ✅ This is the correct posture; needs explicit deny in router.

## 3. Findings

### 🚨 P0 (release blockers)
1. **No portal segregation.** Admin pages bundled with customer app on the same origin; same Supabase JWT authorizes both. A leaked customer token + path traversal to `/admin/*` is the only barrier; neither is sufficient.
2. **No real MFA.** Operator records carry an `mfaEnrolled` flag that nothing writes. There is no TOTP enrollment, no WebAuthn registration, no SMS/Email-OTP step-up. Per `mem://security-authentication`, lockout thresholds exist but second-factor does not.
3. **No `StaffGuard` / `MfaGuard` / `IpAllowlistGuard` / `StepUpGuard`** on any of the 8 admin Nest modules. A customer JWT can hit `/api/internal-admin-shell/...` and the guard chain accepts it.
4. **No short-TTL admin session.** Customer JWT (long-lived) doubles as admin auth. Admin session must be ≤30 min idle, ≤8 h absolute, with sliding refresh requiring re-MFA on absolute expiry.
5. **No step-up re-auth on dangerous actions.** Refund, payout release, dispute resolution, user ban, KYC override, feature flag flip, secret rotation, role grant — all currently one click from a normal admin dashboard load. NIST 800-63B step-up is not implemented.
6. **No IP allow-list / device pinning** for staff entry. Lost laptop = full admin from anywhere.
7. **No lateral-movement controls.** A `support` operator (CS portal) and a `finance` operator share the same JWT shape; switching portals doesn't trigger re-MFA, re-claim issuance, or audit. Per `mem://admin-isolation` portals must be isolated.
8. **Audit log not written from admin paths.** Tables exist, trigger enforces append-only ✅, but no service emits `admin.login.{success,failure,locked}`, `admin.action.{view,export,refund,ban}`, `admin.session.elevated`. Without writes, the controls are theatre.
9. **Two competing audit schemas** (`audit_log` vs `audit_log_entries`) with no canonical owner — risk of half the writes going to the wrong table; pen-test forensics fragmented.
10. **No admin-side CSP / clickjacking lockdown** (D28 echo): admin shell must enforce `frame-ancestors 'none'`, `Sec-Fetch-Site: same-origin`, `Cross-Origin-Opener-Policy: same-origin`.
11. **`InternalAdminLoginPage.tsx` reachable by any visitor.** Even if backend hardens, exposing the admin login URL globally is reconnaissance leakage. Must be served only from the admin gateway (separate subdomain or `/_internal/*` path with allow-list precondition + no robots index, currently unverified).
12. **No emergency-revoke broadcast.** Per `mem://governance-incident-mode` an Incident Mode toggle exists in UI; there is no signed kill-switch endpoint that revokes all active admin sessions in one call.

### P1
13. No WebAuthn (phishing-resistant factor) — TOTP-only is acceptable but WebAuthn should be the recommended primary for super_admin/finance/trust roles.
14. No just-in-time elevation: ops should request +30 min `super_admin` scope from a peer who approves; today, role is permanent until revoked.
15. No "break-glass" recovery account with sealed credentials and double-witness audit alert.
16. No anomaly detection on admin sessions (new country / impossible travel / off-hours). FD-01 P1 carry-over, lands harder here.
17. No screen-recording / session replay watermark on admin shell; no consent acknowledgement on each elevated login.
18. No outbound-data DLP on admin export endpoints (`AdminReportsPage` exports CSVs without size/row-count throttling or "this download was logged" banner).
19. No portal-specific CSP allow-list (e.g., admin shell forbids any third-party script load that customer pages allow).
20. No mTLS option for super_admin from operations VPN.

### P2
21. No "operator inventory" UI showing all active admin sessions with revoke (FD-01 sessions carry-over, but admin-only view needed).
22. No mandatory monthly access review export (SOC2 control).
23. No SCIM provisioning hook so operator off-boarding from HRIS revokes within 60s.

## 4. Run 2 build priorities (FD-03 only)

**Database**
1. Migration `00XX_admin_security.sql`:
   - `staff_operators(id, user_id UNIQUE, hire_date, termination_date NULL, status enum('active','suspended','terminated'), created_at)`.
   - `staff_mfa_factors(id, operator_id, type enum('totp','webauthn','recovery'), label, secret_encrypted bytea, public_key_cose bytea NULL, sign_count int, created_at, last_used_at, revoked_at NULL)`.
   - `staff_ip_allowlist(operator_id, cidr inet, label, expires_at NULL)`.
   - `staff_step_up_tokens(id, operator_id, scope text, issued_at, expires_at, consumed_at NULL, action_ref text)` — short-TTL (5 min) one-shot tokens that wrap dangerous actions.
   - `admin_sessions(id, operator_id, mfa_method text, ip inet, ua text, issued_at, idle_expires_at, absolute_expires_at, revoked_at NULL, revoked_reason text NULL)`.
   - **Canonicalize audit**: settle on `audit_log_entries` (already append-only-trigger protected). Migrate `audit_log` writers to it; mark `audit_log` deprecated; backfill index. Add `actor_role`, `portal`, `step_up_token_id` cols.

**Backend (NestJS)**
2. Standalone module `apps/api-nest/src/modules/admin-gateway/`:
   - `POST /admin/auth/login` (separate from `/auth/login`) → returns short-TTL pre-MFA token bound to portal claim.
   - `POST /admin/auth/mfa/totp/verify` and `/webauthn/{begin,finish}` → exchange pre-MFA token for full admin session token (≤30 min idle / ≤8 h absolute), writes `admin_sessions` row + `audit_log_entries`.
   - `POST /admin/auth/step-up` → 5-min step-up token bound to a specific `(action, resource_id)`; required by all dangerous endpoints.
   - `POST /admin/auth/portal-switch` → re-issues claim with new `portal` (cs|finance|moderator|trust|super) ONLY if operator holds that role; writes audit; resets idle timer; may require step-up.
   - `POST /admin/auth/revoke-all` (incident mode kill-switch) → revokes every `admin_sessions` row in one call.
3. Guards (composable, applied in this order on every admin controller):
   - `JwtAuthGuard` → `StaffGuard` (operator row exists & active) → `IpAllowlistGuard` (CIDR match unless break-glass) → `MfaGuard` (admin session token, not customer JWT) → `AdminSessionGuard` (sliding window) → `RolesGuard` (FD-02) → `StepUpGuard` (when `@RequireStepUp('refund')`) → `PoliciesGuard` (FD-02 CASL) → `WriteThrottlerGuard`.
4. Apply guard pack to all 8 admin modules: `internal-admin-login-terminal`, `internal-admin-shell`, `super-admin-command-center`, `moderator-dashboard`, `trust`, `trust-safety-ml`, `finance-admin`, `customer-service` (+ `payouts-escrow-finops` admin controller).
5. `AuditInterceptor` (Nest interceptor) wired globally on the admin module: every successful request and every guard-rejected request emits one `audit_log_entries` row `{actor, portal, action, resource, severity, ip, ua, step_up_token_id?, request_id}`.
6. Decorators: `@RequireStepUp('refund'|'ban'|'export'|'kyc-override'|'flag-flip'|'secret-rotate')`, `@Portal('cs'|'finance'|...)`, `@MinimumMfa('totp'|'webauthn')`.
7. Helmet hardening for admin gateway routes only: `frame-ancestors 'none'`, `default-src 'self'`, `connect-src 'self' wss://...`, no third-party allow.
8. Robots: serve `X-Robots-Tag: noindex, nofollow` on every admin gateway response (per `mem://seo-and-metadata-system` private route rule).

**Frontend (web)**
9. **Hostname / path split**: serve admin shell from `/_internal/*` mounted as a separate Vite entry (or, ideal: separate subdomain `internal.gigvora.app`). Customer bundle does NOT import admin pages (tree-shake gate in CI).
10. New `_internal/_authenticated` TanStack layout with `beforeLoad` that:
    - Hits `GET /admin/auth/me` (separate from customer `/me`).
    - Redirects to `/_internal/login` if no admin session.
    - Renders mandatory **Operator Ribbon** (per `mem://admin-terminal-architecture`) with operator name, current portal, session TTL countdown, "Sign out everywhere".
11. `<RequireStepUp action="refund">` HOC that prompts TOTP/WebAuthn before submitting; obtained step-up token attached to the protected request as `X-Admin-StepUp` header.
12. Portal switcher — calls `/admin/auth/portal-switch`, re-issues token, refreshes ability set; per-portal CSP applied.
13. Idle warning modal at 25 min, hard logout at 30 min idle, hard logout at 8 h absolute regardless of activity.
14. Admin shell never renders avatar dropdown / customer nav.

**Mobile**
15. `apps/mobile-flutter/lib/app/router.dart` — explicit deny: any deep link to admin paths returns "Admin tools are only available on desktop." Add unit test.

**Tests**
16. Playwright `tests/e2e/security/admin-gateway.spec.ts`:
    - Customer JWT cannot reach `/api/internal-admin-*` (403).
    - Direct `/_internal/*` URL hit without admin session → redirect to `/_internal/login`.
    - Login → no MFA → cannot reach shell.
    - TOTP enrolment then verify → shell loads with Operator Ribbon.
    - From CS portal, attempt finance refund → 403 step-up missing → step-up modal → success → audit row visible.
    - Idle 31 min → next click forces re-MFA.
    - Revoke-all from super-admin → other tabs forced to login within 1s.
17. Terminal harness `tests/logic-flow/admin-portal.ts` (SDK):
    - Out-of-allowlist IP → reject.
    - Step-up token consumed once → second use 401.
    - Portal switch without role → 403 + audit.
    - Append-only audit: `UPDATE audit_log_entries` raises exception ✅.
18. Mobile: unit test `admin link unreachable`.

## 5. Mapping to Master Sign-Off Matrix
- **Primary**: G12 (security/compliance) — admin posture is the hardest single gate.
- **Secondary**: G03 (Nest module additions), G06 (web route migration; the `_internal` split is a major route-tree event), G09 (Playwright admin matrix), and G07 (audit emit fabric).

## 6. Domain checklist matrix (Run 1 state)

| Validation Item | Tick | Evidence / File pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets, buttons, forms, popups, drawers mapped | ☐ | 18 admin pages enumerated §2; portal split & ribbon not implemented |
| Backend files and APIs complete | ☐ | 8 admin modules exist; admin-gateway module + 8 endpoints + 6 guards + AuditInterceptor missing |
| Supabase/demo data eliminated | ☐ | `internal-admin-login-terminal.service` reads `mfaEnrolled` flag with no real enrollment writer |
| Database schema, seeders, fixtures complete | ☐ | `audit_log_entries` ✅ append-only; `staff_operators`/`staff_mfa_factors`/`staff_ip_allowlist`/`staff_step_up_tokens`/`admin_sessions` missing; dual audit tables not canonicalized |
| ML / analytics / workers integrated | ☐ | Anomaly detection on admin sessions deferred (P1) |
| Indexing/search/filter logic | n/a | n/a |
| Realtime / live data | ☐ | Revoke-all broadcast over WS not implemented |
| Security & middleware protections | ☐ | 12 P0s open |
| Playwright logic-flow coverage | ☐ | `admin-gateway.spec.ts` not present |
| Mobile / API parity | ☐ | Explicit admin-deny in mobile router not yet asserted |
| Acceptance criteria passed | ☐ | Pending Run 2 build + Run 4 validation |

## 7. Acceptance criteria (binding)
- A1. Admin entry served from `/_internal/*` (or separate subdomain). Customer bundle has zero admin imports (CI tree-shake gate).
- A2. `/admin/auth/login` is distinct from `/auth/login`; pre-MFA token cannot reach any admin shell endpoint.
- A3. TOTP and WebAuthn both enrollable; super_admin & finance default to WebAuthn-required.
- A4. Customer JWT direct hit on any `/api/internal-admin-*` route → 403 + audit row.
- A5. Admin session idle timeout 30 min, absolute 8 h; both enforced server-side; Playwright proves logout.
- A6. `@RequireStepUp` on refund/payout-release/ban/kyc-override/flag-flip/secret-rotate; UI prompts and attaches `X-Admin-StepUp` header; missing/invalid token → 403.
- A7. IP-allow-list enforced; off-allow-list login requires "break-glass" path with double-witness email/Slack alert.
- A8. Portal switch re-issues claim, requires the role, records audit, resets idle timer.
- A9. `audit_log_entries` append-only confirmed (UPDATE raises); ≥1 row per admin login (success/fail), per portal switch, per dangerous action (with `step_up_token_id`).
- A10. `revoke-all` super-admin endpoint terminates every active admin session in <1s, broadcasts via WS, all admin tabs reload to login.
- A11. Admin shell sends `frame-ancestors 'none'`, `X-Robots-Tag: noindex`, `Cross-Origin-Opener-Policy: same-origin`.
- A12. Mobile router rejects every admin deep link with explicit message + unit test green.
- A13. `tests/e2e/security/admin-gateway.spec.ts` and `tests/logic-flow/admin-portal.ts` green in CI.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate. Next: ship the admin-gateway build pack on top of FD-01 + FD-02 foundations; update Master Sign-Off Matrix gate G12 with admin evidence row._

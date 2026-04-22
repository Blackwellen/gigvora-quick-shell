# D02 — Identity, Authentication, MFA, Verification, Onboarding
## Run 1 · Audit & Inventory

**Date:** 2026-04-18
**Scope:** `src/contexts/AuthContext.tsx`, `src/pages/auth/*`, `src/pages/admin/InternalAdminLoginPage.tsx`, `apps/api-nest/src/modules/identity/*`, `packages/db/src/schema/{identity,auth}.ts`, `packages/db/migrations/{0053,0056}_*.sql`, `database/seeders/{0004,0053,0056}_seed_*.sql`, `apps/analytics-python/app/identity.py`, `apps/mobile-flutter/lib/features/{identity,identity_v2,auth_v2}/*`, `tests/playwright/identity.spec.ts`.
**Mode:** Read-only inventory + gap report. No code changes in Run 1.

---

## 1. Surface inventory

### 1.1 Web pages (7 unauthenticated + 1 admin)
| Route | Page | Status |
|---|---|---|
| `/signin` | `SignInPage.tsx` | wired to `useAuth().login()` → Supabase |
| `/signup` | `SignUpPage.tsx` | wired to `useAuth().signup()` → Supabase |
| `/forgot-password` | `ForgotPasswordPage.tsx` | **direct `supabase.auth.resetPasswordForEmail`** |
| `/reset-password` | `ResetPasswordPage.tsx` | **direct `supabase.auth.updateUser`** |
| `/verify` | `VerifyPage.tsx` | **no backend call detected** — likely stub |
| `/onboarding` | `OnboardingPage.tsx` | **no backend call detected** — likely stub |
| `/account-locked` | `AccountLockedPage.tsx` | **no backend call detected** — static |
| `/admin/login`, `/internal/admin-login` | `InternalAdminLoginPage.tsx` | static UI; **no auth call**; bypass `<Link to="/admin">` |

### 1.2 NestJS backend (`apps/api-nest/src/modules/identity/`)
Files: `identity.controller.ts`, `identity.service.ts`, `identity.repository.ts`, `risk.service.ts`, `dto.ts`, `identity.module.ts`.

24 controller endpoints exist:
- Public: `signup`, `login`, `refresh`, `logout`, `email/verify`, `email/resend`, `password/forgot`, `password/reset`
- Authenticated (`AuthGuard('jwt')`): `me`, `mfa` list/enroll/verify, `sessions` list/revoke, `onboarding` get/patch, `verifications` list/create
- Admin: `admin/verifications/pending`, `admin/verifications/:id/decide`

Service methods cover all 24 routes including `enrollMfa`, `verifyMfaEnrollment`, `revokeSession`, `decideVerification`, `publicIdentity` projection.

### 1.3 Database (Drizzle schema)
- `packages/db/src/schema/identity.ts` — `identities`, `identity_org_memberships`, `identity_handles`
- `packages/db/src/schema/auth.ts` — `auth_credentials` (Argon2id, lockout), `auth_sessions`, `auth_oauth_connections` (google/github/microsoft/linkedin/apple), `auth_mfa_factors` (totp/webauthn/sms/backup_code), `auth_password_resets`
- Migrations: `0053_identity.sql`, `0056_auth.sql`
- Seeders: `0053_seed_identity.sql`, `0056_seed_auth.sql` (dev placeholder hash), `0004_seed_identity.sql` (**LEGACY — references columns that no longer exist on `identities` table: `email`, `password_hash`, `status`; uses bcrypt; conflicts with new schema**)

### 1.4 SDK
`packages/sdk/src/` has **no `identity.ts` / `auth.ts`** module. Only `verification-compliance.ts` covers Domain 73 admin review. **Gap:** no shared types for signup/login/MFA/onboarding/sessions DTOs — frontend & Flutter cannot import a common contract.

### 1.5 Flutter
Three identity feature folders exist (`identity/`, `identity_v2/`, `auth_v2/`) — **duplicated/forked**. Need consolidation.

### 1.6 ML / Analytics
`apps/analytics-python/app/identity.py` exposes `/identity/risk/score` (deterministic risk band). NestJS `risk.service.ts` is the consumer with local fallback.

### 1.7 Tests
`tests/playwright/identity.spec.ts` covers 2 thin scenarios: signin form renders, forgot-password validates empty email. **No coverage** for: signup, MFA enroll/verify, session list/revoke, onboarding, email verify, password reset confirm, account-locked, admin verification decide, OAuth callback, JWT refresh.

---

## 2. A1–A13 audit checklist

| # | Track | Finding | Evidence |
|---|---|---|---|
| **A1** | Supabase removal | ☒ **Critical breach.** Identity is the highest-stakes domain and 4 of 7 auth pages (`AuthContext`, `Forgot`, `Reset`, plus `useAI`) still call `supabase.auth.*` directly while a complete NestJS identity module already exists. The two systems have **disjoint user records** — Supabase `auth.users` vs `public.identities`. Signup writes to Supabase, the backend reads from `identities` → identity is fundamentally broken in production. | `grep -rE "supabase.auth" src` → `AuthContext.tsx:43,49,59,63,70`, `ForgotPasswordPage.tsx:20`, `ResetPasswordPage.tsx:36,49` |
| **A2** | NestJS completeness | ☒ **Module is functionally complete** (24 endpoints, 17 service methods covering signup, login, refresh, logout, email verify, forgot/reset, MFA enroll/verify, sessions, onboarding, verifications, admin decide). No frontend uses any of it. | `apps/api-nest/src/modules/identity/identity.controller.ts` |
| **A3** | Connectors / SMTP / OAuth / MFA | ☒ DB schema has `auth_oauth_connections` for 5 providers and `auth_mfa_factors` for totp/webauthn/sms/backup_code. **No controller endpoints** for `oauth/start`, `oauth/callback`, `oauth/link`, `oauth/unlink`. **No SMTP/email-provider wiring** for verify and password-reset emails (service emits tokens but no transactional email send is observed). **No SMS provider** for SMS MFA. WebAuthn enrol/verify endpoints exist but no challenge/attestation handler is visible in service. | `auth.ts:38–60`, `identity.controller.ts` route list |
| **A4** | ML / analytics | ☒ Risk scoring exists (`analytics-python/identity.py` + NestJS `risk.service.ts`). **Not surfaced in UI** — `SignInPage` does not display risk band, MFA-required prompt, or reason chips. | `apps/analytics-python/app/identity.py` |
| **A5** | Indexers / search | ☐ Not applicable to D02 at this stage (admin verification queue search is D73). | — |
| **A6** | Pages → tabs → components | ☒ Missing pages required by the schema/service surface: <br>• `/account/sessions` (list & revoke active sessions — service exists) <br>• `/account/security` or `/settings/security` (MFA enrol/list/disable, password change, OAuth links) <br>• `/account/verifications` (user-facing verification submit & status — service exists) <br>• `/onboarding/role` (User vs Professional vs Enterprise role selection per `mem://features/user-roles`) <br>• `/auth/callback` (OAuth provider callback) <br>• `/verify-email-sent` and `/verify-email-success` (clear post-signup states) <br>• `/internal/admin-login` form is **purely cosmetic** — the bypass is `<Link to="/admin">` with no auth call. | `src/pages/auth/`, `src/pages/admin/InternalAdminLoginPage.tsx` |
| **A7** | Real data / no demo | ☒ `database/seeders/0004_seed_identity.sql` references columns that no longer exist on `identities` (`email`, `password_hash`, `status`) — this seeder will **fail to apply** against the current schema. It is a legacy starter artifact and must be deleted. <br>☒ `database/seeders/0056_seed_auth.sql` inserts a literal `'$argon2id$…$DEV_HASH_DO_NOT_USE_IN_PROD'` — guarded by `IF EXISTS` but still ships fake credentials. <br>☒ `InternalAdminLoginPage` lists 6 hard-coded admin role descriptors as design fixtures. | `database/seeders/0004_seed_identity.sql`, `0056_seed_auth.sql:9` |
| **A8** | Player / editor | ☐ N/A. | — |
| **A9** | Browser / terminal logic-flow | ☒ The supabase ↔ identity-module split means: **a freshly signed-up user cannot retrieve their backend `me` payload, cannot enrol MFA, cannot start onboarding, cannot submit verifications.** Any authenticated route that hits NestJS will 401 because the JWT issued by Supabase is not the JWT minted by `IdentityService.login()`. | code inspection + token-source mismatch |
| **A10** | Forms enrichment | ☒ `SignUpPage` collects email, password, name only. Backend `SignupDto` accepts `marketingOptIn`; not surfaced. `LoginDto` accepts `mfaCode` and `deviceLabel`; not surfaced. `OnboardingPatchDto` accepts `currentStep`/`payload`/`status` — `OnboardingPage.tsx` makes no backend call. `CreateVerificationDto` covers 5 kinds — no UI exists. | `dto.ts` vs page contents |
| **A11** | Frontend ↔ backend integration | ☒ **Zero integration.** No file in `src/` imports from `@gigvora/sdk` for identity, no `fetch` to `/api/v1/identity/*`, no axios client. Entire NestJS identity module is dead code from the web app's perspective. Flutter has 3 forked identity folders — also unverified. | `grep -rE "/api/v1/identity\|@gigvora/sdk.*identity" src` → 0 hits |
| **A12** | Security / GDPR / FCA | ☒ Major security gaps: <br>• Two parallel auth systems = unauditable session truth. <br>• Supabase password reset bypasses backend lockout (`auth_credentials.failed_attempts`, `lockedUntil`, `mustChangePassword`). <br>• No CSRF token on `/auth/callback` (route doesn't exist yet). <br>• `/admin/login` accepts any input and links straight to `/admin` — a **privilege-escalation footgun**. <br>• No rate-limit guard visible on `signup`/`login`/`forgot` controller methods. <br>• Risk-score MFA enforcement (returned by `risk.service`) is not honoured by `SignInPage`. | `InternalAdminLoginPage.tsx:361`, `AuthContext.tsx`, `identity.controller.ts` |
| **A13** | Mobile parity / docs | ☒ Three Flutter identity folders (`identity/`, `identity_v2/`, `auth_v2/`) — pick one, delete two. No `docs/architecture/domain-D02-*.md` exists. | `find apps/mobile-flutter/lib/features -iname '*identity*' -o -iname '*auth*'` |

---

## 3. Gaps to remediate in Run 2

| Gap ID | Priority | Description |
|---|---|---|
| **D02-G1** | **P0** | Replace `AuthContext` Supabase calls with NestJS identity module: `POST /identity/signup`, `/login`, `/refresh`, `/logout`, `/me`. Store JWT + refresh in httpOnly cookie via API gateway (or memory + refresh rotation). |
| **D02-G2** | **P0** | Rewrite `ForgotPasswordPage` and `ResetPasswordPage` to call `POST /identity/password/forgot` and `/password/reset` — kill `supabase.auth.resetPasswordForEmail` and `supabase.auth.updateUser`. |
| **D02-G3** | **P0** | Wire `VerifyPage` to `POST /identity/email/verify` (extract token from query). Add `/verify-email-sent` post-signup confirmation page and `/verify-email-success` terminal state. |
| **D02-G4** | **P0** | Wire `OnboardingPage` to `GET/PATCH /identity/onboarding`. Implement step machine: `welcome → role → goals → headline → expertise → completed` per existing `OnboardingPatchDto`. |
| **D02-G5** | **P0** | Make `/admin/login` an actual auth gate calling a privileged variant of `/identity/login` (e.g. require `admin` role grant + recent MFA). Remove the `<Link to="/admin">` bypass. Block render of `<AdminShell />` routes when no admin grant. |
| **D02-G6** | **P0** | Delete `database/seeders/0004_seed_identity.sql` (legacy schema, will fail). |
| **D02-G7** | **P1** | Build `packages/sdk/src/identity.ts` exporting typed `IdentityClient`, request/response types, error envelope, MFA factor types, session DTO. Web + Flutter consume it. |
| **D02-G8** | **P1** | Add `/account/security` page: list MFA factors (`GET /identity/mfa`), enrol totp/webauthn/sms (`POST /identity/mfa/enroll`), verify (`POST /identity/mfa/verify`), list/revoke OAuth links. |
| **D02-G9** | **P1** | Add `/account/sessions` page: `GET /identity/sessions`, `POST /identity/sessions/:id/revoke`. Surface device, IP, last-seen. |
| **D02-G10** | **P1** | Add OAuth start + callback endpoints (controller side) + `/auth/callback` page. State param + nonce check. Schema already supports 5 providers. |
| **D02-G11** | **P1** | Honour `risk.service` output in `SignInPage`: when `band==='high'` or `mfaRequired`, render reason chips and force MFA step before issuing tokens. Plumb through `LoginDto.mfaCode`. |
| **D02-G12** | **P1** | Add SMTP integration (or queue → workers) for password-reset and verify emails. Today the service mints tokens but no email sender is observed. Reuse the existing email infra hook from D04. |
| **D02-G13** | **P2** | Account-locked page should call `GET /identity/lockout-status?email=…` (new endpoint) and show real `lockedUntil` countdown. |
| **D02-G14** | **P2** | Consolidate Flutter to a single `features/identity/` — delete `identity_v2/` and `auth_v2/` after reading current state. |
| **D02-G15** | **P2** | Replace 2-test `identity.spec.ts` with full coverage: signup → verify → onboarding → MFA enrol → MFA login → session revoke → password reset → account-locked → admin-login gate. |
| **D02-G16** | **P2** | Add controller-level rate-limit guards (`@Throttle`) on `signup`, `login`, `password/forgot`, `email/resend`. |
| **D02-G17** | **P2** | Surface backend `SignupDto.marketingOptIn` and `LoginDto.deviceLabel` fields in the web forms (collapse defaults so UI stays minimal). |
| **D02-G18** | **P3** | Write `docs/architecture/domain-D02-identity.md` covering the auth lifecycle, token rotation, MFA decision tree, OAuth flow, and lockout policy (5-attempt threshold per `mem://features/security-authentication`). |

---

## 4. Sign-off matrix

| Track | Audit | Build | Integrate | Test | Sign-off |
|---|---|---|---|---|---|
| A1  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A2  | ☒ | ☐ (already complete) | ☐ | ☐ | ☐ |
| A3  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A4  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A6  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A7  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A9  | ☒ | ☐ | ☐ | ☐ | ☐ |
| A10 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A11 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A12 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A13 | ☒ | ☐ | ☐ | ☐ | ☐ |
| A5, A8 | n/a at D02 scope | — | — | — | — |

**Run 1 status: COMPLETE.** 18 gaps recorded (6× P0, 6× P1, 5× P2, 1× P3). Critical issue: the web app's identity layer is wired to Supabase Auth while the entire NestJS identity module (24 endpoints, MFA, sessions, verifications, admin decide) is **dead code** — these two systems are not connected and operate against different user records. P0 gaps must close before any other domain that assumes JWT-bearing requests can be validated.


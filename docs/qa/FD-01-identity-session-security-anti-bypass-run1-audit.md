# FD-01 — Identity Session Security & Anti-Bypass Access — Run 1 Audit

Date: 2026-04-18 · Group: G1 · Maps to **Master Sign-Off Matrix → G12 (security/compliance)** with secondary impact on G03 (Nest backend) and G11 (mobile parity).

## 1. Business & technical purpose
Guarantee that no protected web, mobile, REST, WebSocket, file-download, or admin surface is reachable without (a) a valid live session and (b) the entitlements required for that surface — and that the avatar dropdown, dashboard, profile, deep links, stale tabs, embedded iframes, copied URLs, and bookmarks all resolve to the **same single source of session truth**.

## 2. Inventory snapshot (grep evidence)

### Frontend (web)
- **Single auth context**: `src/contexts/AuthContext.tsx` (96 lines) — uses `supabase.auth.onAuthStateChange` + `getSession`, exposes `login/logout/signup` and `isAuthenticated`. Order is correct (subscribe BEFORE getSession).
- **Zero `<ProtectedRoute>` / `<RequireAuth>` wrappers** anywhere in `src/` — only mention is inside `src/docs/GIGVORA_MASTER_PLAN.md` (a doc, not a component). All 499 pages under `src/pages/` are reachable by typing the URL.
- **No `src/routes/`** — TanStack `_authenticated` pathless layout pattern (the documented standard) does not exist; D27 audit echo.
- **No cross-tab logout listener** — `BroadcastChannel('auth')` / `storage` event handler not present.
- **No idle-timeout** — no `useIdleTimer` / activity-tracking forced-logout.
- **No iframe-embed defense** beyond whatever default helmet provides (D28 found per-directive CSP/X-Frame-Options-DENY not configured).

### Backend (NestJS)
- **`apps/api-nest/src/modules/auth`** exists with `auth.controller.ts`, `auth.service.ts`, `auth.module.ts`, `jwt.strategy.ts`. Passport-JWT-style scaffold present.
- **`@UseGuards` is widely applied** across 30+ controllers (ads, agency, billing, client-dashboard, companies, donations, enterprise-connect, entitlements, events, feed, groups, identity, inbox, internal-admin, map-views, network, networking-events, notifications, org-members-seats, overlays, payouts, pricing, profiles, recruiter, etc.). Surface coverage is broad.
- **`WriteThrottlerGuard`** exists at `apps/api-nest/src/infra/write-throttler.guard.ts` (D28 echo).
- **No session/device registry tables** — `grep user_sessions|device_sessions|refresh_tokens|session_revocations database/migrations` returns zero hits. Logged-in-devices list, "log out other sessions", and revocation cannot be implemented today.
- **No EntitlementsGuard / RolesGuard hits in grep** — only `@UseGuards(JwtAuthGuard)` (or equivalent) appears widespread; entitlement gating per `mem://features/access-gating` is enforced (if at all) inside service handlers, not at the guard layer.
- **No 401/403 contract** documented — error envelope shape unverified.

### WebSocket handshake (CRITICAL)
- `apps/api-nest/src/modules/notifications/notifications.gateway.ts` `handleConnection` reads `client.handshake.auth?.identityId ?? client.handshake.query?.identityId` and joins `user:{identityId}` **with no token verification**. The header comment says "Bearer token in `auth.token` (decoded by JwtStrategy elsewhere)" but the code path proves otherwise — **any client can claim any `identityId` via `?identityId=...` and receive that user's notification stream**. This is a P0 horizontal-privilege escalation.

### File downloads
- No central download-URL signer found. Static / S3 / R2 surfaces in `apps/integrations/src/storage/{s3,r2}.ts` exist but per-request signed URLs with TTL + identity binding are unverified.

### Mobile (Flutter)
- `apps/mobile-flutter/lib/core/storage.dart` exists; D26 audit confirmed it uses **plain `shared_preferences`** for auth tokens (not `flutter_secure_storage`). Tokens are world-readable to any other process on a rooted/jailbroken device.
- `apps/mobile-flutter/lib/features/identity/identity_providers.dart` exists.
- **No biometric unlock (`local_auth`)** for re-auth on payouts/admin/KYC.
- **No splash-time guard** — D26 audit: protected screens may render before token validation completes.

## 3. Findings

### 🚨 P0 (release blockers)
1. **WS handshake accepts unverified `identityId`** — anyone can subscribe to any user's notifications/messages stream by passing `?identityId=<victim>`.
2. **Zero frontend route guards** — every authenticated page is reachable by URL; no `_authenticated` layout, no `<ProtectedRoute>`, no `beforeLoad: redirect()`.
3. **No session/device registry** — cannot list active devices, cannot revoke remotely, cannot force "sign out everywhere", cannot detect stolen refresh tokens.
4. **Mobile tokens in `shared_preferences`** — must move to `flutter_secure_storage` + Keychain/Keystore.
5. **No cross-tab logout parity** — logging out in tab A leaves tab B authenticated until next API 401.
6. **No idle-timeout / forced-logout** for high-trust surfaces (admin, payouts, billing, KYC).
7. **No iframe / clickjacking defense** per-directive (D28 echo): `X-Frame-Options: DENY` + `frame-ancestors 'none'` not enforced.
8. **No entitlement guard at HTTP layer** — Free→Pro surfaces gated only by UI; direct API call from a Free token may succeed.
9. **No 401/403 redirect contract** — stale-tab API call returns whatever Supabase returns; frontend has no global 401 → forced re-auth interceptor.
10. **No download-URL signing with identity binding + short TTL** for protected files.
11. **No suspended / downgraded-entitlement state** handled — a banned user's existing JWT remains valid until natural expiry.

### P1
12. No `Sec-Fetch-Site`/`Sec-Fetch-Mode` validation on state-changing routes (CSRF defense-in-depth; complements D28's missing CSRF token).
13. No replay protection on refresh-token rotation (tokens not single-use).
14. No `Authorization` header on internal-admin routes verified separately from end-user JWT (D25 echo: admin needs distinct token + IP allow-list).
15. Audit log table for `auth.login.success/failure`, `auth.logout`, `session.revoke`, `entitlement.denied` not confirmed in `database/migrations`.
16. No "remember me" vs "session-only" distinction in cookie maxAge.
17. No password-change → revoke-all-sessions flow.
18. No e-mail change confirmation (current password re-entry + verification on both old + new addresses).
19. No anomalous-login detection (new country / new device → email + step-up MFA).
20. No HIBP password check enabled (`configure_auth.password_hibp_enabled`).

### P2
21. No `/me/sessions` UI in Settings → Security.
22. No `/me/security/audit` UI showing recent auth events.
23. No `/.well-known/change-password` (RFC 8615) for password-manager deep-linking.
24. No SCIM / SSO posture for enterprise tenants documented.

## 4. Run 2 build priorities (FD-01 only, smallest set that flips this domain green)

**Backend (NestJS)**
1. Replace WS `handleConnection` body with: extract Bearer from `client.handshake.auth.token` → verify via the same JWT strategy as REST → set `client.data.identityId` from the **verified** sub claim → reject and `client.disconnect(true)` on failure. No `?identityId=` query fallback in production.
2. Add `EntitlementsGuard` and apply via `@UseGuards(JwtAuthGuard, EntitlementsGuard)` + `@RequireEntitlement('pro'|'team'|'enterprise')` decorator on Pro+ controllers.
3. Migration `00XX_session_registry.sql`: `user_sessions(id, user_id, device_label, user_agent, ip, created_at, last_seen_at, revoked_at)` + `refresh_tokens(id, session_id, token_hash, rotated_from, used_at, expires_at)` + indexes on `user_id`, `expires_at`. Single-use refresh tokens; rotation invalidates predecessor.
4. `POST /auth/sessions/:id/revoke`, `GET /auth/sessions`, `POST /auth/sessions/revoke-all-others`, `POST /auth/password/change` → revokes all sessions except current.
5. Global 401/403 envelope: `{ error: { code, message, redirect } }` with `redirect: '/auth/login?next=...'` for 401 and `redirect: '/billing/upgrade?gate=...'` for entitlement-403.
6. Audit-log writes for every `auth.*` event into `audit_log` (existing per D24 emit files).
7. File downloads: signed-URL helper (HMAC, 5-min TTL, `sub` bound) in `apps/integrations/src/storage/sign.ts` + Nest controller that issues them only after entitlement check.

**Frontend (web)**
8. Scaffold `src/routes/_authenticated.tsx` (TanStack pathless layout) with `beforeLoad` that checks `context.auth.isAuthenticated`; throw `redirect({ to: '/auth/login', search: { next: location.href } })`. Mirror `src/routes/_authenticated/_pro.tsx`, `_team.tsx`, `_enterprise.tsx`, `_admin.tsx` for entitlement tiers (per `tanstack-auth-guards` docs in scope).
9. Migrate the high-traffic protected pages from `src/pages/` to `src/routes/_authenticated/*` (D27 P0 echo; this is the route migration entry point).
10. Add cross-tab logout: `BroadcastChannel('gigvora.auth').postMessage({ type: 'logout' })` on logout; listener in `AuthContext` calls `setSession(null)` + `router.navigate({ to: '/auth/login' })`.
11. Global fetch/SDK 401 interceptor → calls `logout()` then redirects to `/auth/login?next=` + current path.
12. Idle-timeout hook (`useIdleLogout({ minutes: 15 })`) mounted only inside `_authenticated/_admin` and `_authenticated/_billing` subtrees.
13. `Settings → Security → Sessions` page listing devices with "revoke" and "sign out everywhere" actions.

**Mobile (Flutter)**
14. Replace `shared_preferences` token paths in `core/storage.dart` with `flutter_secure_storage`.
15. Splash-time guard in `lib/main.dart` / `lib/app/router.dart`: do not render any non-auth screen before `await TokenStore.validate()` resolves.
16. `local_auth` biometric prompt before showing payouts / admin / KYC routes.
17. Logout call hits new `POST /auth/sessions/:id/revoke` and clears keychain + FCM token.

**Tests**
18. Playwright `tests/e2e/security/anti-bypass.spec.ts`:
    - Direct-URL hit on `/dashboard` while logged out → 302 to `/auth/login?next=/dashboard`.
    - Stale tab: simulate token expiry → next click triggers `/auth/login`.
    - Free user direct GET to a Pro REST route → 403 with `redirect: /billing/upgrade`.
    - WS handshake with arbitrary `?identityId=victim` → connection rejected (no `hello` event, socket disconnected).
    - Cross-tab logout: open two tabs → logout in A → B navigates to `/auth/login` within 1s.
19. Terminal harness `tests/logic-flow/auth-session.ts` (SDK only): login → list sessions (≥1) → revoke-all-others → second token → second-token call returns 401.

## 5. Mapping to Master Sign-Off Matrix
- **Primary**: G12 (security/compliance) — the WS handshake bypass + missing route guards + missing session registry block this gate.
- **Secondary**: G03 (Nest route alignment), G06 (route migration entry point), G07 (realtime — WS auth is part of realtime fabric), G11 (mobile token storage + biometric).

## 6. Domain checklist matrix (Run 1 state)

| Validation Item | Tick | Evidence / File pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | This document, §1 |
| Frontend pages, tabs, widgets, forms, popups, drawers mapped | ☐ | Auth pages exist in `src/pages/auth/*`; protected-page enumeration pending D27 sitemap ledger |
| Backend files and APIs complete | ☐ | `apps/api-nest/src/modules/auth/*` exists; session-registry endpoints + EntitlementsGuard absent |
| Supabase/demo data eliminated | ☐ | `AuthContext.tsx` still calls `supabase.auth.*` directly — Nest auth module not yet wired to frontend |
| Database schema, seeders, fixtures complete | ☐ | No `user_sessions` / `refresh_tokens` migrations |
| ML / analytics / workers integrated | n/a | n/a for FD-01 (anomaly detection deferred to P1 list item 19) |
| Indexing/search/filter logic | n/a | n/a |
| Realtime / live data | ☐ | `notifications.gateway.ts` handshake unverified — see Finding 1 |
| Security and middleware protections | ☐ | 11 P0s open above |
| Playwright logic-flow coverage | ☐ | `tests/e2e/security/anti-bypass.spec.ts` not present |
| Mobile / API parity | ☐ | Tokens in `shared_preferences`; biometric absent; splash guard absent |
| Acceptance criteria passed | ☐ | Pending Run 2 build + Run 4 validation |

## 7. Acceptance criteria (binding for Run 4 sign-off)
- A1. Direct URL navigation to any protected route while unauthenticated → 302 to `/auth/login?next=<orig>`. No flash of protected content. Verified on web + mobile.
- A2. Stale tab + expired token → first interaction triggers re-auth, never silent 200/empty.
- A3. WS handshake with forged `identityId` rejected; only verified-JWT subscribers receive their channel.
- A4. Free token cannot reach Pro REST routes (403 with structured envelope).
- A5. `GET /auth/sessions` lists ≥1 device; revoke invalidates that token within 1s.
- A6. Password change revokes all sessions except current.
- A7. Cross-tab logout: tab B reflects logout state ≤1s after tab A logs out.
- A8. Mobile: tokens in keychain/keystore; biometric required before payouts/admin/KYC; no protected screen renders before splash guard resolves.
- A9. Audit log row exists for every login success/failure, logout, session revoke, entitlement denial.
- A10. Playwright `anti-bypass.spec.ts` + terminal `auth-session.ts` both green in CI.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate. Next: ship the build pack above, then update Master Sign-Off Matrix gate G12 evidence row._

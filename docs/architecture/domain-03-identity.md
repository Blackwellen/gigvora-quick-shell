# Domain 03 — Identity, Authentication, Verification & Onboarding

## Status
**Build:** ✅ NestJS module, migrations, seeders, SDK contracts, Python risk scorer, Flutter API, tests.
**Integration:** 🟡 Web `ForgotPasswordPage`, `ResetPasswordPage`, and `OnboardingPage` rewired to call NestJS via SDK with Supabase fallback for backwards compat. `AuthContext` continues to honour Supabase session today; full cutover lands when SDK auth is enabled in production.
**Validation:** ✅ Jest (10 cases) + pytest (3 cases) + Playwright smoke. Build green.

## Backend surface
| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /api/v1/identity/signup` | public | Create identity + email verification token |
| `POST /api/v1/identity/login` | public | Risk-scored login; returns `mfaRequired` when band=high or factors enrolled |
| `POST /api/v1/identity/refresh` | public | Rotates session; old refresh hash revoked |
| `POST /api/v1/identity/logout` | public | Revokes session by refresh hash |
| `POST /api/v1/identity/email/verify` | public | Consume email-verification token |
| `POST /api/v1/identity/email/resend` | public | Issue a new verification token (no enumeration) |
| `POST /api/v1/identity/password/forgot` | public | Issue reset token (no enumeration) |
| `POST /api/v1/identity/password/reset` | public | Consume token, set new password |
| `GET  /api/v1/identity/me` | jwt | Current identity |
| `GET/POST /api/v1/identity/mfa[/enroll\|/verify]` | jwt | TOTP enroll + activate |
| `GET /api/v1/identity/sessions` + `POST /sessions/:id/revoke` | jwt | Device list + revoke |
| `GET/PATCH /api/v1/identity/onboarding` | jwt | 4-step wizard persistence |
| `POST/GET /api/v1/identity/verifications` | jwt | KYC / badges (id_document, address, company, badges) |
| `GET /admin/verifications/pending` + `POST /admin/verifications/:id/decide` | jwt + admin (TODO) | Review queue |

## State machines
- **identities**: `active → locked → active` (auto-unlock after 15min) | `disabled` | `deleted`
- **email_verifications**: `pending → verified` (or `expired`)
- **password_resets**: `pending → used` (or `expired` / `revoked`)
- **mfa_factors**: `unverified → active → revoked`
- **sessions**: `active → revoked|expired`
- **onboarding**: `not_started → in_progress → completed` (or `skipped`)
- **verifications**: `pending → approved|rejected|escalated`

## Security posture (UK GDPR)
- Passwords bcrypt(12). Lockout: 5 failures → 15min lock + status flip.
- Refresh tokens hashed (sha256) at rest; rotated on every refresh.
- Login attempts logged (email, ip, ua, outcome, risk score).
- Forgot-password and resend-verification do NOT leak account existence.
- IP + UA captured into `identity_audit` for every meaningful action.
- All tokens random 24-byte hex; reset TTL 60min; verify TTL 24h.
- MFA TOTP secret stored on factor row; encrypted at rest in production
  (current build keeps it plain for local dev only).

## Risk service
- `RiskService` calls `${ANALYTICS_URL}/identity/risk/score` with 800ms timeout.
- On error/timeout → deterministic local scorer with the same shape.
- High band (≥70) forces MFA challenge even if no factor enrolled (pluggable: TODO step-up email OTP).

## Frontend states covered
- Sign-in: idle / submitting / success / error / locked-redirect / mfa-required.
- Sign-up: idle / submitting / success / error / verification-pending.
- Forgot password: idle / submitting / success / error.
- Reset password: idle / submitting / success / error / invalid-token.
- Onboarding: per-step persistence, skip, completion.
- Verify email: success, expired, resend.

## Open follow-ups (Domain 04+)
- Real admin guard on `/admin/verifications/*` (Domain 04 — Roles & RBAC).
- Email delivery via workers (Domain transactional-mail).
- WebAuthn passkeys (currently scaffolded enum; verification handler is TOTP-only).
- Account deletion + GDPR data export endpoints.

## Mobile screens

- `apps/mobile-flutter/lib/features/identity/identity_api.dart` — Dio client (`Idempotency-Key` on signup; full coverage of sessions, MFA, verifications, onboarding endpoints)
- `apps/mobile-flutter/lib/features/identity/identity_providers.dart` — `AuthController` StateNotifier (signup/login/logout, persisted token), `sessionsProvider`, `mfaFactorsProvider`
- `apps/mobile-flutter/lib/features/identity/auth_screens.dart` — `SignInScreen`, `SignUpScreen`, `MfaChallengeScreen`, `ForgotPasswordScreen`
- `apps/mobile-flutter/lib/features/identity/account_security_screens.dart` — `AccountSecurityScreen` (with TOTP enrolment bottom sheet) + `SessionsScreen` with revoke action

Routes (in `apps/mobile-flutter/lib/app/router.dart`):
- `/auth/sign-in`, `/auth/sign-up`, `/auth/mfa`, `/auth/forgot`
- `/account/security`, `/account/sessions`

Every screen uses `AsyncStateView` for loading/empty/error/success and `confirmAction` for destructive operations (sign-out, session revoke).

## Enterprise posture

- **Persistence**: Postgres via TypeORM `DataSource` (identities, sessions, mfa_factors, verifications, login_attempts, identity_audit, password_resets, email_verifications, onboarding).
- **AuditService**: identity-domain audit table (`identity_audit`) records signup, email verification, password reset request/complete, login success, MFA enable, session revoke, verification approve/reject.
- **Rate-limit**: global `WriteThrottlerGuard` + login-attempt throttling via `recentAttempts` heuristic; account lockout after 5 failed attempts (15-min cool-down).
- **MFA**: TOTP factors with deterministic 30s window, recovery codes accepted; risk-band `high` forces MFA even when no factor enrolled.
- **Pagination envelope**: `listSessions`, `listMfa`, `listVerifications`, `pendingVerifications` return `{ items, total, limit, hasMore }`.
- **Error envelope**: standard `{ error: { code, message } }` via `ErrorEnvelopeFilter`.
- **Token rotation**: refresh tokens are rotated on every `/refresh` and stored as SHA-256 hashes only.
- **GDPR / privacy**: `forgotPassword` and `resendVerification` never leak account existence.

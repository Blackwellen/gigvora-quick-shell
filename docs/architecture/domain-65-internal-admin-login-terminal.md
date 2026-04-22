# Domain 65 — Internal Admin Login Terminal, Secure Entry & Environment Selection

**Route family**: `/internal/internal-admin-login-terminal`
**Module**: `apps/api-nest/src/modules/internal-admin-login-terminal/`
**Schema**: `packages/db/src/schema/internal-admin-login-terminal.ts`
**Migration**: `packages/db/migrations/0068_internal_admin_login_terminal.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useIaltOverview` | `GET /overview` |
| Environments | `useIaltEnvironments` | `GET/POST /environments`, `PATCH /environments/:id` |
| Operators | `useIaltOperators` | `GET/POST /operators`, `PATCH /operators/:id` |
| Login + step-up + switch | `useIaltLogin` | `POST /login`, `POST /step-up`, `POST /switch-environment` |
| My sessions | `useIaltMySessions` | `GET /sessions/mine`, `PATCH /sessions/:id/revoke` |
| Forensics | `useIaltForensics` | `GET /attempts`, `GET /audit` |

## State machines

- `ialt_environments.status`: `active ↔ paused → archived`.
- `ialt_operators.status`: `active ↔ paused → revoked` (terminal).
- `ialt_sessions.status`: `active ↔ stepup_pending → expired|revoked` (terminals).

## Security posture

- **Append-only attempts log** (`ialt_login_attempts`) — Postgres trigger
  blocks `UPDATE/DELETE`. Outcomes are constrained to a fixed set.
- **Lockouts** (`ialt_lockouts`) — unique `(scope, scope_key)`. Two scopes:
  - `identity` — 5 failures in 15 min → 15 min lock
  - `ip` — 20 failures in 15 min → 30 min lock
  Successful login clears the identity lockout; IP lockout decays by time only.
- **Step-up MFA** — environments with `risk_band IN ('high','critical')` or
  `requires_step_up = true` issue a `stepup_pending` session that cannot
  perform privileged work until `verifyStepUp` succeeds. Operators must have
  `mfa_enrolled = true` to attempt sign-in to those environments.
- **Environment policy** — login refuses when:
  - environment status ≠ `active` → `env_forbidden`
  - operator's `allowed_envs` does not include the slug → `env_forbidden`
  - environment has a non-empty `ip_allowlist` and the request IP is not in it → `ip_forbidden`
- **Session expiry** — sessions expire after 60 minutes; expired sessions
  cannot step-up or switch environments.
- **Switch environment** — revokes the prior session and issues a new one,
  re-evaluating the step-up requirement against the target environment.
- **Internal-only routing** — every endpoint MUST be served behind the
  `/internal/*` reverse-proxy boundary. Public traffic must never hit this
  controller. JWT guard is layered on top.
- **Audit** — every meaningful action (`env.created`, `env.updated`,
  `operator.created`, `operator.updated`, `session.issued`,
  `session.stepup_verified`, `session.env_switch`, `session.revoked`) is
  written to `ialt_audit_events` with operator, environment, IP, and UA.

## Attempt outcomes

`success`, `invalid_credentials`, `mfa_failed`, `locked`, `env_forbidden`,
`ip_forbidden`, `inactive`, `unknown`.

## Role-aware view matrix

- **User / Client**: not exposed — terminal is internal-only.
- **Professional**: not exposed — terminal is internal-only.
- **Enterprise**: not exposed — terminal is internal-only.
- **Internal / Admin**: full access; only `super_admin` may
  create/modify environments and operators (enforced by upstream guard;
  service-level checks reject cross-operator session mutation).

## Analytics

`apps/analytics-python/app/internal_admin_login_terminal.py`:
- `POST /insights` — `failure_burst` (>50 fails 24h),
  `failure_spike` (>20), `mfa_gap` (operators without MFA), `healthy`.
- NestJS service falls back to deterministic equivalents on 2s timeout.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/internal_admin_login_terminal/`:
- Sticky horizontal env-picker chip row showing risk band.
- Card with email + MFA + sticky "Sign in" CTA.
- Active sessions list with pull-to-refresh.

## Tests

- Playwright smoke: `tests/playwright/internal-admin-login-terminal.spec.ts`.
- Recommended Jest coverage:
  - Login with unknown email → `unknown` attempt logged, generic 401.
  - Inactive operator → `inactive` outcome, no lockout escalation.
  - 5 failed identity attempts → identity lockout for 15 min; 6th attempt → `locked`.
  - 20 failed IP attempts → IP lockout for 30 min, blocks all identities from that IP.
  - Successful login clears identity lockout but not IP lockout.
  - High/critical env → operator without MFA → `mfa_failed` (`mfa_not_enrolled`).
  - High/critical env → MFA-enrolled operator → `stepup_pending` session.
  - Step-up with non-6-digit code → `mfa_failed`; with 6 digits → `active`.
  - Step-up rejected when session expired or already active.
  - Env switch revokes prior session, re-issues with correct step-up state.
  - Env switch rejected when target env not in `allowed_envs`.
  - Append-only trigger rejects `UPDATE/DELETE` on `ialt_login_attempts`.
  - Cross-operator session revoke → 403.
  - All audit events recorded with IP/UA on every mutation.

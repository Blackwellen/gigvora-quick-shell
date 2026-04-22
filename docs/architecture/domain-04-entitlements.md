# Domain 04 — Roles, Entitlements, Plans & Access Gating

## Status
**Build:** ✅ NestJS module, migration `0006_entitlements.sql`, seeder `0005_seed_entitlements.sql`, repository, service, DTOs, controller, JWT-guarded endpoints.
**Integration:** 🟡 Frontend `RoleContext` + `EntitlementGate` already render correctly against `PLAN_CONFIGS`; SDK extension + live `/entitlements/me` hydration lands in next pass.
**Validation:** ✅ Jest (7 cases) + pytest (3 cases) + Playwright smoke for plans & gates.

## Backend surface
| Endpoint | Auth | Purpose |
|---|---|---|
| `GET  /api/v1/entitlements/plans` | public | Plan catalogue |
| `GET  /api/v1/entitlements/me?orgId=` | jwt | Resolved roles + plan + effective entitlements + overrides |
| `POST /api/v1/entitlements/check` | jwt | Single access check; logs `allowed | denied | upgrade_required | role_required` |
| `POST /api/v1/entitlements/roles/switch` | jwt | Switch active role (must be granted) |
| `GET  /api/v1/entitlements/me/denials` | jwt | Aggregate of recent friction by feature |
| `GET/POST /api/v1/entitlements/subscriptions[/change\|/cancel]` | jwt | Lifecycle |
| `POST /api/v1/entitlements/admin/plans` | jwt + admin (TODO) | Upsert plan |
| `POST /api/v1/entitlements/admin/roles/{grant\|revoke}` | jwt + admin (TODO) | Role grants |
| `POST /api/v1/entitlements/admin/overrides[/:id/revoke]` | jwt + admin (TODO) | Per-identity feature flags |

## State machines
- **subscriptions**: `trialing → active → past_due | paused | canceled | expired`
- **role_grants**: `pending → active → revoked | expired`
- **plan_changes**: `pending → applied | failed | refunded`
- **entitlement_overrides**: `active → revoked | expired`
- **access_attempts**: `allowed | denied | upgrade_required | role_required`

## Resolution algorithm
1. Load active `role_grants` for identity (filter expired).
2. Load active `subscriptions` for identity then for `orgId` (org wins if both).
3. Resolve effective plan; default to `free` when none found.
4. Apply `entitlement_overrides`: grants add to set, denies remove from set.
5. Choose `activeRole` (prefers `professional` > `enterprise` > `admin` > first).
6. Cache result in `ResolvedEntitlements` envelope with `computedAt`.

## Python analytics
`POST /entitlements/insights` returns deterministic upgrade-hint cards from a denials list. Designed to be cached behind a 5-minute TTL on the web client and surfaced as right-rail cards on `/billing` and `/plans`.

## Open follow-ups
- Add admin guard once Domain 04 RBAC lands in NestJS (currently TODO comments on `admin/*` endpoints).
- Stripe webhook → `subscriptions.status` reconciliation (Domain 11 — Payments).
- SDK `entitlements.*` namespace + `useEntitlementsResolver` hook for the web shell to replace `RoleContext` mock plan state.

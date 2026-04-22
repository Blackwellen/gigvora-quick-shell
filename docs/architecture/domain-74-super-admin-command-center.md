# Domain 74 — Super Admin Command Center, Feature Flags, Audit, and Platform Overrides

Primary route family: `/internal/super-admin-command-center`

## Persistence — `packages/db/migrations/0082_super_admin_command_center.sql`

| Table              | Purpose |
|--------------------|---------|
| `sa_feature_flags` | Platform feature flags. `status` ∈ draft/active/paused/archived. Holds `enabled`, `rollout_pct`, `environments`, `segments`, `variants`. |
| `sa_overrides`     | Platform overrides. `kind` ∈ rate_limit, maintenance, config, entitlement, kill_switch, dark_launch, cost_cap, rollout. Scoped (platform/tenant/user/feature/route/domain) with TTL via `expires_at`. |
| `sa_incidents`     | Platform incidents. `severity` ∈ sev1..sev4, `status` ∈ open/mitigated/resolved/postmortem/archived. |
| `sa_audit`         | **Append-only** ledger for every admin action — flag flips, override changes, incident transitions. Update/delete blocked by `sa_audit_immutable` trigger. |

## NestJS — `apps/api-nest/src/modules/super-admin-command-center/`

Endpoints under `/api/v1/super-admin-command-center` (JWT-guarded):

| Verb  | Path                          | Notes |
|-------|-------------------------------|-------|
| GET   | `/overview`                   | KPIs + active flags + active overrides + open incidents + recent audit + insights |
| GET   | `/flags`                      | Paginated list (status/q filter) |
| GET   | `/flags/:id`                  | Single flag |
| POST  | `/flags`                      | Create (operator+) |
| PATCH | `/flags`                      | Update (operator+) |
| PATCH | `/flags/toggle`               | Enable/disable (admin+) |
| PATCH | `/flags/rollout`              | Rollout pct (admin+) |
| PATCH | `/flags/status`               | State machine (admin+) |
| GET   | `/overrides`                  | Paginated list (scope/kind/status filter) |
| POST  | `/overrides`                  | Create (operator+, kill_switch/cost_cap → admin+) |
| PATCH | `/overrides`                  | Update (same gates) |
| GET   | `/incidents?status=`          | List incidents |
| POST  | `/incidents`                  | Open (operator+) |
| PATCH | `/incidents/transition`       | State machine (resolved/archived → admin+) |
| GET   | `/audit`                      | Paginated audit ledger |

Role ladder: `viewer` < `sa_operator` < `sa_admin` < `sa_root`.

## Analytics — `apps/analytics-python/app/super_admin_command_center.py`

`POST /super-admin-command-center/insights` — deterministic insights (sev1_open, sev2_open, kill_switches, audit_volume, draft_flags, expired_overrides). NestJS service mirrors this logic for fallback.

No domain-specific ML — uses analytics insights only, with deterministic in-process fallback. Shared ML signals from sibling domains (Trust & Safety, Verification) are consumed via their own insights endpoints when relevant; this domain does not require its own model.

## SDK — `packages/sdk/src/super-admin-command-center.ts`

Exported as `SuperAdminCommandCenterTypes` namespace from `packages/sdk/src/index.ts`.

## React hooks — `src/hooks/useSuperAdminCommandCenter.ts`

TanStack Query hooks: `useSaOverview` (30 s refetch), `useSaFlags`, `useSaCreateFlag`, `useSaUpdateFlag`, `useSaToggleFlag`, `useSaRolloutFlag`, `useSaSetFlagStatus`, `useSaOverrides`, `useSaCreateOverride`, `useSaUpdateOverride`, `useSaIncidents`, `useSaCreateIncident`, `useSaTransitionIncident`, `useSaAudit`. All have fixture fallbacks.

## Mobile — `apps/mobile-flutter/lib/features/super_admin_command_center/`

KPI strip (sev1/sev2/active flags/active overrides/kill switches/audit 24h), insight cards, open incidents list, active flags list with inline toggle switches. Pull-to-refresh.

## Logic-flow validation

| Path | Coverage |
|------|----------|
| Primary entry             | `GET /overview` |
| Primary completion        | `PATCH /flags/toggle` → audit ledger entry |
| Happy path                | Create flag → rollout → toggle on |
| Approval / blocked        | `kill_switch` override creation requires `sa_admin` → 403 otherwise |
| Degraded / stale          | Analytics down → fallback insights |
| Retry / recovery          | Incident `mitigated → open` allowed |
| Manual override           | `cost_cap` override edit (admin only) |
| Cross-domain handoff      | Flag flip surfaces in domain audit ledgers via `target_id` |
| Mobile / touch variant    | Flutter flag toggle |
| Audit / notification side | `sa_audit` immutable + IP capture on every mutation |

## UK posture

* GDPR — IP & user-agent captured for audit forensics, no PII in flag/override values.
* Lawful processing — every mutation passes through role gate + audit ledger.
* Retention — `archived` status is the soft-delete; rows persist for forensics.
* Secure logging — append-only `sa_audit` enforced by trigger.
* FCA / payment safety — `cost_cap` overrides gate payouts; `kill_switch` can pause payment rails platform-wide.

## Tests

`tests/playwright/super-admin-command-center.spec.ts` — surface mount checks for the 5 internal routes.

# Domain 50 — Client and Buyer Dashboard, Spend, Proposals, and Project Oversight

**Route family**: `/app/client-dashboard`
**Module**: `apps/api-nest/src/modules/client-dashboard/`
**Schema**: `packages/db/src/schema/client-dashboard.ts`
**Migration**: `packages/db/migrations/0050_client_dashboard.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useClientOverview` | `GET /api/v1/client-dashboard/overview` |
| Spend ledger + filters | `useClientSpend` | `GET /api/v1/client-dashboard/spend` |
| Proposals queue | `useClientProposals` | `GET /api/v1/client-dashboard/proposals`, `PATCH .../status` |
| Project oversight | `useClientOversight` | `GET .../oversight`, `PATCH .../oversight/:id/status` |
| Approvals tray | `useClientApprovals` | `GET .../approvals`, `PATCH .../approvals/:id` |
| Saved items rail | `useClientSavedItems` | `GET/POST/DELETE .../saved` |

## State machines

- `client_proposals.status`: `received → shortlisted → accepted | rejected | withdrawn | expired`
  - Server enforces `PROPOSAL_TRANSITIONS` map; invalid transitions return 400.
  - Decisions snapshot `decision_at` and `decision_reason`.
- `client_oversight_projects.status`: `planning → active → at_risk | on_hold | completed | cancelled`
  - `completed` snapshots `completed_at`; every transition updates `last_activity_at`.
- `client_spend_ledger.status`: `pending → cleared | refunded | disputed` (driven by upstream payments).

## RBAC + tenancy

Every read and write is scoped by `client_identity_id = req.user.sub`. Cross-tenant
access is impossible by construction: the repository always composes
`client_identity_id = $userId` into the WHERE clause and update statements look up
ownership via `getProposal` / `getOversight` / `getApproval` before mutating.

## ML + analytics

- **Analytics** (`apps/analytics-python/app/client_dashboard.py`): `POST /client-dashboard/insights`
  returns severity-tagged operational cards from raw signals (atRisk, pendingApprovals,
  spend totals). NestJS calls this from `overview()` and falls back to a deterministic
  built-in set if the call times out (2s budget).
- **ML** (`apps/ml-python/app/client_dashboard.py`): `POST /client-dashboard/rank-proposals`
  scores proposals by amount fit, budget adherence (when supplied), duration, and
  shortlist boost. NestJS persists the score on `client_proposals.match_score`.
  Fallback: amount-normalised score with duration penalty.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/client_dashboard/`:
- Horizontally scrollable KPI tiles replace the desktop left rail.
- Proposals support swipe-right (shortlist) and swipe-left (reject) actions.
- Approvals render as cards with sticky CTA buttons (Approve / Reject).
- Oversight transitions surface through bottom sheets.

## Audit + observability

`client_dashboard_events` records every meaningful write with actor, action, target,
and a `diff` payload (`from`/`to` for transitions, decision notes for approvals).

## UK / GDPR posture

- Spend rows hold currency + status to support FCA-safe reporting; refunds and
  disputes are first-class ledger states rather than soft flags.
- Audit events store IP and user agent only when middleware injects them.
- Saved items table supports hard delete via `DELETE /saved/:id` for right-to-erasure.

## Tests

- Playwright smoke: `tests/playwright/client-dashboard.spec.ts`.
- Recommended Jest coverage to add next:
  - Proposal state-machine valid/invalid transitions.
  - Oversight state-machine valid/invalid transitions.
  - Approval double-decide is rejected with 403.
  - Overview composition handles empty spend totals deterministically.
  - ML rank fallback returns stable order when ML service is offline.

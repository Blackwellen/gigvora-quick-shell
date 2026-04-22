# Domain 55 — Shared Workspaces, Internal Notes, Cross-Team Collaboration & Handoffs

**Route family**: `/app/shared-workspaces-collaboration`
**Module**: `apps/api-nest/src/modules/shared-workspaces-collaboration/`
**Schema**: `packages/db/src/schema/shared-workspaces-collaboration.ts`
**Migration**: `packages/db/migrations/0055_shared_workspaces_collaboration.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useSwcOverview` | `GET /overview` |
| Workspaces | `useSwcWorkspaces` | `GET/POST /workspaces`, `PATCH /workspaces/:id`, `PATCH /workspaces/:id/status` |
| Members | `useSwcMembers` | `GET/POST /workspaces/:id/members`, `PATCH /workspaces/:id/members/:memberId/role`, `DELETE` |
| Notes | `useSwcNotes` | `GET/POST /workspaces/:id/notes`, `PATCH /workspaces/:id/notes/:noteId(/status)` |
| Handoffs | `useSwcHandoffs` | `GET/POST /workspaces/:id/handoffs`, `PATCH /workspaces/:id/handoffs/:handoffId(/status\|/checklist)` |
| Audit log | (controller) | `GET /workspaces/:id/audit?limit=` |

## State machines

- `swc_workspaces.status`: `active ↔ archived` (owner-only).
- `swc_notes.status`: `draft → published ↔ archived` (and back to draft); only the author, owner, or editor can transition.
- `swc_handoffs.status`: `pending → accepted | rejected | cancelled`; `accepted → completed`; `rejected/cancelled/completed` are terminal.
  - **accept / reject / complete**: only the recipient (`toIdentityId`) can perform.
  - **cancel**: only the sender (`fromIdentityId`) can perform.
  - **rejected** requires `reason` (Zod refinement).

## Authorisation invariants

- Every read and write requires active membership in the workspace (`assertMembership`).
- Workspace mutations and member role changes require role `owner` (or `editor` for non-status updates).
- Note edits beyond the author require role `owner` or `editor`.
- Handoff transitions are sender/recipient-scoped as described above.
- Org-scoping: `org_identity_id = req.user.orgId ?? req.user.sub` ensures cross-tenant isolation by construction.

## Audit

`swc_audit_events` records every meaningful write (workspace create/update/archive, member add/role/remove, note create/update/status, handoff create/transition/checklist) with actor, target, `from`/`to` diff, and request `ip` + `userAgent`.

## Analytics (no domain ML)

`apps/analytics-python/app/shared_workspaces_collaboration.py`:
- `POST /shared-workspaces-collaboration/insights` returns severity-tagged insights from
  pending-handoff backlog, overdue handoffs, stale drafts, and missing-notes signals.
- NestJS calls this from `overview()` with a 2s timeout and falls back to a deterministic built-in insight set if unavailable.

This domain has **no domain-specific ML model** — collaboration health is operational rather than predictive. Decision documented per Domain 55 brief.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/shared_workspaces_collaboration/`:
- Horizontal KPI tiles (workspaces, pending handoffs, recent notes).
- Pending handoffs: swipe-right to accept, swipe-left to reject (reason sheet).
- Notes: card list with pinned indicator + status.
- Workspaces: popup menu to archive.

## UK / GDPR posture

- Audit `ip` and `user_agent` are stored for governance; retention follows the org's audit-retention policy.
- Member personal data (full name + email) is necessary for the service per GDPR Art. 6(1)(b) (contract). Removal sets `status = removed` and `removed_at`; physical deletion is a separate compliance flow.
- Workspace, note, and handoff content stays within the tenant boundary enforced by `org_identity_id`.

## Tests

- Playwright smoke: `tests/playwright/shared-workspaces-collaboration.spec.ts`.
- Recommended Jest coverage to add next:
  - Workspace state-machine valid/invalid transitions; only owner can transition.
  - Note state-machine valid/invalid transitions; only author/owner/editor can transition or edit.
  - Handoff state-machine valid/invalid transitions.
  - Reject without reason rejected (Zod refinement).
  - Recipient-only accept/reject/complete; sender-only cancel.
  - Membership guard rejects non-members on every read and write.
  - Slug uniqueness per org.
  - RBAC isolation across `orgIdentityId`.

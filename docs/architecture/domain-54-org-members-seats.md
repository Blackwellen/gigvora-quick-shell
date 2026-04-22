# Domain 54 — Organization Members, Seats, Roles, Permission Controls

**Route family**: `/app/org-members-seats`
**Module**: `apps/api-nest/src/modules/org-members-seats/`
**Schema**: `packages/db/src/schema/org-members-seats.ts`
**Migration**: `packages/db/migrations/0054_org_members_seats.sql`

## Surfaces

| Surface | Hook | API |
|---|---|---|
| Overview KPIs + insights | `useOmsOverview` | `GET /api/v1/org-members-seats/overview` |
| Members directory | `useOmsMembers` | `GET /members`, `PATCH /members/:id/status`, `PATCH /members/:id/role` |
| Invitations | `useOmsInvitations` | `GET /invitations`, `POST /invitations`, `PATCH /invitations/:id/status` |
| Seats inventory | `useOmsSeats` | `GET /seats`, `POST /seats/:id/assign`, `POST /seats/:id/release`, `POST /seats/purchase` |
| Roles + permissions | `useOmsRoles` | `GET /roles`, `POST /roles`, `DELETE /roles/:key` |
| Audit log | (controller) | `GET /audit?limit=` |

## State machines

- `oms_members.status`: `active ↔ suspended → removed`. `suspended`/`removed` require `reason`.
- `oms_invitations.status`: `pending → accepted | revoked | expired`. Tokens unique; expire after 7d by default.
- `oms_seats.status`: `available ↔ assigned`; `locked` reserved for billing-issue states.

## Invariants enforced server-side

- **Last-owner protection**: cannot remove or demote the only active `owner` (409 `ConflictException`).
- **Seat-bound invitations**: invite requires an available seat of the requested `seatType` (409 if none).
- **Role mutability**: system roles (`owner`, `admin`, `manager`, `member`, `viewer`) cannot be modified or deleted.
- **Seat lifecycle**: removing a member auto-releases their seat; reassigning a member's seat releases the previous one first.

## RBAC + tenancy

Every read and write is scoped by `org_identity_id = req.user.sub`. Cross-tenant access is impossible by construction — every query composes `org_identity_id = $userId` and ownership lookups (`getMember`, `getSeat`, `getInvitation`, `getRoleByKey`) are required before any mutation.

## Audit

`oms_audit_events` records every meaningful write (member status, role change, invitation create/revoke, seat assign/release, seat purchase, role upsert/delete) with actor, action, target, `from`/`to` diff, and request `ip` + `userAgent`.

## Analytics (no ML required)

`apps/analytics-python/app/org_members_seats.py`:
- `POST /org-members-seats/insights` returns severity-tagged insights from
  pending invites, suspensions, seat utilisation, and bus-factor (single owner with >5 active members).
- NestJS calls this from `overview()` with a 2s timeout and falls back to a deterministic built-in insight set if unavailable.

This domain has **no domain-specific ML model**. Shared ML signals are not consumed; this is documented as a deliberate decision.

## Mobile parity (Flutter)

`apps/mobile-flutter/lib/features/org_members_seats/`:
- Horizontal KPI tiles (active, pending, suspended, seats used/total/available, roles).
- Members: popup menu for suspend / reinstate.
- Invitations: swipe-left to revoke.
- Seats: list with cost + status (assign UX deferred to web for the more complex picker).

## UK / GDPR posture

- `oms_audit_events.ip` and `user_agent` are stored for governance. Retention should follow the org's audit-retention policy (default: indefinite, with deletion-on-request supported by tenant scoping).
- Member personal data (full name + email) is necessary for the service per GDPR Art. 6(1)(b) (contract). Removal sets `status = removed` and `removed_at`; physical deletion is a separate compliance flow.
- Invitation tokens are random 24-byte hex (192 bits) and unique. They expire after 7 days and can be revoked at any time.

## Tests

- Playwright smoke: `tests/playwright/org-members-seats.spec.ts`.
- Recommended Jest coverage to add next:
  - Member state-machine valid/invalid transitions.
  - Cannot remove last owner.
  - Cannot demote last owner.
  - Suspend/remove require `reason` (Zod refinement).
  - Invite rejected when no seats available (409).
  - System roles cannot be modified or deleted.
  - Seat assignment releases previously-held seat.
  - RBAC isolation across `orgIdentityId`.

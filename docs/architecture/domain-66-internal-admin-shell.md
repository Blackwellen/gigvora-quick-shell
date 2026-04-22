# Domain 66 — Internal Admin Shell, Workspace Routing, Global Shortcuts, Queue Jump

## Surface
`/internal/admin-shell` (mounted via `InternalAdminShellPage` in `src/App.tsx`).
Reverse proxy boundary `/internal/*` keeps this off public traffic.

## Persistence
Migration: `packages/db/migrations/0074_internal_admin_shell.sql`.
Tables: `ias_workspaces`, `ias_queues`, `ias_queue_items`, `ias_shortcuts`,
`ias_shell_audit` (append-only via trigger).

## State machine — queue items
`pending → active → completed | failed | escalated | blocked`
`escalated → active | completed | failed | refunded | blocked`
`failed → active | refunded | archived`
`completed → refunded | archived`

## Backend
NestJS module `apps/api-nest/src/modules/internal-admin-shell/` exposes
`/api/v1/internal-admin-shell/*` (JWT-guarded). Includes:
- workspace routing scoped by role ladder operator < moderator < trust_safety < finance < super_admin
- deterministic queue jump with `FOR UPDATE SKIP LOCKED` row locking
- shortcut catalogue scoped by role
- append-only audit on every write
- depth + health auto-recompute on item create/transition

## Analytics
`apps/analytics-python/app/internal_admin_shell.py` POST `/insights`
returns deterministic insight cards (depth/health/role-scope) with locked envelope.
Service falls back to in-process insights when analytics is offline.

## SDK
`packages/sdk/src/internal-admin-shell.ts` — typed envelopes shared by web + mobile.

## Web hook
`src/hooks/useInternalAdminShell.ts` — `useIasOverview`, `useIasWorkspaces`,
`useIasQueues`, `useIasQueueItems`, `useIasShortcuts`, `useIasAudit`,
`useIasQueueJump`, `useIasTransitionItem`. Falls back to UI-preserving fixtures.

## Mobile
`apps/mobile-flutter/lib/features/internal_admin_shell/*` — KPI strip,
insight cards, queue list, FAB queue-jump action with snackbar feedback.

## Tests
- Playwright: `tests/playwright/internal-admin-shell.spec.ts` — 9 internal route mounts.
- Service-level deterministic queue jump is pure SQL (FOR UPDATE SKIP LOCKED) → snapshotable.

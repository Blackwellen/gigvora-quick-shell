# Domain 01 — Global Shell, Navigation, Workspace Orchestration

## Status: build complete · integration partial · validation partial

### What ships in this domain pack

| Layer        | File / surface                                                    |
|--------------|-------------------------------------------------------------------|
| DB schema    | `database/migrations/0003_workspace_shell.sql`                    |
| Seeders      | `database/seeders/0002_seed_shell.sql`                            |
| NestJS       | `apps/api-nest/src/modules/workspace/*` (5 controllers, service, repo, audit, DTOs) |
| SDK          | `packages/sdk/src/index.ts` — `shell`, `orgs`, `savedViews`, `recents` |
| Web wiring   | `src/contexts/WorkspaceContext.tsx` (live-backed with offline fallback) |
| Web bridge   | `src/lib/gigvora-sdk.ts` (singleton + `sdkReady()`)               |
| Flutter      | `apps/mobile-flutter/` (replaces Expo stub)                       |
| Analytics    | `apps/analytics-python/app/shell.py` — insight cards + anomaly hints |
| Tests        | `apps/api-nest/test/workspace.service.spec.ts`, `apps/analytics-python/tests/test_shell.py`, `apps/mobile-flutter/test/shell_bootstrap_test.dart`, `tests/playwright/shell.spec.ts` |

### API contracts

```
GET    /api/v1/shell/bootstrap         → { orgs, prefs, savedViews, recents, nav, version }
GET    /api/v1/shell/prefs             → ShellPrefs | null
PATCH  /api/v1/shell/prefs             → ShellPrefs
GET    /api/v1/orgs                    → Org[]
POST   /api/v1/orgs                    → Org
GET    /api/v1/saved-views             → SavedView[]
POST   /api/v1/saved-views             → SavedView
PATCH  /api/v1/saved-views/:id         → SavedView
DELETE /api/v1/saved-views/:id         → { ok: true }
GET    /api/v1/recents                 → RecentItem[]
POST   /api/v1/recents                 → { ok: true }
```

All routes guarded by `AuthGuard('jwt')`. Mutations write to `audit_events`.

### State machines

- **Org**: `active → paused → archived`; `active → suspended` (admin only)
- **Membership**: `pending → active → suspended → removed`
- **Saved view**: implicit (create / pin / position / archive via delete)

### Logic-path coverage

| Path                       | Implemented | Evidence                                  |
|----------------------------|-------------|-------------------------------------------|
| Primary entry (`/feed`)    | ✅          | `LoggedInShell`, `MobileBottomNav`        |
| Bootstrap happy path       | ✅          | `WorkspaceService.bootstrap`              |
| Offline / degraded         | ✅          | `WorkspaceContext` falls back to fixtures |
| Role switch + audit        | ✅          | `updatePrefs` → `shell.role.switch`       |
| Org switch + audit         | ✅          | `updatePrefs` → `shell.org.switch`        |
| Saved view CRUD            | ✅          | 4 controller methods, optimistic UI       |
| Recent rolling window (50) | ✅          | `trackRecent` transaction                 |
| Mobile parity              | ✅          | Flutter bottom nav + drawer + sheets      |
| Analytics anomaly          | ✅          | `/shell/insights` role-thrash card        |

### Known gaps (carry forward to Domain 02 & beyond)

- `AuthContext` still on Supabase. Will be migrated when the Auth & Identity domain pack runs (depends on a real `/auth/*` JWT issuer + refresh rotation).
- `RoleContext` still mock-only; live role entitlements need entitlement service from the Billing/Plans domain.
- Nav tree currently returns `null` from `nav_config`; per-role override editor lives in the future Admin Console domain.
- Webhook gateway not yet emitting `shell.*` events outbound — wired when external integrations subscribe.

### Local run

```bash
# DB
docker compose -f infrastructure/compose/docker-compose.yml up -d postgres
psql $DATABASE_URL -f database/migrations/0003_workspace_shell.sql
psql $DATABASE_URL -f database/seeders/0002_seed_shell.sql

# API
cd apps/api-nest && npm install && npm run start:dev

# Web (live-backed)
VITE_GIGVORA_API_URL=http://localhost:3000 npm run dev

# Flutter
cd apps/mobile-flutter && flutter pub get && flutter run \
  --dart-define=GIGVORA_API_URL=http://10.0.2.2:3000
```

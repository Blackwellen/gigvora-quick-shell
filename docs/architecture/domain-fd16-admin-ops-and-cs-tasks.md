# Domain — FD-16 Closure (Admin Ops + CS Tasks)

## Storage location
All tables live in the user's own Postgres (`DATABASE_URL`).
Migration: `packages/db/migrations/0087_admin_ops_master_crud.sql`.

## Surfaces

| Layer | Path |
|---|---|
| Migration | `packages/db/migrations/0087_admin_ops_master_crud.sql` |
| Admin Ops module | `apps/api-nest/src/modules/admin-ops/*` |
| CS Tasks repo (extends CS module) | `apps/api-nest/src/modules/customer-service/cs-tasks.repository.ts` |
| Frontend hooks | `src/hooks/useAdminOps.ts`, `src/hooks/useCsTasks.ts` |

## Tables
- `admin_ops_companies`, `admin_ops_users`, `admin_ops_mentors` — master CRUD
- `admin_ops_audit` — append-only per-row audit (UPDATE/DELETE blocked by trigger)
- `cs_tasks` — delegated CS tasks queue (priority + status state machine)

## NestJS HTTP surface

### `/api/v1/admin-ops`
| Method | Path | Role |
|---|---|---|
| GET  | `/companies` `/users` `/mentors` | read |
| GET  | `/{entity}/:id` | read (incl. audit history) |
| POST | `/{entity}` | write (upsert) |
| POST | `/bulk` | write (suspend/reinstate/archive/watch/verify/reject) |

### `/api/v1/customer-service` (extension)
| Method | Path | Role |
|---|---|---|
| GET  | `/tasks` | operator+ |
| POST | `/tasks` | operator+ |
| PATCH | `/tasks` | operator+ |

## Security
- Read = `viewer | operator | admin_ops | super_admin | trust_safety_admin`
- Write = `admin_ops | super_admin`
- Every mutation writes to `admin_ops_audit` with actor / IP / UA before/after.
- CS tasks restricted to operator role ladder (agent / lead / trust_safety / super_admin).

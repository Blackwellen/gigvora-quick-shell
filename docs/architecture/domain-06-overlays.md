# Domain 06 — Pop-ups, Drawers, Follow-Through Windows, Detached Views

## Mission
Make every overlay a first-class, persistable surface so journeys survive
refresh, deep-link, and cross-domain handoffs (e.g. checkout → review prompt
→ next-action).

## Surfaces
| UI primitive            | `kind` enum         | Mobile mapping                  |
|-------------------------|---------------------|---------------------------------|
| Modal / Confirmation    | `modal`,`confirmation` | full-screen alert dialog     |
| Side drawer             | `drawer`            | DraggableScrollableSheet        |
| Bottom sheet            | `sheet`             | bottom sheet                    |
| Popover / hovercard     | `popover`,`hovercard` | tap-and-hold context menu     |
| Wizard (multi-step)     | `wizard`            | PageView + sticky CTA           |
| Inspector / Quick prev. | `inspector`,`quick_preview` | bottom sheet            |
| Detached window         | `detached_window`   | foreground tab + push channel   |

## API Surface (`/api/v1/overlays`)
- `POST /`                          → open overlay (returns id)
- `GET /`                           → list open overlays for current user
- `GET /:id`                        → rehydrate
- `PATCH /:id`                      → patch payload / dismiss / complete
- `POST /workflows`                 → start follow-through workflow
- `GET /workflows`                  → list user workflows
- `GET /workflows/:id`              → workflow + step rows
- `POST /workflows/:id/advance`     → advance to next step
- `POST /windows`                   → register/upsert detached window
- `POST /windows/:channel/ping`     → heartbeat + state sync
- `DELETE /windows/:channel`        → close

## Workflow templates
Defined in `overlays.service.ts`:
- `purchase_followup` — `checkout_success → receipt_view → review_prompt → next_action`
- `mfa_recovery`      — `identify → challenge → reset → complete`
- `onboarding_continue` — `resume_prompt → step → review → complete`
- `publish_object`    — `draft_review → compliance_check → publish → share_prompt`

Adding a template = one line in `WORKFLOW_TEMPLATES`.

## State machines
- `overlay_sessions.status`: `pending → open → (dismissed | completed | expired | failed | escalated)`
- `overlay_workflows.status`: `draft → active → (completed | failed | cancelled | expired | paused)`
- `overlay_workflow_steps.status`: `pending → open → (completed | dismissed | failed)`

## Persistence
- `overlay_sessions` — every panel write
- `overlay_workflows` + `overlay_workflow_steps` — follow-through
- `detached_windows` — torn-off browser windows (BroadcastChannel registry)
- `overlay_audit` — compliance trail

## Analytics
`POST /overlays/insights` (FastAPI) — deterministic ranking of high-abandonment
surfaces. No model required; safe fallback included.

## Mobile parity
`apps/mobile-flutter/lib/features/overlays/overlays_api.dart` mirrors the seven
endpoints. Detached windows degrade to a registered push channel (no native
multi-window on mobile).

## Tests
- Jest: `apps/api-nest/test/overlays.service.spec.ts` — open, patch ownership,
  audit on terminal status, workflow start, window ping.
- Pytest: `apps/analytics-python/tests/test_overlays.py` — insights ranking.
- Playwright: `tests/playwright/overlays.spec.ts` — palette + endpoint mount.

## ML posture
No predictive model. Domain consumes the shared search/identity ML signals only
as optional hints (e.g. risk band on detached window pings). Always falls back
to deterministic SQL queries.

## Completion gate
- ✅ Build: migration + seeder + NestJS module + DTOs
- ✅ Integration: SDK namespace `sdk.overlays.*`, Flutter parity, controller mounted in `AppModule`
- 🟡 Validation: Jest + pytest + Playwright suites added; full e2e wiring of every existing drawer to the new endpoints is the next pass

## Mobile screens

- `apps/mobile-flutter/lib/features/overlays/overlays_api.dart` — Dio client (Idempotency-Key on writes that need replay safety)
- `apps/mobile-flutter/lib/features/overlays/overlays_providers.dart` — Riverpod providers (autoDispose)
- `apps/mobile-flutter/lib/features/overlays/overlays_screens.dart` — Screens registered at: /overlays, /overlays/workflows/:id

All screens use `AsyncStateView` for loading/empty/error/success.

## Enterprise posture

- **Pagination envelope**: list endpoints return `{ items, total, limit, hasMore }`.
- **Audit**: state changes recorded in domain audit table.
- **RBAC**: ownership checks in service layer.
- **Idempotency**: write endpoints accept `Idempotency-Key` header.
- **Error envelope**: standard `{ error: { code, message } }` via `ErrorEnvelopeFilter`.

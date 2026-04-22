# Domain 37 — Project Workspaces & Handover

Auto-mints a workspace whenever D36 (`csa.contract.activated`) activates a
contract. Owns milestones, deliverables, the handover checklist, and the
final close-out report. Escrow release is **out of scope** for D37 — it stays
owned by D34 (`proposal-builder-bid-credits`) plus the future delivery +
dispute domains.

## Layers

| Layer | Path |
| --- | --- |
| NestJS module | `apps/api-nest/src/modules/project-workspaces-handover/` |
| AppModule wiring | `apps/api-nest/src/app.module.ts` |
| Outbound webhooks union | `apps/api-nest/src/modules/outbound-webhooks/outbound-webhooks.publisher.ts` (`pwh.*`) |
| SDK | `packages/sdk/src/project-workspaces-handover.ts` (subpath `@gigvora/sdk/project-workspaces-handover`) |
| React hooks | `src/hooks/useProjectWorkspacesHandover.ts` |
| Python analytics | `apps/analytics-python/app/project_workspaces_handover.py` (mounted in `app/main.py`) |
| Flutter client | `apps/mobile-flutter/lib/features/project_workspaces_handover/project_workspaces_handover_api.dart` |
| Playwright spec | `tests/playwright/project-workspaces-handover.spec.ts` |

## State machine

```
kickoff ──▶ active ──▶ in-review ──▶ handover ──▶ closed
                              ↘ on-hold | cancelled
```

* `in-review` is set automatically once **every** milestone reaches `accepted`.
* `closed` is only reachable when **every** handover checklist item is `done`
  AND the final report has been published.
* `on-hold` and `cancelled` are reachable from any non-terminal state.

## Milestone state machine + concurrency

```
pending ──▶ in-progress ──▶ submitted ──▶ accepted
                                       ↘ rejected ──▶ in-progress
```

Every milestone exposes a `version` integer. Transition requests must include
the `expectedVersion`; mismatches return `version_conflict` so concurrent
edits never overwrite each other silently.

## Handover checklist

Six default items minted with each workspace:

* `credentials-rotated`
* `access-revoked`
* `assets-transferred`
* `docs-handed-over`
* `final-report-signed-off`
* `retainer-confirmed`

`workspaces/close` requires every item to be `done` before the workspace can
move to `closed`.

## Cross-domain handoffs

* **Inbound:** subscriber listens for `csa.contract.activated` on the
  in-process `domainBus`, snapshots the contract milestones + parties, and
  mints a workspace with `idempotencyKey = mint-from-contract-${contractId}`
  so replays are safe.
* **Outbound:** ~20 `pwh.*` events are added to `WebhookEvent` and emitted by
  `D37Emit` (`workspace.minted`, `milestone.accepted`, `deliverable.submitted`,
  `handover.started`, `final-report.published`, `workspace.closed`, …).
* **Not wired here:** escrow release, payment capture, dispute opening. D37
  deliberately stops at `closed` and defers payment + disputes to their owning
  domains.

## Idempotency

| Action | Key prefix | Stored on repo |
| --- | --- | --- |
| `mintFromContract` | `mint-from-contract-${contractId}` | `idemMint` |
| `submitDeliverable` | client-supplied (`deliv-…`) | `idemDeliverable` |
| `closeWorkspace` | client-supplied (`close-…`) | `idemClose` |

Replays return the original row instead of mutating state.

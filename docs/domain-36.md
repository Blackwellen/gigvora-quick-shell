# Domain 36 — Contracts, SoW, Terms Acceptance & Signature Follow-Through

Auto-mints contracts when D35 (`praa.award.closed`) closes an award and runs the
native click-to-sign signature ledger.  Escrow release is **out of scope** for
D36 — it remains owned by D34 (`proposal-builder-bid-credits`) plus the future
delivery + dispute domains.

## Layers

| Layer | Path |
| --- | --- |
| NestJS module | `apps/api-nest/src/modules/contracts-sow-acceptance/` |
| AppModule wiring | `apps/api-nest/src/app.module.ts` |
| Outbound webhooks union | `apps/api-nest/src/modules/outbound-webhooks/outbound-webhooks.publisher.ts` (`csa.*`) |
| SDK | `packages/sdk/src/contracts-sow-acceptance.ts` (subpath `@gigvora/sdk/contracts-sow-acceptance`) |
| React hooks | `src/hooks/useContractsSowAcceptance.ts` |
| Python analytics | `apps/analytics-python/app/contracts_sow_acceptance.py` (mounted in `app/main.py`) |
| Flutter client | `apps/mobile-flutter/lib/features/contracts_sow_acceptance/contracts_sow_acceptance_api.dart` |
| Playwright spec | `tests/playwright/contracts-sow-acceptance.spec.ts` |

## State machine

```
draft ──▶ sent ──▶ partially-signed ──▶ signed ──▶ active
                ├──▶ rejected
                ├──▶ cancelled
                └──▶ expired
active ──amend──▶ superseded
```

* `signed` flips automatically to `active` once **every** party row has a signature.
* `superseded` is set on the prior contract whenever `amend` mints a successor.

## Click-to-sign ledger

Each signature row captures `partyId`, `typedName`, `capturedIp`, `capturedUa`,
`capturedAt`, plus a `prevHash`/`hash` pair.  The `hash` is

```
sha256(prevHash || partyId || typedName || capturedAt || capturedIp || capturedUa || contractContentHash)
```

This produces an append-only chain that `POST /contracts/verify-hash` can recompute
to detect tampering — required for FCA + UK GDPR audit trails.

Sequenced multi-party signing is enforced: a party with `signOrder = N` cannot
sign until every party with `signOrder < N` already has.  Out-of-order attempts
return `out_of_order_signature`.

## Cross-domain handoffs

* **Inbound:** subscriber listens for `praa.award.closed` on the in-process
  `domainBus`, snapshots the award + proposal milestones, and mints a contract
  with `idempotencyKey = mint-from-award-${awardId}` so replays are safe.
* **Outbound:** ~22 `csa.*` events are added to `WebhookEvent` and emitted by
  `D36Emit` (`contract.minted`, `contract.sent`, `signature.captured`,
  `contract.activated`, `ledger.appended`, …).
* **Not wired here:** escrow release.  D36 deliberately stops at `active` and
  defers payment + delivery + disputes to their owning domains.

## Idempotency

| Action | Key prefix | Stored on repo |
| --- | --- | --- |
| `mintFromAward` | `mint-from-award-${awardId}` | `idemMint` |
| `sign` | client-supplied (`sign-…`) | `idemSign` |
| `amend` | client-supplied (`amend-…`) | `idemAmend` |

Replays return the original row instead of mutating state.

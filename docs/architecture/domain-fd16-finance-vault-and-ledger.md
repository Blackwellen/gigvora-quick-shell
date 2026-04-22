# Domain — FD-16 Finance Closure (Vault + Ledger)

## Storage location (CRITICAL)

All tables live in the **user's own Postgres** (`DATABASE_URL`), NEVER in
Lovable Cloud. Migration: `packages/db/migrations/0085_finance_vault_and_ledger.sql`.

## Surface

| Layer | Path |
|---|---|
| Migration | `packages/db/migrations/0085_finance_vault_and_ledger.sql` |
| Encryption | `apps/api-nest/src/modules/finance-admin/finance-vault.crypto.ts` |
| Repo | `apps/api-nest/src/modules/finance-admin/finance-vault.repository.ts` |
| Service | `apps/api-nest/src/modules/finance-admin/finance-vault.service.ts` |
| Controller | `apps/api-nest/src/modules/finance-admin/finance-vault.controller.ts` |
| Frontend hook | `src/hooks/useFinanceVault.ts` |

## Tables

### `bank_details_vault`
Per-owner encrypted bank record. AES-256-GCM envelope encryption on
`account_number`, `sort_or_routing`, `iban`. Display fragments stored:
`account_last4`, `fingerprint` (deterministic, salted SHA-256 prefix for
duplicate-account detection). `key_version` enables in-place rotation.

### `bank_details_reveal_events` (append-only)
FCA-safe audit trail. Every reveal must include a `reason` (4–500 chars),
the exact `fields_revealed`, the actor's role, IP, UA, session id. Trigger
blocks any UPDATE/DELETE.

### `ledger_accounts`
Held-credits / commission / ad-spend separation enforced by the `bucket`
CHECK: `available`, `held_credits`, `escrow`, `commission_payable`,
`commission_revenue`, `ad_spend_prepaid`, `ad_spend_consumed`,
`subscription_revenue`, `tax_payable`, `refund_payable`,
`safeguarded_client_funds`, `platform_revenue`, `suspense`.

### `ledger_journal_entries` + `ledger_journal_lines` (append-only)
Double-entry journal. A DEFERRED constraint trigger asserts every entry
balances (Σ debits = Σ credits) and materializes account balances
atomically. Reversals are posted as new entries pointing back via
`reversed_by` — never edits.

## NestJS HTTP surface (`/api/v1/finance-vault`)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET  | `/bank` | finance read | List vault rows (no plaintext) |
| POST | `/bank` | fin_admin / super_admin | Create vault record (encrypts in flight) |
| POST | `/bank/:id/reveal` | fin_admin / super_admin | Reveal selected fields; audit row written first |
| GET  | `/bank/:id/reveals` | finance read | Reveal history |
| POST | `/bank/:id/verify` | fin_admin / super_admin | Mark verified |
| POST | `/bank/:id/archive` | fin_admin / super_admin | Archive |
| GET  | `/ledger/accounts` | finance read | List accounts |
| POST | `/ledger/accounts` | fin_admin / super_admin | Ensure account exists |
| POST | `/ledger/entries` | fin_admin / super_admin | Post balanced entry (idempotent on `reference`) |
| GET  | `/ledger/entries` | finance read | Recent entries with lines |
| GET  | `/ledger/trial-balance` | finance read | Per-bucket totals |

## Security guarantees

- Vault PII never reaches the frontend except through `POST /bank/:id/reveal`,
  and that path writes the audit row **before** decrypting.
- Ledger is provably immutable (DB triggers); only forward-fix entries allowed.
- All endpoints require JWT + finance role; reveal is restricted further to
  `fin_admin` / `super_admin`.
- Encryption root key is shared with the master-settings backbone, rotated
  via the super-admin two-person flow.

# Security & Compliance Baseline

## Identity

- Argon2/bcrypt password hashing (cost ≥ 12)
- JWT access (15 min) + refresh (30 day, rotated, revocable)
- MFA TOTP (RFC 6238); recovery codes encrypted at rest
- Lockout after 5 failed attempts (15 min cooldown)

## Authorization

- RBAC via `user_roles` table; ABAC for org-scoped resources
- Server-side checks on every mutation; UI gates are advisory only

## Data

- TLS 1.2+ everywhere; HSTS on api-nest
- Postgres at-rest encryption (managed)
- PII columns flagged in audit_log; right-to-erasure handled by `users.deleted_at`

## Webhooks

- HMAC-SHA256 signature verification (per-provider secret)
- Replay window: 5 minutes; event-id dedupe via Redis SETNX 24h
- All inbound events persisted to `webhook_events`

## Payments

- Stripe in restricted-key mode; webhooks verified
- No PAN ever stored locally; all card data tokenized
- FCA-aware: clear settlement records, hold/release events on milestones
- No internal wallet we only use in site ledger wallet for compliance

## Audit

- `audit_log` table records actor, action, target, meta, timestamp
- Append-only; nightly snapshot to S3 (governed bucket)

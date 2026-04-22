# FD-07 — Encryption, Secrets, Data at Rest/In Transit & Secure Storage Governance — Run 1 Audit

Date: 2026-04-18 · Group: G2 · Maps to **Master Sign-Off Matrix → G12 (security/compliance)** + G05 (real-data persistence — encrypted columns), G02 (no plaintext secrets in repo). Builds on FD-01 (JWT/refresh), FD-04 (validation), FD-05 (signed URLs), FD-06 (RLS + backups).

> **Platform constraint reminder** — backend rate-limiting primitives are not available; this audit therefore omits per-IP/per-token rate-limit recommendations on key-issuance/decryption endpoints. Throughput defense for KMS-decrypt calls is scoped to (a) per-process LRU cache of decrypted keys with bounded TTL, (b) per-service connection-pool caps, and (c) bounded BullMQ worker concurrency.

## 1. Business & technical purpose
Guarantee that **every byte of sensitive data is encrypted in transit and at rest**, that **every secret in the system is held only in a managed secret store (never the repo, never `.env` checked in, never a default fallback in code)**, and that **every sensitive column** — payment credentials, payout/bank details, BYOK API keys, OAuth refresh tokens, webhook signing secrets, MFA seeds, KYC document references, internal operator API keys, audit-export blobs — is **sealed with envelope encryption** (data-encryption key encrypted by a KMS-held key-encryption key) so that a Postgres dump or backup leak does not expose plaintext. In parallel, prove that **logs, jobs, analytics exports, and admin reports never echo the plaintext** of any sensitive field, that **signed URLs have minimum-viable TTLs**, that **secret rotation has a documented runbook with no-downtime path**, and that **transport is TLS-everywhere** (no plaintext between SSR ↔ api-nest, api-nest ↔ Postgres, api-nest ↔ Redis, api-nest ↔ R2/S3, workers ↔ AV scanner).

## 2. Inventory snapshot

### Wins already in place ✅
- **Password hashing**: `apps/api-nest/src/modules/auth/auth.service.ts:16` uses `bcrypt.hash(password, 12)`. Cost factor 12 is acceptable for 2026; `argon2id` is the modern preference but bcrypt 12 is not a release blocker.
- **Webhook signature verification (multiple sites with timing-safe compare)**:
  - `apps/webhook-gateway/src/index.ts:24` — `crypto.createHmac('sha256', secret)` + `crypto.timingSafeEqual(...)` ✅.
  - `apps/api-nest/src/modules/outbound-webhooks/outbound-webhooks.publisher.ts:286` — same pattern ✅.
  - `apps/integrations/src/voice/livekit.ts:88` — `base64url` HMAC ✅.
  - `apps/api-nest/src/modules/identity/identity.service.ts:232` — TOTP step uses `createHmac('sha1')` (TOTP standard requires SHA-1; correct).
- **Stripe webhook secret** read from env: `apps/webhook-gateway/src/index.ts:16`.
- **Schema intent for sealed secrets** is *declared* (good architectural sign):
  - `packages/db/src/schema/auth.ts:67` — `secretCiphertext: text('secret_ciphertext')` (MFA seed).
  - `packages/db/src/schema/integrations.ts:40` — `secretCiphertext: text('secret_ciphertext'), // KMS-sealed`.
  - `packages/db/src/schema/outbound-webhooks.ts:20` — `signingSecretCiphertext: text('signing_secret_ciphertext').notNull()`.
- **Signed URL TTLs**: `apps/media-pipeline/src/index.ts:22,25` — both PUT and GET signed URLs use `expiresIn: 900` (15 min).
- **JWT TTLs**: access token 15 min, refresh token 30 d (`auth.service.ts:57-58`).

### 🚨 Blocking gaps

#### Encryption — application layer
- `grep "@aws-sdk/client-kms|aws-kms|gcp-kms|crypto.createCipheriv|aes-256-gcm|libsodium|node-forge|sodium-native|@google-cloud/kms"` → **zero hits** anywhere in `apps/` or `packages/`.
- The schema columns named `secret_ciphertext` / `signing_secret_ciphertext` are **declared as sealed but there is no encrypt/decrypt code in the repo to seal or unseal them.** Today they are either unwritten (writes never happen) or written as plaintext under a "ciphertext" column name. Either way: P0.
- No envelope-encryption helper (`encryptWithDataKey()` / `decryptWithDataKey()`).
- No KMS adapter (`apps/integrations/src/crypto/kms.ts` is missing).
- No key-id column alongside ciphertext columns — needed for key rotation (so rows encrypted under key v1 can be decrypted while new writes use v2).

#### Encryption — database layer
- `grep "pgcrypto|pgp_sym_encrypt|pgp_pub_encrypt|crypt\\("` → **zero hits**.
- No `CREATE EXTENSION pgcrypto` in any migration.
- No row-level encryption fallback for columns that the application layer cannot reach (e.g., backup-readable tables).

#### Secrets hygiene — JWT_SECRET fallback (CRITICAL)
- **`process.env.JWT_SECRET ?? 'dev-secret-change-me'` appears in 17 module files** (`agency`, `auth`, `companies`, `entitlements`, `events`, `feed`, `groups`, `identity`, `inbox`, `network`, `notifications`, `overlays`, `profiles`, `search`, `settings`, `trust`, plus `jwt.strategy.ts`).
  - If `JWT_SECRET` is unset (or accidentally falsy) in any environment, **every JWT in the platform is signed with the literal string `dev-secret-change-me`** — an attacker who reads this audit can forge an admin token in 5 lines of Node.
  - This is also a **distributed config bug**: 17 places to change if the secret rotates. Should be `JwtModule.registerAsync({ useFactory: jwtFactory })` once in a shared module.
- **JWT algorithm is unspecified** → defaults to `HS256` (symmetric, shared-secret). For multi-service trust, prefer **asymmetric signing (`RS256` or `ES256`)**: api-nest signs with private key; SSR Worker, mobile, and admin terminal verify with public key. Compromise of any verifier no longer enables forgery.
- Every JWT module re-imports the same secret rather than reading it from a centralised, validated config (`@nestjs/config` + Zod schema rejecting startup if `JWT_SECRET` is missing or shorter than 64 chars).

#### Secrets hygiene — `.env` files in repo
- `find . -name ".env*"` returns:
  - `./.env` ⚠️ — committed to repo? Check.
  - `./infrastructure/env/.env.example` ✅ (example file — fine if it has no real values).
- **`.gitignore` does not contain `^\\.env`** (`grep ".env" .gitignore` returned nothing). If `./.env` contains real values and is tracked, this is **P0 secret exposure**.

#### Secrets hygiene — defaults in code
- The pattern `process.env.X ?? 'dev-...'` is dangerous everywhere; `process.env.STRIPE_SECRET_KEY` is at least *guarded* (`if (process.env.STRIPE_SECRET_KEY) stripeAdapter.configure(...)` at `apps/integrations/src/payments/stripe.ts:17`), but the JWT case is not — it silently falls through to the hard-coded dev secret.

#### Plaintext leak risk (logs/jobs/analytics/exports)
- `grep "logger\\.(info|debug|warn|error).*\\$\\{(req|body|dto|password|token|secret|key)"` → no current matches in the templated style, **but** there is no central log-redaction middleware. A future PR that does `logger.error('failed', { dto })` will leak any sensitive field that ever lands in a DTO. Need a global Pino redactor or NestJS interceptor that walks objects and replaces the values of keys matching `/^(password|secret|token|api_?key|signing_?secret|refresh_?token|access_?token|client_?secret|webhook_?secret|bank_account|iban|sort_code|routing_number|tax_id|ssn|nin|card_?number|cvv|cvc)$/i` with `'[REDACTED]'`.
- No deny-list for analytics-python exports or admin CSV exports.

#### Sensitive columns not yet protected
- `packages/db/src/schema/billing-invoices-tax.ts:21` — `taxId: text('tax_id'), // VAT, EIN, UTR, …` is **plaintext**. UTR + NI/SSN are GDPR-special-category-adjacent; should be encrypted at the column level (or stored via tokenization in a third-party tax provider).
- Bank/payout columns (`bank_account`, `iban`, `sort_code`, `routing_number`) are not visible in the schema grep — likely they are not yet modelled, **or** they are buried in a payout table this grep did not surface. Either way, the encryption pattern must be locked down before payouts go live.
- BYOK API keys: `secret_ciphertext` column exists, but with no encrypt code, BYOK keys cannot be safely stored.

#### Transport
- TLS posture between services not visible from the audit; need verification:
  - SSR Worker → api-nest: must be HTTPS.
  - api-nest → Postgres: must use `sslmode=require` or `verify-full` with cert pinning.
  - api-nest → Redis: must use TLS (`rediss://`) if Redis is over the network.
  - api-nest → R2/S3: TLS by default.
  - api-nest → SMTP/SES: `STARTTLS`.
  - api-nest → AV scanner: TLS or socket-domain only.
- HSTS preload eligibility is FD-05 #11 (already flagged).

#### Backup encryption
- FD-06 P0 #7 already flagged that backup tooling is absent. Once added, backups MUST be encrypted with a KMS-held key independent from the DB-at-rest key (defence in depth — a single key compromise does not unlock both live data and backups).

#### Secret rotation runbook
- **No runbook exists** for rotating: `JWT_SECRET` (or RS256 keypair), `LOVABLE_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, BYOK provider keys, KMS data keys, S3/R2 access keys, DB credentials, OAuth client secrets, SMTP creds. Without a runbook, a leaked credential triggers panic-driven downtime.
- No "kill-switch" pattern (force all sessions to re-auth on JWT key rotation).

#### Mobile (Flutter)
- Platform constraint: secrets must be in **Keychain (iOS) / Keystore (Android)** never `SharedPreferences`. `flutter_secure_storage` is the standard binding. Need to audit each `apps/mobile-flutter/lib/features/*/api.dart` to confirm token storage path.
- Certificate pinning (HPKP-equivalent for mobile) — recommended for Recruiter Pro / Enterprise tiers given the data sensitivity.

## 3. Findings

### 🚨 P0 (release blockers)
1. **`JWT_SECRET` falls back to literal `'dev-secret-change-me'` in 17 module files**. Any forgotten env var = total platform compromise. Refactor to `@nestjs/config` with **Zod-validated startup** that **throws** if `JWT_SECRET` is missing/short/weak; centralise into one `AuthSharedModule`; switch default algorithm to **`RS256`** (private key in api-nest only, public key for verifiers).
2. **No application-layer encryption code exists** despite schema columns named `secret_ciphertext` / `signing_secret_ciphertext`. BYOK keys, MFA seeds, outbound-webhook signing secrets cannot be safely stored. Build envelope-encryption helper + KMS adapter (provider-agnostic; cloud-KMS in prod, libsodium/local-key in dev).
3. **`./.env` exists at repo root and `.gitignore` does not list `.env`** — verify whether it is committed and what it contains. If committed with real values: **rotate everything immediately**.
4. **`pgcrypto` extension is not installed** — even where the application layer can decrypt, having a DB fallback (`pgp_sym_encrypt`) for emergency reads or admin tooling is missing.
5. **No log redaction middleware** — first time anyone logs a DTO containing a token/password/secret, it lands in production logs and (per FD-03) in `audit_log_entries`. Install Pino redaction (or NestJS global logging interceptor) with a hard-coded deny-key list.
6. **No secret-rotation runbook** — must cover JWT keypair (with grace-period dual-verify window), KMS data keys (with re-encrypt batch), DB credentials, third-party API keys (Stripe, BYOK providers), S3/R2 keys.
7. **`tax_id` stored plaintext** (`billing-invoices-tax.ts:21`). Promote to encrypted column with deterministic hash sidecar for indexing (`tax_id_lookup_hash bytea`).
8. **No key-id column alongside `*_ciphertext` columns** — without key id, key rotation is impossible (cannot identify which rows are sealed under which key version).
9. **JWT algorithm not pinned** — defaults to HS256; pin to RS256 with explicit `algorithms: ['RS256']` on the verifier (defends against `alg: none` and `alg: HS256` confusion attacks where the verifier accepts the public key as an HMAC secret).
10. **No transport TLS pinning audit** — Postgres/Redis/AV scanner connection strings must be verified to use TLS.
11. **No BYOK at-rest test harness** — without a Playwright test that writes a BYOK key, restarts the worker, and reads it back through the decrypt path, "BYOK is encrypted" is unverifiable.
12. **Backup encryption strategy undefined** (depends on FD-06 #7 backup tooling landing first).
13. **Refresh-token storage scheme unspecified** — a refresh token IS a secret. It must be stored hashed (sha256) in the `session_registry` (FD-01 carry-over), never plaintext. Audit the FD-01 build pack to confirm this.

### P1
14. Migrate from `bcrypt` → `argon2id` for new password hashes (keep bcrypt verifier for legacy hashes; lazy rehash on next successful login).
15. No HSM/cloud-KMS strategy documented (which provider, which key policy, who can decrypt under break-glass, dual-control for sensitive ops).
16. No "envelope" pattern docs for engineers — common implementation pitfall: people store the DEK alongside the data and call it encrypted.
17. No periodic re-encryption job ("rotate DEKs every 90 days, re-encrypt rows in batches with both versions readable for 14 d").
18. Mobile: confirm all tokens use `flutter_secure_storage`; document required iOS Keychain access groups for biometric re-auth.
19. No PII encryption keys per tenant for enterprise customers (BYOK-encryption-key tier — "we cannot read your data" claim).
20. Signed URL TTL of 15 min is acceptable for upload but **too long for download of authenticated PII** — drop to 5 min for download per FD-05 #6.
21. No "Clear-Site-Data: storage" on logout to evict any IndexedDB cache (cross-cuts FD-05 #24).
22. No format-preserving tokenization for fields that need to look like the original (e.g. last-4 of card, first-letter-of-IBAN) for UI display while plaintext lives in PCI-scoped vault.
23. No dual-key-encryption for the most sensitive operator secrets (incident-response-only break-glass keys).
24. No CI gate that scans the repo for secret-shaped strings (gitleaks/trufflehog) on every PR.

### P2
25. No alerting on KMS Decrypt-error rate spikes (early signal of attack or rotation gone wrong).
26. No annual disaster-recovery exercise on the encryption layer (KMS region failover, key restore from escrow).
27. No documented data-erasure crypto-shred path (rotate the DEK + delete the old DEK = effectively erases all records under that DEK without per-row DELETEs).

## 4. Run 2 build priorities (FD-07 only)

**Repo & secret hygiene**
1. Inspect `./.env`. If it contains any non-placeholder value, **rotate every credential it lists** (Stripe, JWT, BYOK, R2/S3, DB, Redis). Add `.env` and `.env.*` (except `.env.example`) to `.gitignore`. Document the policy in `docs/security/secrets-policy.md`.
2. Add `gitleaks` (or equivalent) to CI; fail PRs that introduce strings matching JWT/AWS/Stripe/Slack/GitHub secret patterns.

**Centralised config**
3. New `apps/api-nest/src/config/env.config.ts` — Zod schema for every env var (`JWT_PRIVATE_KEY_PEM`, `JWT_PUBLIC_KEY_PEM`, `JWT_KID`, `KMS_PROVIDER`, `KMS_KEY_ID`, `DATABASE_URL`, `REDIS_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LOVABLE_API_KEY`, `S3_*`/`R2_*`, `SES_*`/`SMTP_*`). `ConfigModule.forRoot({ validate })` throws at startup if any required var is missing/weak.
4. New shared `AuthSharedModule` exporting a single `JwtModule.registerAsync({ useFactory })` configured for **`RS256`** (`privateKey: env.JWT_PRIVATE_KEY_PEM`, `publicKey: env.JWT_PUBLIC_KEY_PEM`, `signOptions: { algorithm: 'RS256', issuer: 'gigvora', keyid: env.JWT_KID }`, `verifyOptions: { algorithms: ['RS256'], issuer: 'gigvora' }`). Replace all 17 `JwtModule.register({ secret: ... ?? 'dev-secret-change-me' })` calls with `imports: [AuthSharedModule]`. Generate keypair via `openssl genrsa -out jwt.priv.pem 2048` (PEM); store private key as a **runtime secret** via `add_secret JWT_PRIVATE_KEY_PEM`; commit only the public key for verifiers in mobile/SSR.
5. Add a JWT **kid → keypair** map for grace-period rotation (`JWT_PRIVATE_KEYS_JSON` = `[{kid:'2026-04', priv:'...', notAfter:'2026-07-01'}, ...]`); verifiers accept any kid in the active set; signers always pick the most recent.

**KMS / envelope encryption**
6. New `apps/integrations/src/crypto/` module with provider-agnostic interface:
   ```ts
   export interface Kms {
     generateDataKey(): Promise<{ plaintext: Buffer; ciphertext: Buffer; keyId: string }>;
     decryptDataKey(ciphertext: Buffer, keyId: string): Promise<Buffer>;
   }
   ```
   - Adapters: `AwsKms` (`@aws-sdk/client-kms`), `GcpKms`, `LocalKms` (libsodium-sealed JSON file for dev/test).
   - Wrapper: `seal(plaintext, kms)` returns `{ ciphertext, encryptedDek, keyId, alg: 'AES-256-GCM' }` packaged as `<base64 nonce><base64 dek-ciphertext><base64 ciphertext><base64 tag>`.
   - LRU cache of decrypted DEKs (TTL 5 min, max 1000 entries) to avoid hammering KMS on hot paths.
7. Migration `00XX_pgcrypto_and_keyids.sql`:
   - `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
   - For every `*_ciphertext` column add `*_key_id text not null`, `*_alg text not null default 'AES-256-GCM'`, and `*_lookup_hash bytea` (deterministic SHA-256 with HMAC-keyed pepper for indexable equality search without revealing plaintext) where the column needs equality lookup (e.g., `tax_id_lookup_hash` for "find vendor by VAT").
   - Migrate `tax_id` → `tax_id_ciphertext`/`tax_id_key_id`/`tax_id_lookup_hash`; drop the plaintext column in a follow-up release after data migration job completes.
8. Service helpers in `apps/api-nest/src/common/sealed-field/` — `@SealedField('integrations.api_key')` Drizzle field decorator that auto-encrypts on write and decrypts on read, with the key id pulled from the row.

**Webhook / outbound secrets**
9. `outbound_webhooks.signing_secret_ciphertext` is already declared. Wire the encrypt path on subscription creation; wire the decrypt path in `outbound-webhooks.publisher.ts:286` (currently it does `crypto.createHmac('sha256', sub.secret)` — `sub.secret` must be the *decrypted* value pulled via the `SealedField` reader, not a column from the DB row).

**Log redaction**
10. Centralised Pino transport with `redact: { paths: [...], censor: '[REDACTED]', remove: false }` covering: `password`, `*.password`, `*.token`, `*.access_token`, `*.refresh_token`, `*.secret`, `*.api_key`, `*.signing_secret`, `*.private_key`, `Authorization`, `Cookie`, `*.bank_account`, `*.iban`, `*.tax_id`, `*.ssn`, `*.nin`, `req.body.password`, `req.body.token`, `req.headers.authorization`, `req.headers.cookie`. Mirror the deny-list into the audit-log writer (FD-03) and admin CSV exporter.
11. Add `tests/security/log-redaction.spec.ts` that hits `/auth/login` with a known password and asserts the password literal does not appear in any log stream.

**Transport**
12. Audit and pin: `DATABASE_URL` includes `sslmode=verify-full&sslrootcert=…`; `REDIS_URL` uses `rediss://`; AV scanner reachable only over TLS or unix socket; SMTP uses `STARTTLS`. Document in `docs/security/transport.md`.

**Mobile**
13. Audit `apps/mobile-flutter/lib/features/*/api.dart` for `flutter_secure_storage` usage on tokens; add CI lint that fails on `SharedPreferences.set*Token`.
14. Optional: HTTP cert-pinning helper for high-trust tiers (Recruiter Pro / Enterprise).

**Rotation runbook**
15. `docs/runbooks/secret-rotation.md` covering 8 secret families; each entry has: rotation cadence, dual-write/dual-verify procedure, validation steps, rollback. JWT entry shows the kid-overlap window for zero-downtime keypair rotation.

**Tests**
16. `tests/security/encryption-at-rest.spec.ts` — write a BYOK key, dump the row directly via psql, assert ciphertext column does not contain the plaintext substring.
17. `tests/security/jwt-algorithm.spec.ts` — `alg: none` rejected; `alg: HS256` rejected when verifier expects `RS256`; tampered signature rejected.
18. `tests/security/log-redaction.spec.ts` (per #11).
19. `tests/security/signed-url-ttl.spec.ts` — assert download URLs expire ≤ 5 min, upload URLs ≤ 15 min, replay after expiry rejected.

## 5. Mapping to Master Sign-Off Matrix
- **Primary**: G12 (security/compliance — encryption + secret hygiene + rotation).
- **Secondary**: G02 (no plaintext secrets in repo, no `dev-secret-change-me` fallback), G05 (sealed-column persistence pattern), G09 (Playwright security suites for encryption-at-rest, JWT alg, log redaction, signed-URL TTL).

## 6. Domain checklist matrix (Run 1 state)

| Validation Item | Tick | Evidence / File pointers |
|---|:-:|---|
| Business & technical purpose confirmed | ☑ | §1 |
| Frontend pages, tabs, widgets, forms, popups, drawers mapped | ☐ | BYOK settings page + payout/tax forms + admin secret consoles to enumerate Run 2 |
| Backend files and APIs complete | ☐ | bcrypt + HMAC verification ✅; KMS, envelope encryption, sealed-field decorator, redactor all absent |
| Supabase/demo data eliminated | ☐ | `dev-secret-change-me` fallback in 17 modules (P0) + `./.env` at repo root (verify) |
| Database schema, seeders, fixtures complete | ☐ | `*_ciphertext` columns declared but unaccompanied by `*_key_id` / `*_lookup_hash`; pgcrypto not installed; tax_id plaintext |
| ML / analytics / workers integrated | ☐ | analytics-python exports lack redaction; workers lack KMS-decrypt cache |
| Indexing/search/filter logic | ☐ | Equality search on encrypted columns requires `*_lookup_hash` (deterministic HMAC) — pattern not yet in place |
| Realtime / live data | n/a | n/a |
| Security & middleware protections | ☐ | 13 P0s open |
| Playwright logic-flow coverage | ☐ | encryption-at-rest, jwt-algorithm, log-redaction, signed-url-ttl specs absent |
| Mobile / API parity | ☐ | flutter_secure_storage usage unverified |
| Acceptance criteria passed | ☐ | Pending Run 2 + Run 4 |

## 7. Acceptance criteria (binding)
- A1. No occurrence of `'dev-secret-change-me'` (or any literal default secret) anywhere in `apps/` or `packages/`. CI grep gate enforces this forever.
- A2. `JWT_PRIVATE_KEY_PEM` + `JWT_PUBLIC_KEY_PEM` + `JWT_KID` configured; algorithm pinned to `RS256`; one shared `AuthSharedModule`; tampered/`alg: none`/HS256-confusion tokens rejected (`tests/security/jwt-algorithm.spec.ts` green).
- A3. `gitleaks` runs in CI; PR introducing a Stripe/JWT/AWS-shaped string is blocked.
- A4. `./.env` either removed from the repo or proven to contain only placeholders; `.gitignore` lists `.env` and `.env.*` (except `.env.example`); any leaked credential rotated.
- A5. Envelope-encryption helper present; `pgcrypto` extension installed; every `*_ciphertext` column has matching `*_key_id` + `*_lookup_hash` (where indexed); `tax_id` migrated to sealed column; `tests/security/encryption-at-rest.spec.ts` proves dumped rows do not contain plaintext.
- A6. Outbound webhook signing secrets are sealed at write, decrypted at HMAC time; nothing reads `*.secret` columns directly.
- A7. Pino redaction in place; `tests/security/log-redaction.spec.ts` proves password literal does not appear in any log stream after a login attempt.
- A8. All transport TLS-pinned: `DATABASE_URL` uses `sslmode=verify-full`; Redis uses `rediss://`; AV scanner over TLS or unix socket. Documented in `docs/security/transport.md`.
- A9. Signed download URLs ≤ 5 min TTL; upload URLs ≤ 15 min TTL; replay after expiry rejected (`tests/security/signed-url-ttl.spec.ts` green).
- A10. Secret rotation runbook published at `docs/runbooks/secret-rotation.md` covering ≥8 secret families with zero-downtime procedure for JWT keypair.
- A11. Refresh tokens stored hashed in `session_registry` (FD-01 link); plaintext never persisted.
- A12. Mobile tokens stored only via `flutter_secure_storage`; CI lint forbids SharedPreferences for token-shaped keys.
- A13. Backup encryption strategy documented (depends on FD-06 #7 landing); KMS key for backups is independent from KMS key for live data.

---
_Status: Run 1 ☑ Audit · Run 2 ☐ Build · Run 3 ☐ Integrate · Run 4 ☐ Validate. Note: rate-limiting recommendations omitted per platform constraint; KMS-decrypt throughput defended via per-process LRU cache of decrypted DEKs (5-min TTL, bounded size) + per-service connection-pool caps + bounded BullMQ worker concurrency._

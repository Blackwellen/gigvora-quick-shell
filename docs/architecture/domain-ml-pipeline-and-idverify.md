# Domain — ML Pipeline Registry & ID-Verifier Connectors

## Storage location (CRITICAL)

Per the **no-domain-code-in-supabase** rule, all tables for this domain live
in the user's own Postgres (DATABASE_URL), NEVER in Lovable Cloud:

| Layer | Path |
|---|---|
| Postgres migration | `packages/db/migrations/0084_ml_pipeline_and_idverify.sql` |
| Drizzle schema | `packages/db/src/schema/ml-pipeline.ts` |
| NestJS module | `apps/api-nest/src/modules/ml-pipeline/` |
| Python ML | `apps/ml-python/app/{fraudnet,idverify,botdetect,reviewguard,ml_pipeline_health}.py` |
| Frontend hook | `src/hooks/useMlPipeline.ts` |
| Admin UI cards | `src/components/admin/{MlPipelineHealthCard,IdVerifyConnectorsCard}.tsx` |

A previous run mistakenly created these tables in Lovable Cloud
(`supabase/migrations/20260418134204_*` and `…134228_*`). Those tables were
dropped by the cleanup migration `20260418_…drop_ml_in_cloud.sql`.

## Tables

### `ml_models` (registry)
- `name`, `version`, `kind` ∈ {fraud, identity, bot, review, payment,
  collusion, moderation, ranker, other}, `active`.

### `ml_model_performance` (append-only history)
- `model_id`, `precision`, `recall`, `latency_p95_ms`, `uptime_pct`,
  `sample_size`, `sampled_at`. Trigger blocks UPDATE/DELETE.

### `ml_scores` (append-only history)
- `model_id`, `subject_kind`, `subject_id`, `score`, `band`, `flag`,
  `components`, `reason`. Trigger blocks UPDATE/DELETE.

### `id_verify_connectors`
- One row per provider (`onfido`, `veriff`, `persona`, `stripe_identity`,
  `manual`). `enabled` toggle; `priority` controls routing order.
- **Envelope-encrypted secret**: `config_secret_ciphertext` + `_iv` + `_tag` +
  `_key_version`, AES-256-GCM. Plaintext NEVER stored. See
  `ml-pipeline.crypto.ts` and the master-settings shared root key.
- `config_public` holds non-secret JSON (region, webhook URL, callback prefix).

### `id_verify_connector_events` (audit log)
- One row per `enable | disable | rotate_secret | update_config |
  health_probe | create`. Records actor, IP, user agent, before/after.

## NestJS HTTP surface (`/api/v1/ml-pipeline`)

| Method | Path | Role | Purpose |
|---|---|---|---|
| GET  | `/health` | viewer+ | Aggregated per-model health for the card |
| POST | `/performance` | admin or `system` | Ingest one performance sample |
| POST | `/scores` | admin or `system` | Write one ML score |
| GET  | `/scores?subjectKind=&ids=…` | viewer+ | Latest scores per subject id |
| GET  | `/id-verify/connectors` | viewer+ | List provider matrix (no plaintext secrets) |
| POST | `/id-verify/connectors/:id/toggle` | admin | Enable/disable a provider |
| POST | `/id-verify/connectors/:id/secret` | admin | Rotate envelope-encrypted secret + public config |
| GET  | `/id-verify/connectors/:id/events` | admin | Audit log |

## Determinism & 16 GB-VPS rule

`pipelineHealth()` calls FastAPI `/ml/pipeline-health` for aggregation but has
an **identical-shape in-process aggregator** (`aggregateLocally`) so the card
never blanks if Python is down. No GPU. No model weights at default.

## Security

- All endpoints require JWT (`AuthGuard('jwt')`).
- Connector mutations require `isAdmin(role)` in `ML_PIPELINE_ADMIN_ROLES`.
- Connector secrets are **only** decrypted server-side inside
  `MlPipelineService.resolveConnectorSecret()` — never sent to the frontend.
- Audit log is append-only and includes IP + UA.

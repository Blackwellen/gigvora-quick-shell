# FD-17 — Master Settings Backbone, Legal/Consent, KPI Assignment, Entitlements, Role Lifecycle, Kill-Switch Matrix

Closes the FD-17 audit gap. Wires every super-admin governance surface into
the Gigvora SDK + NestJS backend; no Lovable Cloud, no mocks. ML insights
ride on the deterministic analytics rule per the enterprise-grade rule.

## Persistence — `packages/db/migrations/0083_master_settings_backbone.sql`

| Table | Purpose |
|---|---|
| `master_settings_entries` | All namespace/key/env settings rows. Secret rows store an envelope (kek_id + enc_dek + enc_value + iv + tag + fingerprint + last4). |
| `master_settings_pending_changes` | Two-person rule ledger: every write to a `TWO_PERSON_NAMESPACE` (`smtp`, `connectors`, `apiKeys`, `finance`) and every kill-switch flip lands here first. Approver must differ from proposer. 24-hour TTL. |
| `master_legal_docs` | CMS-backed Terms / Privacy / Cookies / DPA / AUP / Community. |
| `master_consent_ledger` | Append-only consent records (trigger-enforced). |
| `master_kpi_definitions` / `master_kpi_snapshots` | KPI catalogue + observed values, scoped by portal (`cs`, `finance`, `moderator`, `marketing`, `ops`, `super`). |
| `master_portal_entitlements` | Portal × role matrix with `requires_second_approver` flag. |
| `master_internal_accounts` | Admin account lifecycle (mint / freeze / unfreeze). |
| `master_kill_switches` | One row per domain (`payments`, `payouts`, `signups`, `messaging`, `reels`, `webinars`, `jobs_apply`, `gigs_purchase`, `mobile_push`, `public_api`). |

## NestJS — `apps/api-nest/src/modules/master-settings/`

`/api/v1/master-settings` (JWT-guarded; `RolesGuard` enforces `@AdminRoles()`):

| Verb | Path | Roles | Notes |
|---|---|---|---|
| GET | `/bundle?namespace=&env=` | viewer+ | Returns entries with secrets reduced to `{ fingerprint, last4 }`. |
| PATCH | `/entry` | sa_operator+ | Two-person namespaces return `202 { pendingChangeId }`. |
| POST | `/changes/:id/approve` | sa_admin+ | Approver must differ from proposer. |
| POST | `/changes/:id/reject` | sa_admin+ | |
| GET | `/legal` | viewer+ | |
| PATCH | `/legal` | sa_admin+ | Publishes new version + flips `requiresReConsent`. |
| POST | `/consent` | any | Captures IP + UA into immutable ledger. |
| GET | `/kpis?portal=` | viewer+ | |
| PATCH | `/kpis` | sa_admin+ | Bind FD-13 KPIs to portals. |
| GET | `/entitlements` | viewer+ | |
| PATCH | `/entitlements` | sa_root | |
| GET | `/roles/accounts` | sa_admin+ | |
| POST | `/roles/mint` | sa_root | |
| POST | `/roles/:id/freeze` | sa_admin+ | |
| POST | `/roles/:id/unfreeze` | sa_root | |
| GET | `/kill-switches` | viewer+ | |
| POST | `/kill-switches/:domain/activate` | sa_admin+ then sa_root via approval | |
| POST | `/kill-switches/:domain/clear` | sa_root then sa_root via approval | |

### Envelope encryption

`apps/api-nest/src/modules/master-settings/master-settings.crypto.ts` —
AES-256-GCM, KEK from `MASTER_SETTINGS_KEK_BASE64`, fresh DEK per row.
Fingerprint is `sha256(plaintext).slice(0,12)` for duplicate detection.

### Two-person rule

Implemented in `master-settings.service.ts`. Any write to `smtp`,
`connectors`, `apiKeys`, `finance` returns `pending_two_person`. Kill-switch
activations and clears always go through pending-change. The approver cannot
be the proposer; expired pending changes auto-reject.

## Analytics — `apps/analytics-python/app/master_settings_backbone.py`

`POST /master-settings/insights` — deterministic rules: pending backlog,
active kill switches, frozen accounts, KPI red bands, duplicate secret
fingerprints. NestJS mirrors logic for fallback (per ML enterprise-grade rule).

## SDK — `packages/sdk/src/master-settings-backbone.ts`

Exported as `MasterSettingsTypes` namespace from `packages/sdk/src/index.ts`.

## React hooks — `src/hooks/useMasterSettings.ts`

`useSettingsBundle`, `useUpsertSettingsEntry`, `useApprovePendingChange`,
`useRejectPendingChange`, `useLegalDocs`, `usePublishLegalDoc`,
`useRecordConsent`, `useKpis`, `useUpsertKpi`, `useEntitlementMatrix`,
`useUpdateEntitlement`, `useInternalAccounts`, `useMintAccount`,
`useFreezeAccount`, `useUnfreezeAccount`, `useKillSwitchMatrix`,
`useActivateKillSwitch`, `useClearKillSwitch`. All have fixture fallbacks.

## Logic-flow validation

| Path | Coverage |
|---|---|
| Primary entry | `GET /bundle` |
| Primary completion | `PATCH /entry` → committed or pending |
| Approval / blocked | Two-person rule on smtp/connectors/apiKeys/finance + kill-switches |
| Degraded / stale | Analytics down → in-process deterministic insights |
| Retry / recovery | Pending change expiry auto-rejects |
| Manual override | `kill-switches/:domain/clear` (sa_root + second approver) |
| Cross-domain handoff | Audit ledger entries flow to `sa_audit` (super-admin domain) |
| Mobile | Flutter remote-config namespace `mobile` reads from `/bundle` |
| Audit / notification side | `super-admin-command-center` audit logs every mutation with IP/UA |

## UK posture

* GDPR — consent ledger immutable, IP + UA captured, withdrawal supported.
* Lawful processing — every mutation passes role gate + (where applicable) two-person rule + audit.
* Retention — `archived` entries persist; consent ledger never deleted.
* Secure logging — append-only consent ledger via trigger.
* FCA / payment safety — `kill_switch:payments` and `kill_switch:payouts` block payment rails platform-wide; `finance` namespace edits require second approver.

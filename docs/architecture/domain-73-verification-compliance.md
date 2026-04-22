# Domain 73 — Verification, Compliance, and Identity Review Dashboard

Primary route family: `/internal/verification-compliance-dashboard`

## Persistence — `packages/db/migrations/0081_verification_compliance.sql`

| Table              | Purpose                                                                 |
|--------------------|-------------------------------------------------------------------------|
| `vc_cases`         | Verification cases across programs (kyc, kyb, aml, sanctions, address, tax, accreditation, right_to_work, professional_licence). Holds `risk_score`, `risk_band`, `status`, `queue`, `assigned_to`, `sla_due_at`, `expires_at`. |
| `vc_documents`     | Uploaded identity / supporting documents with OCR fields, liveness/match scores, accept/reject status. |
| `vc_checks`        | Provider checks (Onfido, Sumsub, Companies House, HMRC, sanctions list, manual). Result: pending/clear/consider/rejected/error. |
| `vc_decisions`     | Operator decisions: approve, reject, request_more_info, step_up, hold, escalate, dismiss, expire, renew. |
| `vc_watchlist`     | Subject-level watchlist (PEP, sanctions, adverse media). |
| `vc_events`        | **Append-only** audit ledger. Update/delete blocked by trigger `vc_events_immutable`. |

State machine (`vc_cases.status`):

```
pending → reviewing → holding ↔ reviewing
                    ↘ approved → expired → reviewing
                    ↘ rejected → archived
                    ↘ escalated → approved | rejected | archived
```

Critical-band approve/reject requires `vc_admin`. Escalation, step-up, expire, renew, watchlist-add require `vc_lead` or higher.

## NestJS — `apps/api-nest/src/modules/verification-compliance/`

| File | Role |
|------|------|
| `dto.ts`                                  | Zod schemas + `VC_TRANSITIONS` + `QUEUE_BY_STATUS` |
| `verification-compliance.repository.ts`   | All SQL access (parameterised). `claimNext` uses `FOR UPDATE SKIP LOCKED`. |
| `verification-compliance.service.ts`      | Role ladder enforcement, ML/analytics calls with deterministic fallbacks, audit writes. |
| `verification-compliance.controller.ts`   | REST endpoints under `/api/v1/verification-compliance` (JWT-guarded). |
| `verification-compliance.module.ts`       | Wires the module into `AppModule`. |

### Endpoints

| Verb  | Path                              | Notes                                        |
|-------|-----------------------------------|----------------------------------------------|
| GET   | `/overview`                       | KPIs + 3 queues + watchlist + insights + desk-risk |
| GET   | `/cases`                          | Paginated, filterable list                   |
| GET   | `/cases/:id`                      | Case + documents + checks + decisions + events |
| POST  | `/cases`                          | Create + ML score                            |
| PATCH | `/cases/transition`               | Validated by `VC_TRANSITIONS`                |
| PATCH | `/cases/assign`                   |                                              |
| POST  | `/cases/claim-next`               | `SKIP LOCKED` queue jump                     |
| POST  | `/cases/decide`                   | Records decision + transitions case          |
| POST  | `/documents`                      | Add a document (case must exist)             |
| PATCH | `/documents/review`               | Accept/reject/expire a document              |
| POST  | `/checks/run`                     | Run a provider check (with ML fallback)      |
| GET   | `/watchlist`                      | Watchlist list                               |
| POST  | `/watchlist`                      | Lead+ only                                   |
| DELETE| `/watchlist/:id`                  | Admin only                                   |

### Role ladder

| Role         | Can do                                                                                     |
|--------------|--------------------------------------------------------------------------------------------|
| `viewer`     | Read everything                                                                            |
| `vc_analyst` | Claim, transition non-destructive, request more info, hold, approve/reject low+normal cases, dismiss, accept/reject documents, run checks |
| `vc_lead`    | + Escalate, approve/reject high-band cases, step-up, expire, renew, watchlist add          |
| `vc_admin`   | + Approve/reject critical-band, watchlist remove                                           |

## Python ML & Analytics

* `apps/ml-python/app/verification_compliance.py`
  * `POST /verification-compliance/score-case` — programs, jurisdiction, deterministic risk score + band
  * `POST /verification-compliance/score-check` — deterministic stub: sanctions/PEP → consider, document → clear, otherwise consider
  * `POST /verification-compliance/desk-risk` — desk-level operational risk score
* `apps/analytics-python/app/verification_compliance.py`
  * `POST /verification-compliance/insights` — operational summaries (sla_breached, critical_cases, escalations, expiring_soon, triage_backlog)

NestJS service calls these with `AbortSignal.timeout(2000)` and falls back to identical local logic when the Python services are unreachable. ML decisions never auto-act — humans always review.

## SDK — `packages/sdk/src/verification-compliance.ts`

Exports typed contracts (`VcOverview`, `VcCase`, `VcCaseDetail`, `VcWatchlistEntry`, `VcList<T>`, etc.). Re-exported from `packages/sdk/src/index.ts` as `VerificationComplianceTypes` (namespaced because `CaseStatus`, `CaseQueue`, `Severity`, `Band`, `Decision` collide with sibling domains).

## React — `src/hooks/useVerificationCompliance.ts`

TanStack Query hooks with 30 s `refetchInterval` on overview and per-action mutations that invalidate the `verification-compliance` query family. All hooks return fixture fallbacks when `VITE_GIGVORA_API_URL` is unset.

## Mobile — `apps/mobile-flutter/lib/features/verification_compliance/`

Stack-card screen with KPI strip (`SLA breached`, `Critical`, `Triage`, `Expiring 30d`, `Watchlist`, `Desk risk`), insight cards, review queue list, "Claim next" FAB. Pull-to-refresh.

## Logic-flow validation

| Path | Coverage |
|------|----------|
| Primary entry            | `GET /overview` (web + mobile + Flutter) |
| Primary completion       | `POST /cases/decide` → `approve` → audit ledger entry |
| Happy path               | Create → ML score → claim → review documents → run checks → approve |
| Approval path            | `decide:approve` (lead for high, admin for critical) |
| Blocked path             | Critical-band approve without `vc_admin` → `403 vc_admin_required_for_critical` |
| Degraded / stale path    | Python down → fixture fallbacks for ML, analytics, desk-risk |
| Retry / recovery path    | `expired` status → can re-enter `reviewing` via state machine |
| Manual override path     | `decide:renew` extends `expires_at` by `durationDays` |
| Cross-domain handoff     | `escalate` queue jump to `escalation`; watchlist hits surface in Trust & Safety (Domain 71) |
| Mobile / touch variant   | Flutter "Claim next" FAB |
| Audit / notification     | `vc_events` immutable trigger + IP capture |

## UK posture

* GDPR — OCR text is captured but the controller intentionally does not stream it back to the client; only structured `ocr_fields` are returned.
* Lawful processing — cases are only created via authenticated, role-gated routes.
* Retention — `expires_at` per case (KYC default 365 d, professional licence default 730 d in seeders) drives renewal flows.
* Secure logging — `vc_events` captures `actor_id`, `from_state`, `to_state`, `ip` and is append-only.
* FCA / payment safety — sanctions / PEP checks gate downstream payouts via the existing payouts-escrow module's risk hooks.

## Tests

* `tests/playwright/verification-compliance.spec.ts` — surface mount checks for the 5 internal routes.

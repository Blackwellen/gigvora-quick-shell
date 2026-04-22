# Domain 32 — Projects Browse, Search & Discovery Marketplace

**Status:** Backend + SDK + frontend wiring shipped (single-sweep).
**Routed workbench:** `/app/projects-browse` (mounted via existing
`ProjectsSearchPage` at `src/pages/explore/ProjectsSearchPage.tsx`).
**API base:** `/api/v1/projects-browse/*`

## Files
- `apps/api-nest/src/modules/projects-browse-discovery/`
  - `dto.ts` — Zod schemas for filters, saved searches, proposals, decisions, flags, invites, attachments
  - `projects-browse-discovery.repository.ts` — In-memory store + 48 seeded projects, explicit state machines
  - `projects-browse-discovery.ml.service.ts` — Deterministic explainable ranking + per-row match score
  - `projects-browse-discovery.analytics.service.ts` — KPI band + anomaly notes
  - `projects-browse-discovery.service.ts` — Orchestration + audit emit
  - `projects-browse-discovery.controller.ts` — 16 REST endpoints
  - `projects-browse-discovery.emit.ts` — `D32Emit` (18 outbound webhooks + bus) + `D32Adapters` (third-party adapter map)
  - `projects-browse-discovery.module.ts` — Nest module (registered in `app.module.ts`)
- `packages/sdk/src/projects-browse-discovery.ts` — typed client + DTO mirrors (subpath export `@gigvora/sdk/projects-browse-discovery`)
- `src/hooks/useProjectsBrowseDiscovery.ts` — TanStack Query hooks with safe-fetch fallback + Socket.IO subscriptions
- `src/pages/explore/ProjectsSearchPage.tsx` — wired to live SDK (mock array removed)

## State machines
- **project**: `draft → open ↔ paused → in_review → awarded → completed | cancelled`
- **proposal**: `draft → submitted → shortlisted ↔ changes_requested | rejected | accepted | withdrawn`
- **saved-search**: `inactive ↔ active → snoozed → active → archived`

## Webhook + cross-domain bus events (18)
`pbd.search.executed`, `pbd.bookmark.toggled`, `pbd.saved-search.upserted`,
`pbd.saved-search.removed`, `pbd.saved-search.alert.scheduled`,
`pbd.proposal.drafted`, `pbd.proposal.submitted`, `pbd.proposal.withdrawn`,
`pbd.proposal.shortlisted`, `pbd.proposal.rejected`, `pbd.proposal.accepted`,
`pbd.project.viewed`, `pbd.project.flagged`, `pbd.project.invited`,
`pbd.project.transitioned`, `pbd.match.notified`, `pbd.attachment.uploaded`,
`pbd.attachment.scanned`, `pbd.attachment.removed`.

## Third-party adapter map (D32Adapters)
| Surface       | Adapters                                |
|---------------|-----------------------------------------|
| storage       | s3, gcs, azure-blob, r2                 |
| av-scanning   | clamav, virustotal                      |
| search        | opensearch, algolia, typesense          |
| email         | resend, ses, smtp                       |
| sms-push      | twilio, expo, fcm, apns                 |
| crm           | hubspot, salesforce, pipedrive          |
| ats-handoff   | greenhouse, ashby, lever                |
| payments      | stripe, wise                            |
| webhooks      | outbound: D32Emit · inbound: webhook-gateway |

## Carry-overs / next sweep
- Drizzle schema + Postgres migration for `pbd_projects`, `pbd_proposals`, `pbd_saved_searches`, `pbd_bookmarks`, `pbd_attachments`, `pbd_flags`, `pbd_invitations`, `pbd_audit`.
- Python ML ranking + analytics router + `main.py` registration.
- Flutter feature pack with bottom-sheet filters + sticky propose bar.
- Playwright spec for search → bookmark → propose → submit → decide flow.
- Adapter wiring inside `apps/integrations` for storage + av-scan + email cadence delivery.

/**
 * Domain 30 — Cross-Cutting Integration Pack
 *  - Outbound webhooks (HMAC, retry, DLQ, replay)
 *  - Domain adapter map (calendar/email/SMS/ATS/CRM/storage/voice/AI)
 *  - Cross-domain event bus (D24↔D25↔D26↔D27↔D28↔D29)
 *
 * This is now a HARD requirement for every future domain pack. See
 * `mem://tech/outbound-webhooks-rule`, `mem://tech/adapter-map-rule`, and
 * `mem://tech/cross-domain-bus-rule`.
 *
 * ## Backfill applied to D24–D29
 *
 * | Domain | Outbound events                                                        | Adapter map (default → opt-in)                              | Consumes from bus                          |
 * |--------|------------------------------------------------------------------------|-------------------------------------------------------------|--------------------------------------------|
 * | D24    | posting.published/paused/archived, credits.purchased/consumed          | storage:local→S3/R2, payments:credits→stripe, ai:lovable→openai | (none)                                  |
 * | D25    | application.submitted/advanced/rejected/withdrawn                      | email:smtp→resend, storage:local→S3, ats:none→hubspot/ashby | posting.published, outreach.sent           |
 * | D26    | requisition.opened/approved/closed                                     | ats:none→greenhouse/ashby/lever, crm:none→hubspot/sf, analytics | application.submitted                      |
 * | D27    | search.saved, prospect.added, prospect.status.changed, outreach.sent/replied | email:smtp→resend, sms:none→twilio, ai:lovable→openai | scorecard.submitted                        |
 * | D28    | card.created/moved, card.note.added, card.mention                      | ats:none→greenhouse/ashby, ai:lovable→openai, analytics     | application.submitted, prospect.qualified, interview.completed |
 * | D29    | interview.created/transitioned/rescheduled, interviewer.responded, scorecard.drafted/submitted/withdrawn, calibration.opened/decided, panel.created/updated/status | calendar:ics→google/ms-graph, voice:jitsi→daily/zoom, email:smtp→resend, ai:lovable→openai | card.moved→interview |
 *
 * ## Files
 * - `apps/api-nest/src/modules/outbound-webhooks/*` — publisher + controller
 * - `apps/api-nest/src/modules/domain-bus/*` — bus + cross-wiring + boot
 * - `apps/api-nest/src/modules/integrations/*` — adapter map endpoint
 * - `apps/integrations/src/domain-adapter-map.ts` — declarative map per domain
 * - `packages/sdk/src/webhooks.ts` — typed client + verifySignature() for tenants
 * - `src/hooks/useWebhooks.ts` — workbench tab data hooks
 * - `src/hooks/useCrossDomainContext.ts` — adjacency hook
 * - `src/components/integrations/DomainWebhooksTab.tsx` — drop-in tab UI
 *
 * ## Endpoints
 * - `GET/POST /api/v1/webhook-subscriptions`            — subscribe/list
 * - `POST    /api/v1/webhook-subscriptions/:id/rotate-secret`
 * - `DELETE  /api/v1/webhook-subscriptions/:id`         — deactivate
 * - `GET     /api/v1/webhook-deliveries`                — log w/ filters
 * - `POST    /api/v1/webhook-deliveries/:id/replay`     — replay from DLQ
 * - `GET     /api/v1/integrations/adapter-map[/:domain]`
 * - `GET     /api/v1/domain-bus/catalog`                — cross-domain links
 * - `GET     /api/v1/domain-bus/context/:entityId`      — adjacency preview
 *
 * ## Privacy
 * Outbound webhooks honour the same tenant + recruiter-scope envelope as the
 * in-app payload. Recruiting events (interview, scorecard, calibration) are
 * only delivered to subscriptions owned by the recruiter tenant.
 */
export const DOC_VERSION = '1.0';

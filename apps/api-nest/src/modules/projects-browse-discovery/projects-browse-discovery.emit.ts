/**
 * D32 emit helpers — outbound webhooks + cross-domain bus.
 *
 * Every meaningful state transition publishes an outbound webhook AND emits
 * onto the cross-domain bus so consumers (notifications, milestones, finance,
 * audit) can react. This file is the single source of truth for D32's public
 * event surface — adding an event here also requires extending the
 * `WebhookEvent` union in outbound-webhooks/outbound-webhooks.publisher.ts.
 *
 * Required by the Webhook + Cross-Section rule (mem://tech/webhook-and-cross-section-rule):
 * every implementation must wire outbound publishers + cross-domain bus links.
 */
import { outboundWebhooks, type WebhookEvent } from '../outbound-webhooks/outbound-webhooks.publisher';
import { domainBus } from '../domain-bus/domain-bus';

const T = (tenantId: string) => tenantId || 'tenant-demo';
function emit(event: WebhookEvent, entityType: string, entityId: string, payload: any, tenantId: string) {
  void outboundWebhooks.publish({ tenantId, event, entityType, entityId, payload });
  domainBus.emit(event, { tenantId, entityType, entityId, payload });
}

export const D32Emit = {
  searchExecuted:        (t: string, id: string, p: any) => emit('pbd.search.executed',          'pbd-search',     id, p, T(t)),
  bookmarkToggled:       (t: string, id: string, p: any) => emit('pbd.bookmark.toggled',         'pbd-bookmark',   id, p, T(t)),
  savedSearchUpserted:   (t: string, id: string, p: any) => emit('pbd.saved-search.upserted',    'pbd-saved',      id, p, T(t)),
  savedSearchRemoved:    (t: string, id: string, p: any) => emit('pbd.saved-search.removed',     'pbd-saved',      id, p, T(t)),
  savedSearchAlertScheduled: (t: string, id: string, p: any) => emit('pbd.saved-search.alert.scheduled', 'pbd-saved', id, p, T(t)),
  proposalDrafted:       (t: string, id: string, p: any) => emit('pbd.proposal.drafted',         'pbd-proposal',   id, p, T(t)),
  proposalSubmitted:     (t: string, id: string, p: any) => emit('pbd.proposal.submitted',       'pbd-proposal',   id, p, T(t)),
  proposalWithdrawn:     (t: string, id: string, p: any) => emit('pbd.proposal.withdrawn',       'pbd-proposal',   id, p, T(t)),
  proposalShortlisted:   (t: string, id: string, p: any) => emit('pbd.proposal.shortlisted',     'pbd-proposal',   id, p, T(t)),
  proposalRejected:      (t: string, id: string, p: any) => emit('pbd.proposal.rejected',        'pbd-proposal',   id, p, T(t)),
  proposalAccepted:      (t: string, id: string, p: any) => emit('pbd.proposal.accepted',        'pbd-proposal',   id, p, T(t)),
  projectViewed:         (t: string, id: string, p: any) => emit('pbd.project.viewed',           'pbd-project',    id, p, T(t)),
  projectFlagged:        (t: string, id: string, p: any) => emit('pbd.project.flagged',          'pbd-project',    id, p, T(t)),
  projectInvited:        (t: string, id: string, p: any) => emit('pbd.project.invited',          'pbd-project',    id, p, T(t)),
  projectTransitioned:   (t: string, id: string, p: any) => emit('pbd.project.transitioned',     'pbd-project',    id, p, T(t)),
  matchNotified:         (t: string, id: string, p: any) => emit('pbd.match.notified',           'pbd-match',      id, p, T(t)),
  attachmentUploaded:    (t: string, id: string, p: any) => emit('pbd.attachment.uploaded',      'pbd-attachment', id, p, T(t)),
  attachmentScanned:     (t: string, id: string, p: any) => emit('pbd.attachment.scanned',       'pbd-attachment', id, p, T(t)),
  attachmentRemoved:     (t: string, id: string, p: any) => emit('pbd.attachment.removed',       'pbd-attachment', id, p, T(t)),
};

/**
 * Third-party / cross-platform integration adapter map for D32.
 * Mandated by mem://tech/third-party-integration-rule — every domain pack
 * must explicitly declare its adapter surface.
 *
 *   storage:    S3 / GCS / Azure Blob / Cloudflare R2  (project briefs, NDAs, attachments)
 *   av-scanning: ClamAV worker / VirusTotal            (uploaded attachments)
 *   search:     OpenSearch / Algolia / Typesense       (faceted discovery + autocomplete)
 *   email:      Resend / SES / SMTP                    (saved-search alerts, invitations)
 *   sms-push:   Twilio / Expo / FCM / APNS             (urgent match notifications)
 *   crm:        HubSpot / Salesforce / Pipedrive       (client + lead sync)
 *   ats-handoff: Greenhouse / Ashby / Lever            (when a project becomes a hire)
 *   payments:   Stripe / Wise                          (escrow on milestone acceptance)
 *   webhooks:   outbound publisher (this file) + inbound apps/webhook-gateway
 */
export const D32Adapters = {
  storage: ['s3', 'gcs', 'azure-blob', 'r2'],
  avScanning: ['clamav', 'virustotal'],
  search: ['opensearch', 'algolia', 'typesense'],
  email: ['resend', 'ses', 'smtp'],
  smsPush: ['twilio', 'expo', 'fcm', 'apns'],
  crm: ['hubspot', 'salesforce', 'pipedrive'],
  atsHandoff: ['greenhouse', 'ashby', 'lever'],
  payments: ['stripe', 'wise'],
  webhooks: { outbound: 'D32Emit', inbound: 'apps/webhook-gateway' },
} as const;
